# PROGRESS – cập nhật sau mỗi task (giữ file < 100 dòng)

## Trạng thái hiện tại
Giai đoạn: D – Hoàn thiện (kèm module 13, 14, 15 bổ sung) | Cập nhật lần cuối: YYYY-MM-DD
Thứ tự làm: 11 → 13 → 14 → 15 → 12 (chạy local, chưa deploy)

## Done
- [x] Demo gốc: `app.py` (FastAPI + WebSocket) + `static/index.html`
- [x] A: docker-compose MySQL, `.env.example`, CORS; `api/` NestJS + Prisma, Auth JWT + Guard role; `app.py` verify JWT cho WS; `web/` React + TS
- [x] B (MVP): check-in webcam + `/emotion-logs`; Nhật ký; Dashboard + seed; cảnh báo rule, `Resource`, bài tập thở, "Cần giúp ngay"
- [x] C: quyền riêng tư (`ConsentShare`, export/xóa); Counselor (xem theo consent, stats ẩn danh, Socket.IO); lịch hẹn + tài liệu
- [x] D (13): Nhắn tin tư vấn viên (Socket.IO, phòng riêng, đếm tin chưa đọc)
- [x] D (14): Hoạt động nhỏ mỗi ngày (Streak, swap tối đa 2 lần, theo mức cảnh báo)
- [x] D (15): Chuẩn bị buổi tư vấn (SessionBrief snapshot, xuất PDF tiếng Việt, gắn lịch hẹn, xem/thu hồi, seed demo 28 ngày)

## In progress
- (chưa có)

## Next – Giai đoạn D (làm đúng thứ tự, mỗi lần 1 task nhỏ)

### Module 12: Hoàn thiện (làm sau 11, 13, 14, 15)
- [x] 12.1 Test luồng chính: đăng ký → check-in → dashboard → cảnh báo → chia sẻ → counselor xem → thu hồi → 403; nhắn tin, hoạt động nhỏ, brief (32/32 tests pass)
- [ ] 12.2 Xử lý lỗi/UX: mất kết nối WS, từ chối webcam, loading/empty state, lỗi tiếng Việt
- [ ] 12.3 Responsive và accessibility cơ bản
- [ ] 12.4 Rà soát bảo mật: rate limit, helmet, CORS, không log dữ liệu nhạy cảm (tin nhắn, nhật ký, brief), secret chỉ ở `.env`
- [ ] 12.5 Đóng gói chạy local: `docker compose up -d` dựng MySQL, README hướng dẫn chạy `api/`, `app.py`, `web/`; clone về máy sạch chạy được
- [ ] 12.6 Dữ liệu demo + kịch bản demo 3 vai trò (có kịch bản brief)
- [ ] 12.7 README + `docs/REPORT.md`: kiến trúc, đạo đức/riêng tư, hạn chế và độ chính xác model

## Quyết định đã chốt (không bàn lại)
- Giữ FastAPI cho AI, NestJS cho nghiệp vụ; frame đi thẳng React → FastAPI
- DB: MySQL + Prisma; không lưu ảnh/video; cảnh báo bằng rule, không ML
- Counselor chỉ thấy user có `ConsentShare` ACTIVE; thu hồi hiệu lực ngay; stats ẩn danh khi nhóm ≥ 5
- Admin không xem cảm xúc/nhật ký/tin nhắn/brief; mặc định không chia sẻ
- Nhắn tin: chỉ 2 bên; counselor chấp nhận mới gửi được; không tự chia sẻ dữ liệu cảm xúc
- Hoạt động nhỏ: chuỗi tính khi hoàn thành ≥ 1 việc/ngày (giờ VN); giọng điệu khuyến khích
- Brief: tạo bằng quy tắc/thống kê, KHÔNG dùng LLM, không nhãn chẩn đoán; lưu snapshot; chỉ Counselor của lịch hẹn đó xem được và không cấp quyền xem dữ liệu ngoài snapshot; hết hạn giờ kết thúc hẹn + 7 ngày; thu hồi có hiệu lực ngay

## Lỗi / nợ kỹ thuật đã biết
- (ghi ngắn: lỗi gì, ở file nào)

## Endpoint đã có (tóm tắt, điền theo thực tế)
- /auth/*, /emotion-logs, /journal-entries, /alerts/me, /resources, /conversations/*, /activities/*
- /counselors, /consents/*, /me/export, /me/data, /counselor/*, /appointments/*, /appointments/:id/brief
- /briefs/preview, /briefs, /briefs/:id, /briefs/:id/pdf
- WS (`app.py`): cần JWT, nhận frame, trả `{emotion, scores}`