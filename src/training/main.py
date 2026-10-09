import sys
import os
import time
import csv
from collections import defaultdict, deque, Counter
from datetime import datetime
import matplotlib.pyplot as plt

import cv2
import numpy as np

sys.path.append(os.path.dirname(__file__))
from centroid_tracker import CentroidTracker
import predict_emotion

# 🎨 Màu theo cảm xúc
emotion_colors = {
    "Angry": (0, 0, 255),
    "Disgust": (0, 128, 0),
    "Fear": (128, 0, 128),
    "Happy": (0, 255, 255),
    "Sad": (255, 0, 0),
    "Surprise": (0, 165, 255),
    "Neutral": (128, 128, 128),
}

# 📁 Cấu hình smoothing và log
SMOOTHING_WINDOW = 5
emotion_history = defaultdict(lambda: deque(maxlen=SMOOTHING_WINDOW))
log_file_path = "emotion_log.csv"

# ✅ Tạo file log nếu chưa tồn tại
if not os.path.exists(log_file_path):
    with open(log_file_path, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Timestamp", "ID", "Emotion", "Probabilities"])

# 🚀 Webcam + Haar
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Không thể mở webcam.")
    exit()

print("🟢 Đang bật webcam... Nhấn 'q' để thoát.")
tracker = CentroidTracker()
frame_count = 0
prev_time = time.time()
all_emotions_logged = []

while True:
    ret, frame = cap.read()
    if not ret:
        print("⚠️ Không đọc được khung hình từ webcam.")
        break

    frame = cv2.flip(frame, 1)
    frame = cv2.convertScaleAbs(frame, alpha=1.1, beta=10)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
    objects = tracker.update(faces)

    for object_id, centroid in objects.items():
        for (x, y, w, h) in faces:
            cx, cy = x + w // 2, y + h // 2
            if abs(centroid[0] - cx) < 10 and abs(centroid[1] - cy) < 10:
                face_img = frame[y:y + h, x:x + w]

                if frame_count % 3 == 0:
                    _, emotion, _, probs = predict_emotion.predict_emotion(face_img)
                    if probs is not None:
                        emotion_history[object_id].append(probs)
                        all_emotions_logged.append(emotion)

                        # ✍️ Ghi log .csv
                        with open(log_file_path, mode="a", newline="") as f:
                            writer = csv.writer(f)
                            writer.writerow([
                                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                object_id,
                                emotion,
                                ";".join([f"{p:.4f}" for p in probs])
                            ])

                # ✅ Smoothing
                if len(emotion_history[object_id]) > 0:
                    avg_probs = np.mean(emotion_history[object_id], axis=0)
                    smoothed_index = int(np.argmax(avg_probs))
                    smoothed_emotion = predict_emotion.emotion_labels[smoothed_index]
                    color = emotion_colors.get(smoothed_emotion, (0, 255, 0))

                    # 📊 Biểu đồ cảm xúc
                    for i, prob in enumerate(avg_probs):
                        emo = predict_emotion.emotion_labels[i]
                        bar_x = x + w + 10
                        bar_y = y + i * 20
                        bar_width = int(prob * 100)
                        cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_width, bar_y + 15), color, -1)
                        cv2.putText(frame, f"{emo}: {int(prob * 100)}%", (bar_x + 2, bar_y + 12),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)

                    # 🏷️ Label cảm xúc + ID
                    label = f"ID {object_id}: {smoothed_emotion}"
                    cv2.rectangle(frame, (x, y - 30), (x + 150, y), color, -1)
                    cv2.putText(frame, label, (x + 5, y - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

                    # 📦 Viền khung khuôn mặt
                    cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

    # 📈 FPS
    curr_time = time.time()
    fps = 1.0 / (curr_time - prev_time)
    prev_time = curr_time
    frame_count += 1
    cv2.putText(frame, f"FPS: {fps:.2f}", (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    cv2.imshow("Emotion Detection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("✅ Đã đóng webcam.")

# 📊 Biểu đồ tổng kết sau phiên chạy
if all_emotions_logged:
    from matplotlib import pyplot as plt
    emotion_counts = Counter(all_emotions_logged)
    labels = list(emotion_counts.keys())
    values = list(emotion_counts.values())

    plt.figure(figsize=(8, 5))
    bars = plt.bar(labels, values, color='skyblue')
    plt.title("Biểu đồ cảm xúc sau phiên chạy")
    plt.xlabel("Cảm xúc")
    plt.ylabel("Số lần xuất hiện")

    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, height + 0.5,
                 f"{int(height)}", ha='center', fontsize=10)

    plt.tight_layout()
    plt.show()
#& "C:\Users\Admin\AppData\Local\Programs\Python\Python310\python.exe" "D:\tgmt\project-\src\training\main.py"
#& "C:\Users\Admin\AppData\Local\Programs\Python\Python310\python.exe" "D:\tgmt\project-\src\training\analyze_video.py"