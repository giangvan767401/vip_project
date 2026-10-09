"""
FastAPI WebSocket server for real-time emotion detection.
Browser sends webcam frames → FastAPI detects faces & predicts emotions → returns results as JSON.
"""

import os
import sys
import json
import base64
import time
import asyncio
import hmac
import hashlib
from collections import defaultdict, deque
from datetime import datetime

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ── Add src/training to path so we can import predict_emotion & centroid_tracker ──
TRAINING_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "training")
sys.path.insert(0, TRAINING_DIR)

from centroid_tracker import CentroidTracker
import predict_emotion

# ── App setup ──
app = FastAPI(title="Emotion Detection Web")

# ── CORS setup ──
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ── Emotion colors (RGB for frontend) ──
EMOTION_COLORS = {
    "Angry":    "#FF4444",
    "Disgust":  "#66BB6A",
    "Fear":     "#AB47BC",
    "Happy":    "#FFD600",
    "Sad":      "#42A5F5",
    "Surprise": "#FF7043",
    "Neutral":  "#9E9E9E",
}

# ── Haar cascade ──
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# ── Smoothing config ──
SMOOTHING_WINDOW = 5

# ── JWT verification config ──
JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_mindlog_jwt_key_change_in_production")


def verify_jwt_token(token: str | None) -> dict | None:
    """Verify HS256 JWT token using Python standard library."""
    if not token or not isinstance(token, str):
        return None
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts

        def b64url_decode(s: str) -> bytes:
            padding = "=" * (-len(s) % 4)
            return base64.urlsafe_b64decode(s + padding)

        signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = b64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload = json.loads(b64url_decode(payload_b64).decode("utf-8"))
        if "exp" in payload and payload["exp"] < time.time():
            return None

        return payload
    except Exception:
        return None


@app.get("/")
async def root():
    """Serve the frontend."""
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Handle real-time webcam frame processing via WebSocket."""
    # ── Authenticate via JWT ──
    token = ws.query_params.get("token")
    if not token:
        auth_header = ws.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    user_payload = verify_jwt_token(token)
    if not user_payload:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized: Missing or invalid token")
        return

    await ws.accept()

    tracker = CentroidTracker(max_disappeared=30)
    emotion_history: dict[int, deque] = defaultdict(lambda: deque(maxlen=SMOOTHING_WINDOW))
    frame_count = 0
    prev_time = time.time()

    try:
        while True:
            # Receive base64-encoded JPEG frame from browser
            data = await ws.receive_text()
            msg = json.loads(data)

            if msg.get("type") != "frame":
                continue

            # Decode base64 → numpy array
            img_data = msg["data"]
            # Strip data URL prefix if present
            if "," in img_data:
                img_data = img_data.split(",", 1)[1]

            img_bytes = base64.b64decode(img_data)
            np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if frame is None:
                continue

            # Flip horizontally for mirror effect
            frame = cv2.flip(frame, 1)

            # ── Face detection ──
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

            # ── Centroid tracking ──
            rects = [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]
            objects = tracker.update(rects)

            # ── Build result list ──
            detections = []
            frame_count += 1

            for object_id, centroid in objects.items():
                for (x, y, w, h) in rects:
                    cx, cy = x + w // 2, y + h // 2
                    if abs(centroid[0] - cx) < 10 and abs(centroid[1] - cy) < 10:
                        face_img = frame[y:y + h, x:x + w]

                        # Predict every 3rd frame for performance
                        if frame_count % 3 == 0:
                            _, emotion, _, probs = predict_emotion.predict_emotion(face_img)
                            if probs is not None:
                                emotion_history[object_id].append(probs.tolist())

                        # Smoothing
                        if len(emotion_history[object_id]) > 0:
                            avg_probs = np.mean(emotion_history[object_id], axis=0)
                            smoothed_index = int(np.argmax(avg_probs))
                            smoothed_emotion = predict_emotion.emotion_labels[smoothed_index]

                            scores = {
                                predict_emotion.emotion_labels[i]: round(float(avg_probs[i]) * 100, 1)
                                for i in range(len(predict_emotion.emotion_labels))
                            }

                            detections.append({
                                "id": int(object_id),
                                "x": int(x),
                                "y": int(y),
                                "w": int(w),
                                "h": int(h),
                                "emotion": smoothed_emotion,
                                "scores": scores,
                                "probabilities": scores,
                                "color": EMOTION_COLORS.get(smoothed_emotion, "#00FF00"),
                            })
                        break

            # ── FPS ──
            curr_time = time.time()
            fps = 1.0 / max(curr_time - prev_time, 0.001)
            prev_time = curr_time

            # ── Primary face result (for easy logging) ──
            primary_emotion = detections[0]["emotion"] if detections else "Neutral"
            primary_scores = detections[0]["scores"] if detections else {}

            # ── Send response ──
            response = {
                "type": "result",
                "emotion": primary_emotion,
                "scores": primary_scores,
                "fps": round(fps, 1),
                "detections": detections,
                "frame_width": frame.shape[1],
                "frame_height": frame.shape[0],
            }
            await ws.send_text(json.dumps(response))

    except WebSocketDisconnect:
        print("🔌 Client disconnected")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    print("🚀 Starting Emotion Detection Web Server...")
    print(f"📌 Open http://{host}:{port} in your browser")
    uvicorn.run(app, host=host, port=port)
