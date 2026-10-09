# MindLog – API Specification

Tài liệu hợp đồng API giữa Client (Frontend Web/AI Service) và Server (NestJS Backend API).

## 1. Quy ước chung
- **Base URL**: `http://localhost:3001` (hoặc cấu hình qua biến môi trường `PORT`)
- **Headers**:
  - Request JSON: `Content-Type: application/json`
  - Authenticated: `Authorization: Bearer <access_token>`
- **Chuẩn phản hồi lỗi**:
  Mọi lỗi HTTP đều trả về định dạng thống nhất:
  ```json
  {
    "message": "Nội dung mô tả lỗi cụ thể",
    "code": 400
  }
  ```

---

## 2. Authentication & Authorization (`/auth`)

### 2.1. Đăng ký tài khoản
- **Method**: `POST`
- **Endpoint**: `/auth/register`
- **Truy cập**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "fullName": "Nguyễn Văn A",
    "role": "USER"
  }
  ```
  *(Trường `role` là tùy chọn, mặc định là `"USER"`. Các giá trị hợp lệ: `"USER"`, `"COUNSELOR"`, `"ADMIN"`)*
- **Response `201 Created`**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cm...cuid",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "role": "USER"
    }
  }
  ```
- **Lỗi thường gặp**:
  - `400 Bad Request`: Thiếu trường bắt buộc, email không đúng định dạng, hoặc password < 6 ký tự.
  - `409 Conflict`: `{"message": "Email này đã được sử dụng", "code": 409}`.

---

### 2.2. Đăng nhập
- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Truy cập**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cm...cuid",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "role": "USER"
    }
  }
  ```
- **Lỗi thường gặp**:
  - `401 Unauthorized`: `{"message": "Email hoặc mật khẩu không chính xác", "code": 401}`.

---

### 2.3. Lấy thông tin tài khoản hiện tại
- **Method**: `GET`
- **Endpoint**: `/auth/me`
- **Truy cập**: Cần Bearer Token (Mọi role)
- **Header**: `Authorization: Bearer <access_token>`
- **Response `200 OK`**:
  ```json
  {
    "id": "cm...cuid",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "USER",
    "createdAt": "2026-10-09T14:00:00.000Z"
  }
  ```
- **Lỗi thường gặp**:
  - `401 Unauthorized`: Token không hợp lệ hoặc đã hết hạn.

---

### 2.4. Route kiểm tra phân quyền Role (Guard Testing)
- **GET `/auth/counselor-test`**:
  - Yêu cầu Header: `Authorization: Bearer <token>`
  - Role yêu cầu: `COUNSELOR`
  - Nếu role không phù hợp: Trả về `403 Forbidden` (`{"message": "Quyền truy cập bị từ chối. Yêu cầu một trong các role: [COUNSELOR]", "code": 403}`).
- **GET `/auth/admin-test`**:
  - Yêu cầu Header: `Authorization: Bearer <token>`
  - Role yêu cầu: `ADMIN`
  - Nếu role không phù hợp: Trả về `403 Forbidden`.

---

### 2.5. Nhật ký cảm xúc (`/emotion-logs`)

#### A. Tạo bản ghi cảm xúc phiên check-in
- **Method**: `POST`
- **Endpoint**: `/emotion-logs`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Request Body**:
  ```json
  {
    "emotion": "Happy",
    "positiveScore": 88.5,
    "negativeScore": 3.2,
    "startedAt": "2026-10-09T15:45:59.860Z",
    "endedAt": "2026-10-09T15:46:07.860Z",
    "scores": {
      "Happy": 88.5,
      "Neutral": 8.3,
      "Sad": 2.1,
      "Angry": 1.1
    },
    "note": "Ghi chú tùy chọn"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": "cmv150vro0002vm80i4sdc71u",
    "userId": "cmv150vgp0000vm80o1xz3j5c",
    "emotion": "Happy",
    "positiveScore": 88.5,
    "negativeScore": 3.2,
    "scores": { "Happy": 88.5, "Neutral": 8.3, "Sad": 2.1, "Angry": 1.1 },
    "startedAt": "2026-10-09T15:45:59.860Z",
    "endedAt": "2026-10-09T15:46:07.860Z",
    "note": "Ghi chú tùy chọn",
    "createdAt": "2026-10-09T15:46:07.956Z"
  }
  ```

#### B. Lấy danh sách bản ghi cảm xúc của chính user
- **Method**: `GET`
- **Endpoint**: `/emotion-logs`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Response `200 OK`**: Danh sách mảng các `EmotionLog` sắp xếp giảm dần theo thời gian tạo.

---

### 2.6. Nhật ký cá nhân (`/journal-entries`)

#### A. Tạo bài viết nhật ký
- **Method**: `POST`
- **Endpoint**: `/journal-entries`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Request Body**:
  ```json
  {
    "mood": 4,
    "note": "Hôm nay mình hoàn thành tốt các bài tập và cảm thấy rất vui vẻ!",
    "date": "2026-10-09"
  }
  ```
  *(mood từ 1 đến 5: 1: Rất tệ, 2: Không tốt, 3: Bình thường, 4: Tốt, 5: Rất tốt)*
- **Response `201 Created`**:
  ```json
  {
    "id": "cmv15rwgw0001vmgort6qyf5b",
    "userId": "cmv150vgp0000vm80o1xz3j5c",
    "mood": 4,
    "note": "Hôm nay mình hoàn thành tốt các bài tập và cảm thấy rất vui vẻ!",
    "date": "2026-10-09T00:00:00.000Z",
    "createdAt": "2026-10-09T16:07:06.000Z",
    "updatedAt": "2026-10-09T16:07:06.000Z"
  }
  ```

#### B. Xem danh sách nhật ký của chính mình
- **Method**: `GET`
- **Endpoint**: `/journal-entries`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Response `200 OK`**: Mảng các `JournalEntry` sắp xếp theo ngày giảm dần.

#### C. Xem chi tiết một bài viết nhật ký
- **Method**: `GET`
- **Endpoint**: `/journal-entries/:id`
- **Truy cập**: Cần Bearer Token, Role: `USER` (chỉ xem được bản ghi của chính mình)
- **Response `200 OK`**: Đối tượng `JournalEntry`. Nếu không tìm thấy hoặc thuộc người khác: `404 Not Found`.

#### D. Sửa bài viết nhật ký
- **Method**: `PATCH`
- **Endpoint**: `/journal-entries/:id`
- **Truy cập**: Cần Bearer Token, Role: `USER` (chỉ sửa được bản ghi của chính mình)
- **Request Body**: `{ "mood": 5, "note": "Cập nhật lại nội dung...", "date": "2026-10-09" }`
- **Response `200 OK`**: Đối tượng `JournalEntry` sau khi cập nhật.

#### E. Xóa bài viết nhật ký
- **Method**: `DELETE`
- **Endpoint**: `/journal-entries/:id`
- **Truy cập**: Cần Bearer Token, Role: `USER` (chỉ xóa được bản ghi của chính mình)
- **Response `200 OK`**: `{"message": "Đã xóa bản ghi nhật ký thành công"}`.

---

## 3. Database Schema Models (Prisma)
- **User**: `id`, `email`, `password` (hashed with bcrypt), `fullName`, `role` (`USER` | `COUNSELOR` | `ADMIN`), `createdAt`, `updatedAt`.
- **EmotionLog**: `id`, `userId`, `emotion`, `positiveScore` (Float), `negativeScore` (Float), `scores` (Json), `startedAt` (DateTime), `endedAt` (DateTime), `note` (Text), `createdAt` (DateTime).
- **JournalEntry**: `id`, `userId`, `mood` (Int 1–5), `note` (Text), `date` (DateTime), `createdAt` (DateTime), `updatedAt` (DateTime).

---

## 4. AI Service – WebSocket API (`app.py`)

### 4.1. Kết nối Real-time Emotion Detection
- **URL**: `ws://localhost:8000/ws?token=<jwt_token>` (hoặc Header `Authorization: Bearer <jwt_token>`)
- **Xác thực**:
  - Yêu cầu JWT hợp lệ (được cấp từ `/auth/login` hoặc `/auth/register`).
  - Nếu thiếu token hoặc token sai/hết hạn: Kết nối bị từ chối và đóng ngay với **WebSocket Close Code: `1008` (Policy Violation)**, reason: `Unauthorized: Missing or invalid token`.

### 4.2. Gửi Frame webcam (Client → Server)
- **Format**: JSON Text qua WebSocket
- **Payload**:
  ```json
  {
    "type": "frame",
    "data": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }
  ```

### 4.3. Nhận Kết quả cảm xúc (Server → Client)
- **Format**: JSON Text qua WebSocket
- **Payload `result` gọn**:
  ```json
  {
    "type": "result",
    "emotion": "Happy",
    "scores": {
      "Angry": 1.2,
      "Disgust": 0.1,
      "Fear": 0.5,
      "Happy": 88.4,
      "Sad": 0.8,
      "Surprise": 2.1,
      "Neutral": 6.9
    },
    "fps": 28.5,
    "detections": [
      {
        "id": 1,
        "x": 120,
        "y": 80,
        "w": 200,
        "h": 200,
        "emotion": "Happy",
        "scores": { ... },
        "color": "#FFD600"
      }
    ],
    "frame_width": 640,
    "frame_height": 480
  }
  ```
- **Lưu ý**: Client (React) tổng hợp các kết quả `emotion` và `scores` theo từng chu kỳ (5–10s) rồi gửi `POST /emotion-logs` lên NestJS. Service AI không ghi DB hay ghi file CSV.

