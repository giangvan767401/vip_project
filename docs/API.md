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

## 3. Database Schema Models (Prisma)
- **User**: `id`, `email`, `password` (hashed with bcrypt), `fullName`, `role` (`USER` | `COUNSELOR` | `ADMIN`), `createdAt`, `updatedAt`.
- **EmotionLog**: `id`, `userId`, `emotion`, `scores` (Json), `note` (Text), `createdAt`.
