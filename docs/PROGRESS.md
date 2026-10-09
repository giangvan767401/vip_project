# PROGRESS – cập nhật sau mỗi task (giữ file < 100 dòng)

## Trạng thái hiện tại
Giai đoạn: C – Hỗ trợ con người | Cập nhật lần cuối: YYYY-MM-DD

## Done
- [x] Demo gốc: `app.py` (FastAPI + WebSocket) + `static/index.html`
- [x] Giai đoạn A: docker-compose MySQL, `.env.example`, CORS; `api/` NestJS + Prisma, Auth JWT + Guard role; `app.py` verify JWT cho WS; `web/` React + TS, router, login/register, layout theo role
- [x] Giai đoạn B (MVP): check-in webcam + `POST /emotion-logs`; Nhật ký (`JournalEntry`); Dashboard Recharts + seed dữ liệu giả; cảnh báo theo rule (`AlertRule`), `Resource`, bài tập thở, mục "Cần giúp ngay"
- [x] Module 8 (Quyền riêng tư): Prisma `ConsentShare`; `GET /counselors`, `POST /consents`, `DELETE /consents/:id`, `GET /consents/me`; `GET /me/export`, `DELETE /me/data` (xác thực mật khẩu); giao diện quản lý chia sẻ, xuất JSON và xóa dữ liệu

## In progress
- (chưa có)

## Next – Giai đoạn C (làm đúng thứ tự, mỗi lần 1 task nhỏ)

### Module 8: Quyền riêng tư (Đã hoàn thành)
- [x] 8.1 `api/`: Prisma `ConsentShare` (userId, counselorId, status ACTIVE/REVOKED, grantedAt, revokedAt); `GET /counselors`, `POST /consents`, `DELETE /consents/:id` (thu hồi), `GET /consents/me`
- [x] 8.2 `api/`: `GET /me/export` (JSON toàn bộ dữ liệu của mình), `DELETE /me/data` (xóa EmotionLog, JournalEntry, ConsentShare; yêu cầu nhập lại mật khẩu)
- [x] 8.3 `web/`: trang Quyền riêng tư: chọn tư vấn viên và bật/tắt chia sẻ, xuất dữ liệu, xóa dữ liệu (có xác nhận), nội dung giải thích rõ ai xem được gì

### Module 9: Counselor
- [ ] 9.1 `api/`: seed 2 tài khoản COUNSELOR; Guard/hàm kiểm tra `ConsentShare` ACTIVE ở MỌI truy vấn của Counselor (không cache); `GET /counselor/clients`, `GET /counselor/clients/:id/summary` (tái dùng logic summary)
- [ ] 9.2 `api/`: `GET /counselor/stats` thống kê ẩn danh toàn hệ thống, chỉ trả khi nhóm ≥ 5 người (tránh lộ danh tính)
- [ ] 9.3 `api/`: Socket.IO gateway: verify JWT khi kết nối, room theo counselorId, đẩy cảnh báo khi user đã đồng ý chia sẻ đạt mức "kéo dài"
- [ ] 9.4 `web/`: trang Counselor: danh sách user đã đồng ý, xem xu hướng từng người, thống kê ẩn danh, thông báo realtime

### Module 10: Lịch hẹn và tài liệu
- [ ] 10.1 `api/`: Prisma `Appointment` (userId, counselorId, startAt, status PENDING/CONFIRMED/CANCELLED); user đặt/hủy, counselor xác nhận/từ chối; chặn trùng giờ
- [ ] 10.2 `api/`: Counselor tạo/sửa/xóa `Resource` (Guard COUNSELOR)
- [ ] 10.3 `web/`: User đặt lịch, xem lịch; Counselor xem và xử lý lịch hẹn
- [ ] 10.4 `web/`: Counselor quản lý tài liệu; User xem tài liệu theo mức gợi ý

## Roadmap sau C (chưa làm, đừng làm trước)
D: 11 Admin → 12 Hoàn thiện/deploy

## Quyết định đã chốt (không bàn lại)
- Giữ FastAPI cho AI, NestJS cho nghiệp vụ; frame đi thẳng React → FastAPI
- DB: MySQL + Prisma; không lưu ảnh/video
- Cảnh báo bằng rule, không dùng ML
- Counselor chỉ thấy user có `ConsentShare` ACTIVE; thu hồi có hiệu lực ngay lập tức
- Thống kê ẩn danh chỉ trả khi nhóm ≥ 5 người
- Admin không xem cảm xúc cá nhân; mặc định không chia sẻ

## Lỗi / nợ kỹ thuật đã biết
- (ghi ngắn: lỗi gì, ở file nào)

## Endpoint đã có (tóm tắt, điền theo thực tế)
- POST /auth/register, POST /auth/login
- POST/GET /emotion-logs, GET /emotion-logs/summary, CRUD /journal-entries
- GET /alerts/me, GET /resources
- GET /counselors, GET /consents/me, POST /consents, DELETE /consents/:id
- GET /me/export, DELETE /me/data
- WS (`app.py`): cần JWT, nhận frame, trả `{emotion, scores}`