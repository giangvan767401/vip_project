import cv2
import numpy as np
from predict_emotion import predict_emotion  # Đảm bảo file predict_emotion.py nằm cùng thư mục

# 📂 Đường dẫn video đầu vào
video_path = "holy.mp4"  
cap = cv2.VideoCapture(video_path)

# 📦 Ghi video đầu ra 
fourcc = cv2.VideoWriter_fourcc(*'XVID')
out = cv2.VideoWriter("output_emotion.avi", fourcc, 20.0, (int(cap.get(3)), int(cap.get(4))))

# 👁️ Phát hiện khuôn mặt bằng Haar cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5)

    for (x, y, w, h) in faces:
        face_img = frame[y:y+h, x:x+w]

        pred_index, emotion, _, _ = predict_emotion(face_img)
        if emotion != "Error":
            # 🖼️ Vẽ khung và label
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, emotion, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    # 🖥️ Hiển thị và lưu kết quả
    out.write(frame)
    cv2.imshow("Emotion Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
out.release()
cv2.destroyAllWindows()





