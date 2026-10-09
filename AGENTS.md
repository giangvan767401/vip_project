# MindLog – Rules cho AI (đọc file này đầu mỗi phiên)

## Dự án
Web nhật ký cảm xúc sinh viên: webcam → model nhận diện cảm xúc → lưu xu hướng → cảnh báo/gợi ý hỗ trợ. Roles: USER, COUNSELOR, ADMIN.

## Cấu trúc

### Hiện có (không đổi vị trí khi chưa được yêu cầu)
- `app.py` – FastAPI + WebSocket, chạy model dự đoán cảm xúc (service AI hiện tại)
- `model/` – model đã train (`emotion_model.keras`, `emotion_model1.keras`) và dataset `fer2013/`. KHÔNG sửa/xóa/ghi đè file model
- `src/training/` – script Python: `train_model.py`, `prepare_dataset.py`, `predict_emotion.py`, `analyze_video.py`, `centroid_tracker.py`, `main.py`
- `static/index.html` – giao diện demo cũ, sẽ được thay bằng `web/`
- `emotion_log.csv`, `test_sample*.png` – dữ liệu/ảnh thử nghiệm, không dùng cho production, không commit dữ liệu thật
- `docs/PROGRESS.md` – trạng thái công việc (đọc khi bắt đầu, cập nhật khi xong)

### Sẽ thêm (tạo mới ở thư mục gốc, không chuyển code cũ nếu chưa được yêu cầu)
- `web/` – React + Vite + TS + Recharts
- `api/` – NestJS + Prisma + MySQL (auth, nghiệp vụ, Socket.IO)
- `docs/API.md` – hợp đồng endpoint/event
- `docker-compose.yml`, `.env.example` – MySQL và biến môi trường

### Quy ước
- `app.py` giữ vai trò service AI; chỉ thêm verify JWT cho WebSocket và giữ nguyên logic dự đoán.
- Chưa di chuyển `app.py` vào `ai/` cho đến khi PROGRESS.md ghi quyết định này.

## Quy trình làm việc (BẮT BUỘC)
1. Đọc `docs/PROGRESS.md` trước khi code. Chỉ làm đúng task được giao.
2. Task lớn: nêu kế hoạch ngắn (file nào sẽ sửa) rồi mới code.
3. Không tự thêm thư viện, đổi cấu trúc thư mục, đổi tên file/biến đang dùng nếu chưa hỏi.
4. Không sửa file ngoài phạm vi task. Không "tiện tay" refactor.
5. Trước khi tạo mới: kiểm tra đã có component/service/hàm tương tự chưa → tái sử dụng.
6. Xong task: cập nhật `docs/PROGRESS.md` (Done + Next + quyết định mới) và `docs/API.md` nếu đổi API.
7. Không chạy train lại model, không đổi/ghi đè file trong `model/`.

## Quy tắc kiến trúc (không được vi phạm)
- Model giữ ở FastAPI (Python). KHÔNG viết lại sang Node.
- Frame webcam đi thẳng React → FastAPI (WebSocket). KHÔNG qua NestJS.
- React gom kết quả mỗi 5–10 giây rồi `POST /emotion-logs` lên NestJS. KHÔNG ghi DB từng frame.
- NestJS cấp JWT. FastAPI chỉ verify JWT khi mở WebSocket, không truy cập DB.
- Chỉ dùng Prisma cho DB (MySQL, utf8mb4). Không viết SQL thô trừ khi bắt buộc.
- Socket.IO (NestJS) chỉ dùng để đẩy cảnh báo realtime cho Counselor.
- Cảnh báo dùng rule (ví dụ ≥4/7 ngày điểm tiêu cực vượt ngưỡng), không thêm ML.

## Quyền riêng tư (không được vi phạm)
- KHÔNG lưu ảnh/video. Chỉ lưu nhãn cảm xúc, điểm số, thời gian.
- Counselor chỉ xem dữ liệu của user có bản ghi `ConsentShare` đang hiệu lực. Mặc định không chia sẻ.
- Admin không xem cảm xúc cá nhân.
- Mọi endpoint phải có Guard phân quyền theo role.
- Không log token, mật khẩu, nội dung nhật ký. Mật khẩu hash bằng bcrypt.

## Quy ước code
- TypeScript strict, không dùng `any`. Validate input bằng DTO (class-validator) ở NestJS.
- API REST: danh từ số nhiều, kebab-case (`/emotion-logs`). Lỗi trả JSON `{ message, code }`.
- Tên: file kebab-case, component PascalCase, biến camelCase, bảng DB PascalCase (Prisma).
- Config qua `.env` (có `.env.example`), không hardcode secret/URL.
- Comment ngắn, chỉ giải thích "vì sao", không giải thích điều hiển nhiên.

## Cách trả lời
- Ngắn gọn. Chỉ đưa code phần thay đổi (kèm đường dẫn file), không in lại cả file.
- Nếu yêu cầu mâu thuẫn với rules trên → nói rõ, đừng tự ý làm.
