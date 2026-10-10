# PROGRESS – cập nhật sau mỗi task (giữ file < 100 dòng)

## Trạng thái hiện tại
Giai đoạn: D – Hoàn thiện (kèm module 13, 14 bổ sung) | Cập nhật lần cuối: YYYY-MM-DD
Thứ tự làm: 11 → 13 → 14 → 12

## Done
- [x] Demo gốc: `app.py` (FastAPI + WebSocket) + `static/index.html`
- [x] A (nền tảng): docker-compose MySQL, `.env.example`, CORS; `api/` NestJS + Prisma, Auth JWT + Guard role; `app.py` verify JWT cho WS; `web/` React + TS
- [x] B (MVP): check-in webcam + `/emotion-logs`; Nhật ký; Dashboard Recharts + seed; cảnh báo rule, `Resource`, bài tập thở, "Cần giúp ngay"
- [x] C: quyền riêng tư (`ConsentShare`, export/xóa dữ liệu); Counselor (xem theo consent, stats ẩn danh, Socket.IO); lịch hẹn + quản lý tài liệu

## In progress
- (chưa có)

## Next – Giai đoạn D (làm đúng thứ tự, mỗi lần 1 task nhỏ)

### Module 11: Admin
- [ ] 11.1 `api/`: Guard ADMIN; `GET /admin/users` (KHÔNG trả dữ liệu cảm xúc/nhật ký/tin nhắn), tạo tài khoản COUNSELOR, đổi role, khóa/mở khóa
- [ ] 11.2 `api/`: CRUD `AlertRule` (ngưỡng, số ngày xét, mức gợi ý); hàm cảnh báo đọc ngưỡng từ DB
- [ ] 11.3 `api/`: `GET /admin/stats` (chỉ số tổng hợp, không dữ liệu cá nhân) + xóa/ẩn `Resource` vi phạm
- [ ] 11.4 `web/`: trang Admin: tài khoản, ngưỡng cảnh báo, thống kê, nội dung

### Module 13: Nhắn tin với tư vấn viên
- [x] 13.1 `api/`: Prisma `Conversation` (userId, counselorId, status PENDING/ACTIVE/CLOSED) và `Message` (conversationId, senderId, content, createdAt, readAt); REST: `POST /conversations` (user gửi yêu cầu), `GET /conversations` (của mình), `PATCH /conversations/:id` (counselor chấp nhận; hai bên đóng), `GET /conversations/:id/messages` (phân trang), `POST /conversations/:id/messages` (chỉ khi ACTIVE, giới hạn độ dài, rate limit)
- [x] 13.2 `api/`: realtime bằng Socket.IO gateway có sẵn (verify JWT, room theo conversation, event `message:new`), đếm tin chưa đọc, đánh dấu đã đọc
- [x] 13.3 `web/`: trang Tin nhắn cho User (danh sách, gửi yêu cầu tới tư vấn viên, khung chat realtime, badge chưa đọc, disclaimer không dùng cho khẩn cấp + mục "Cần giúp ngay")
- [x] 13.4 `web/`: trang Tin nhắn cho Counselor (yêu cầu chờ duyệt, chấp nhận/đóng, khung chat realtime)

### Module 14: Hoạt động nhỏ mỗi ngày
- [x] 14.1 `api/`: Prisma `ActivityTemplate` (title, description, category, level NHẸ/VỪA/KÉO DÀI, durationMin, active) và `DailyActivity` (userId, templateId, date, completedAt; unique userId+templateId+date); seed 25 hoạt động mẫu đa dạng danh mục
- [x] 14.2 `api/`: `GET /activities/today` (tạo 3 việc theo mức cảnh báo hiện tại, gọi lại trong ngày trả cùng danh sách, không lặp hôm qua), `POST /activities/:id/complete`, `DELETE /activities/:id/complete` (bỏ tick), `POST /activities/:id/swap` (đổi việc, tối đa 2 lần/ngày), `GET /activities/streak` (chuỗi ngày theo giờ VN, hôm nay chưa xong không phá chuỗi)
- [x] 14.3 `web/`: thẻ "Việc nhỏ hôm nay" trên Dashboard + trang Hoạt động đầy đủ (tick hoàn thành, chuỗi streak, lịch 7/30 ngày, đổi việc, lời động viên theo ngữ cảnh)

### Module 12: Hoàn thiện (làm sau 11, 13, 14)
- [ ] 12.1 Test luồng chính: đăng ký → check-in → dashboard → cảnh báo → chia sẻ → counselor xem → thu hồi → 403; thêm luồng nhắn tin và hoạt động nhỏ
- [ ] 12.2 Xử lý lỗi và UX: mất kết nối WS, từ chối quyền webcam, loading/empty state, lỗi tiếng Việt
- [ ] 12.3 Responsive và accessibility cơ bản
- [ ] 12.4 Rà soát bảo mật: rate limit, helmet, CORS domain thật, không log dữ liệu nhạy cảm (kể cả nội dung tin nhắn), secret chỉ ở `.env`
- [ ] 12.5 Deploy: Dockerfile `api/`, `app.py` (kèm model), `web/`; docker-compose prod; HTTPS/WSS
- [ ] 12.6 Dữ liệu demo (seed) + kịch bản demo 3 vai trò
- [ ] 12.7 README + `docs/REPORT.md`: kiến trúc, đạo đức/riêng tư, hạn chế và độ chính xác model

## Quyết định đã chốt (không bàn lại)
- Giữ FastAPI cho AI, NestJS cho nghiệp vụ; frame đi thẳng React → FastAPI
- DB: MySQL + Prisma; không lưu ảnh/video
- Cảnh báo bằng rule, không dùng ML
- Counselor chỉ thấy user có `ConsentShare` ACTIVE; thu hồi có hiệu lực ngay
- Thống kê ẩn danh chỉ trả khi nhóm ≥ 5 người
- Admin không xem cảm xúc/nhật ký/tin nhắn cá nhân; mặc định không chia sẻ
- Nhắn tin: chỉ giữa đúng 2 bên của conversation; counselor phải chấp nhận mới gửi được; nhắn tin KHÔNG tự động chia sẻ dữ liệu cảm xúc (vẫn do `ConsentShare`)
- Hoạt động nhỏ: ngày tính chuỗi khi hoàn thành ≥ 1 việc; ngày tính theo giờ Việt Nam; hôm nay chưa xong không phá chuỗi; giọng điệu khuyến khích, không trách khi đứt chuỗi

## Lỗi / nợ kỹ thuật đã biết
- (ghi ngắn: lỗi gì, ở file nào)

## Endpoint đã có (tóm tắt, điền theo thực tế)
- /auth/*, /emotion-logs (+ /summary), /journal-entries, /alerts/me, /resources
- /counselors, /consents/*, /me/export, /me/data, /counselor/*, /appointments/*, /conversations/*
- /activities/* (`/today`, `/:id/complete`, `/:id/swap`, `/streak`)
- WS (`app.py`): cần JWT, nhận frame, trả `{emotion, scores}`
- Socket.IO (`api`): verify JWT, `alert:prolonged`, rooms `conversation_*`, `message:new`, `message:read`