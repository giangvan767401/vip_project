# PROGRESS – cập nhật sau mỗi task (giữ file < 100 dòng)

## Trạng thái hiện tại
Giai đoạn: A – Nền tảng | Cập nhật lần cuối: 2026-10-09

## Done
- [x] Demo gốc: `app.py` (FastAPI + WebSocket) + `static/index.html`, dự đoán cảm xúc chạy ổn
- [x] 0. Chuẩn bị: `docker-compose.yml` (MySQL 8 utf8mb4), `.env.example`, `.gitignore`, bật CORS và đọc config từ `.env` trong `app.py`
- [x] 1. Backend nền (`api/`): NestJS + Prisma, schema `User`, `EmotionLog`, Auth register/login, JWT, Guard theo role

## In progress
- (chưa có)

## Next – Giai đoạn A (làm đúng thứ tự, mỗi lần 1 task nhỏ)
- [x] 1. Backend nền (`api/`): NestJS + Prisma, schema `User`, `EmotionLog`, migration, Auth register/login, JWT, Guard theo role
- [ ] 2. AI service: `app.py` verify JWT khi mở WebSocket, bỏ ghi `emotion_log.csv`, trả JSON gọn `{emotion, scores}`
- [ ] 3. Frontend nền (`web/`): Vite + React + TS, router, trang login/register, lưu token, layout theo role

## Roadmap sau A (chưa làm, đừng làm trước)
B (MVP): 4 Check-in webcam → 5 Nhật ký → 6 Dashboard → 7 Cảnh báo và gợi ý
C: 8 Quyền riêng tư → 9 Counselor → 10 Lịch hẹn/tài liệu
D: 11 Admin → 12 Hoàn thiện/deploy

## Quyết định đã chốt (không bàn lại)
- Giữ FastAPI cho AI, NestJS cho nghiệp vụ; frame đi thẳng React → FastAPI
- DB: MySQL + Prisma; không lưu ảnh/video
- Cảnh báo bằng rule, không dùng ML

## Lỗi / nợ kỹ thuật đã biết
- `app.py` đang ghi `emotion_log.csv` (sẽ bỏ ở module 2)

## Endpoint đã có (tóm tắt)
- WS (`app.py`): nhận frame, trả cảm xúc (chưa có xác thực)
- REST (`api/`): `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `GET /auth/counselor-test`, `GET /auth/admin-test`