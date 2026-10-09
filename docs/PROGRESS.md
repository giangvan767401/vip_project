# PROGRESS – cập nhật sau mỗi task (giữ file < 100 dòng)

## Trạng thái hiện tại
Giai đoạn: D – Hoàn thiện | Cập nhật lần cuối: 2026-10-10

## Done
- [x] Demo gốc: `app.py` (FastAPI + WebSocket) + `static/index.html`
- [x] A (nền tảng): docker-compose MySQL, `.env.example`, CORS; `api/` NestJS + Prisma, Auth JWT + Guard role; `app.py` verify JWT cho WS; `web/` React + TS
- [x] B (MVP): check-in webcam + `/emotion-logs`; Nhật ký; Dashboard Recharts + seed; cảnh báo rule, `Resource`, bài tập thở, "Cần giúp ngay"
- [x] C: quyền riêng tư (`ConsentShare`, export/xóa dữ liệu); Counselor (xem theo consent, stats ẩn danh, Socket.IO); lịch hẹn + quản lý tài liệu
- [x] D (11): Admin – Guard ADMIN, `GET /admin/users` (không trả cảm xúc/nhật ký), tạo COUNSELOR, đổi role, khóa/mở khóa (`isActive`); CRUD `AlertRule` (ngưỡng đọc từ DB); `GET /admin/stats` (tổng hợp vĩ mô); kiểm duyệt `Resource` (`isPublished`); trang Admin 4 tab; JWT strategy check `isActive`

## In progress
- (chưa có)

## Next – Giai đoạn D (làm đúng thứ tự, mỗi lần 1 task nhỏ)

### Module 11: Admin ✅
- [x] 11.1 `api/`: Guard ADMIN; `GET /admin/users` (KHÔNG trả dữ liệu cảm xúc/nhật ký), tạo tài khoản COUNSELOR, đổi role, khóa/mở khóa tài khoản
- [x] 11.2 `api/`: CRUD `AlertRule` (chỉnh ngưỡng, số ngày xét, mức gợi ý); hàm cảnh báo đọc ngưỡng từ DB
- [x] 11.3 `api/`: `GET /admin/stats` (số user, số phiên check-in, số lịch hẹn; chỉ số tổng hợp, không dữ liệu cá nhân) + xóa/ẩn `Resource` vi phạm
- [x] 11.4 `web/`: trang Admin: tài khoản, ngưỡng cảnh báo, thống kê hệ thống, nội dung

### Module 12: Hoàn thiện
- [ ] 12.1 Test luồng chính (script hoặc e2e): đăng ký → check-in → dashboard → cảnh báo → chia sẻ → counselor xem → thu hồi → 403
- [ ] 12.2 Xử lý lỗi và UX: mất kết nối WS, từ chối quyền webcam, loading/empty state, thông báo lỗi tiếng Việt
- [ ] 12.3 Responsive (điện thoại/laptop) và accessibility cơ bản
- [ ] 12.4 Rà soát bảo mật: rate limit login, helmet, CORS cho domain thật, không log dữ liệu nhạy cảm, secret chỉ ở `.env`, xóa code ghi `emotion_log.csv` nếu còn
- [ ] 12.5 Deploy: Dockerfile cho `api/`, `app.py` (kèm model), `web/`; docker-compose prod; HTTPS/WSS (webcam chỉ chạy trên HTTPS hoặc localhost)
- [ ] 12.6 Dữ liệu demo (seed) + kịch bản demo từng vai trò
- [ ] 12.7 README (cách chạy) + tài liệu báo cáo: kiến trúc, đạo đức/riêng tư, hạn chế và độ chính xác của model

## Quyết định đã chốt (không bàn lại)
- Giữ FastAPI cho AI, NestJS cho nghiệp vụ; frame đi thẳng React → FastAPI
- DB: MySQL + Prisma; không lưu ảnh/video
- Cảnh báo bằng rule, không dùng ML
- Counselor chỉ thấy user có `ConsentShare` ACTIVE; thu hồi có hiệu lực ngay
- Thống kê ẩn danh chỉ trả khi nhóm ≥ 5 người
- Admin không xem cảm xúc/nhật ký cá nhân; mặc định không chia sẻ

## Lỗi / nợ kỹ thuật đã biết
- (ghi ngắn: lỗi gì, ở file nào)

## Endpoint đã có (tóm tắt, điền theo thực tế)
- /auth/*, /emotion-logs (+ /summary), /journal-entries, /alerts/me, /resources
- /counselors, /consents/*, /me/export, /me/data, /counselor/*, /appointments/*
- /admin/users, /admin/counselors, /admin/users/:id/role, /admin/users/:id/status
- /admin/alert-rules (CRUD), /admin/stats, /admin/resources, /admin/resources/:id/visibility
- WS (`app.py`): cần JWT, nhận frame, trả `{emotion, scores}`