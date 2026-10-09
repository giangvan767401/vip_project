# PROGRESS – cập nhật sau mỗi task (giữ file < 100 dòng)

## Trạng thái hiện tại
Giai đoạn: B – MVP | Cập nhật lần cuối: 2026-10-09

## Done
- [x] Demo gốc: `app.py` (FastAPI + WebSocket) + `static/index.html`
- [x] Giai đoạn A: docker-compose MySQL, `.env.example`, CORS; `api/` NestJS + Prisma (User, EmotionLog), Auth JWT + Guard role; `app.py` verify JWT cho WS, bỏ ghi CSV; `web/` React + TS, router, login/register, layout theo role
- [x] Module 4: Check-in webcam (POST/GET /emotion-logs, consent webcam, WS frame capture 3fps, gom 8s lưu MySQL)
- [x] Module 5: Nhật ký (Prisma JournalEntry, CRUD REST API /journal-entries, UI viết/xem/sửa/xóa nhật ký)

## In progress
- (chưa có)

## Next – Giai đoạn B (làm đúng thứ tự, mỗi lần 1 task nhỏ)

### Module 4: Check-in webcam
- [x] 4.1 `api/`: `POST /emotion-logs` (Guard USER, DTO validate: emotion, positiveScore, negativeScore, startedAt, endedAt) + `GET /emotion-logs` của chính user
- [x] 4.2 `web/`: trang Check-in, hộp thoại consent trước khi bật webcam, nút bắt đầu/dừng
- [x] 4.3 `web/`: mở WS tới FastAPI kèm JWT, gửi frame 2–5 fps (resize nhỏ), hiển thị cảm xúc realtime, xử lý ngắt kết nối và tự kết nối lại
- [x] 4.4 `web/`: gom kết quả 5–10 giây (cảm xúc chủ đạo + điểm), gọi `POST /emotion-logs`, tắt webcam khi dừng

### Module 5: Nhật ký
- [x] 5.1 `api/`: Prisma `JournalEntry` (mood 1–5, note, date), CRUD, chỉ truy cập được bản ghi của chính mình
- [x] 5.2 `web/`: trang Nhật ký (form + danh sách + sửa/xóa)

### Module 6: Dashboard
- [ ] 6.1 `api/`: script seed dữ liệu giả (≥14 ngày, có một chuỗi ngày tiêu cực) cho user demo
- [ ] 6.2 `api/`: `GET /emotion-logs/summary?range=day|week` (cảm xúc chủ đạo, điểm trung bình theo ngày, so sánh tuần trước)
- [ ] 6.3 `web/`: trang Dashboard (Recharts: xu hướng ngày/tuần, phân bố cảm xúc, so sánh tuần trước)

### Module 7: Cảnh báo và gợi ý
- [ ] 7.1 `api/`: Prisma `AlertRule` + hàm tính chuỗi ngày tiêu cực (mặc định ≥4/7 ngày vượt ngưỡng), `GET /alerts/me` trả mức nhẹ/vừa/kéo dài
- [ ] 7.2 `api/`: Prisma `Resource` + seed tài liệu/bài tập, `GET /resources?level=`
- [ ] 7.3 `web/`: banner cảnh báo + gợi ý theo mức trên Dashboard
- [ ] 7.4 `web/`: trang bài tập thở 4-7-8 (animation), mục "Cần giúp ngay" (đường dây nóng) luôn hiển thị, disclaimer "không phải chẩn đoán y tế"

## Roadmap sau B (chưa làm, đừng làm trước)
C: 8 Quyền riêng tư (ConsentShare, xuất/xóa dữ liệu) → 9 Counselor → 10 Lịch hẹn/tài liệu
D: 11 Admin → 12 Hoàn thiện/deploy

## Quyết định đã chốt (không bàn lại)
- Giữ FastAPI cho AI, NestJS cho nghiệp vụ; frame đi thẳng React → FastAPI
- DB: MySQL + Prisma; không lưu ảnh/video
- Cảnh báo bằng rule, không dùng ML
- Frame 2–5 fps; gom 5–10 giây mới lưu một bản ghi

## Lỗi / nợ kỹ thuật đã biết
- (ghi ngắn: lỗi gì, ở file nào)

## Endpoint đã có (tóm tắt, điền theo thực tế)
- POST /auth/register, POST /auth/login – trả JWT
- WS (`app.py`): cần JWT, nhận frame, trả `{emotion, scores}`