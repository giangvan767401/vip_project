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

#### C. Lấy dữ liệu tổng hợp thống kê cảm xúc (Dashboard)
- **Method**: `GET`
- **Endpoint**: `/emotion-logs/summary?range=day|week`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Query Params**:
  - `range` (tùy chọn): `'week'` (mặc định) hoặc `'day'`
- **Response `200 OK`**:
  ```json
  {
    "range": "week",
    "summary": {
      "avgPositiveScore": 59.1,
      "avgNegativeScore": 29.2,
      "totalCheckIns": 9,
      "dominantEmotion": "Happy"
    },
    "trend": [
      {
        "label": "03/10",
        "date": "2026-10-03",
        "avgPositive": 14.0,
        "avgNegative": 75.0,
        "dominantEmotion": "Sad",
        "count": 1
      }
    ],
    "distribution": [
      { "emotion": "Happy", "count": 5, "percentage": 55.6 },
      { "emotion": "Neutral", "count": 2, "percentage": 22.2 }
    ],
    "comparison": {
      "thisWeek": {
        "avgPositiveScore": 59.1,
        "avgNegativeScore": 29.2,
        "totalCheckIns": 9,
        "dominantEmotion": "Happy"
      },
      "previousWeek": {
        "avgPositiveScore": 36.7,
        "avgNegativeScore": 49.9,
        "totalCheckIns": 10,
        "dominantEmotion": "Sad"
      },
      "positiveDiff": 22.4,
      "negativeDiff": -20.7,
      "byDay": [
        {
          "dayName": "CN",
          "dateLabel": "03/10",
          "thisWeekPositive": 70.0,
          "lastWeekPositive": 15.0,
          "thisWeekNegative": 15.0,
          "lastWeekNegative": 78.0
        }
      ]
    }
  }
  ```

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

### 2.7. Cảnh báo tâm lý (`/alerts`)

#### A. Lấy mức cảnh báo hiện tại của người dùng
- **Method**: `GET`
- **Endpoint**: `/alerts/me`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Response `200 OK`**:
  ```json
  {
    "level": "vua",
    "totalNegativeDays": 5,
    "consecutiveNegativeDays": 5,
    "timeWindowDays": 7,
    "thresholdApplied": 50,
    "activeRuleName": "Cảnh báo mức vừa (≥4/7 ngày tiêu cực)",
    "message": "MindLog ghi nhận bạn đã trải qua 5 ngày liên tiếp có điểm tiêu cực vượt ngưỡng trong tuần qua.",
    "recommendation": "Bạn có thể đang chịu áp lực học tập hoặc stress. Hãy dành thời gian thư giãn với bài tập thở 4-7-8, viết nhật ký chia sẻ và cho phép bản thân nghỉ ngơi.",
    "disclaimer": "Cảnh báo và gợi ý được tính tự động từ tần suất cảm xúc ghi nhận, không thay thế cho chẩn đoán y tế hoặc đánh giá tâm thần chuyên nghiệp.",
    "details": [
      { "date": "2026-10-03", "label": "04/10", "avgNegative": 85.0, "isNegative": true }
    ]
  }
  ```
  *(Các mức `level` hợp lệ: `"binh_thuong"`, `"nhe"`, `"vua"`, `"keo_dai"`)*

---

### 2.8. Tài nguyên & Gợi ý hỗ trợ (`/resources`)

#### A. Lấy danh sách tài liệu, bài tập và đường dây nóng
- **Method**: `GET`
- **Endpoint**: `/resources?level=all|nhe|vua|keo_dai`
- **Truy cập**: Cần Bearer Token
- **Query Params**:
  - `level` (tùy chọn): mức lọc (`all`, `nhe`, `vua`, `keo_dai`)
- **Response `200 OK`**: Danh sách mảng các `Resource` (loại `EXERCISE`, `ARTICLE`, `HOTLINE`, `TIP`).

#### B. Chuyên viên tạo tài nguyên mới
- **Method**: `POST`
- **Endpoint**: `/resources`
- **Truy cập**: Cần Bearer Token, Role: `COUNSELOR`
- **Request Body**:
  ```json
  {
    "title": "Bài tập thiền chánh niệm 10 phút",
    "description": "Giúp bình tâm và giảm lo âu",
    "type": "EXERCISE",
    "level": "nhe",
    "content": "Các bước thực hiện...",
    "durationMinutes": 10
  }
  ```
- **Response `201 Created`**: Đối tượng `Resource` đã tạo (kèm `creatorId = counselorId`).

#### C. Chuyên viên sửa tài nguyên (chỉ tài nguyên do chính mình tạo)
- **Method**: `PATCH`
- **Endpoint**: `/resources/:id`
- **Truy cập**: Cần Bearer Token, Role: `COUNSELOR`
- **Lỗi bảo mật**: Trả về `403 Forbidden` nếu cố tình chỉnh sửa tài liệu của hệ thống hoặc chuyên viên khác.

#### D. Chuyên viên xóa tài nguyên (chỉ tài nguyên do chính mình tạo)
- **Method**: `DELETE`
- **Endpoint**: `/resources/:id`
- **Truy cập**: Cần Bearer Token, Role: `COUNSELOR`
- **Lỗi bảo mật**: Trả về `403 Forbidden` nếu cố tình xóa tài liệu không thuộc quyền sở hữu của mình.

---

### 2.9. Quyền riêng tư & Quản lý chia sẻ (`/consents` & `/counselors`)

#### A. Lấy danh sách chuyên viên tư vấn
- **Method**: `GET`
- **Endpoint**: `/counselors`
- **Truy cập**: Cần Bearer Token
- **Response `200 OK`**: Mảng các counselor `{ id, fullName, email }`.

#### B. Lấy danh sách quyền chia sẻ của người dùng hiện tại
- **Method**: `GET`
- **Endpoint**: `/consents/me`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Response `200 OK`**: Mảng các `ConsentShare` kèm thông tin `counselor`.

#### C. Cấp quyền chia sẻ dữ liệu cho tư vấn viên
- **Method**: `POST`
- **Endpoint**: `/consents`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Request Body**:
  ```json
  {
    "counselorId": "cmv17...cuid"
  }
  ```
- **Response `201 Created`**: Đối tượng `ConsentShare` với `status: "ACTIVE"`, `grantedAt: ISOString`.

#### D. Thu hồi quyền chia sẻ dữ liệu
- **Method**: `DELETE`
- **Endpoint**: `/consents/:id`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Response `200 OK`**: Đối tượng `ConsentShare` sau khi chuyển `status: "REVOKED"`, `revokedAt: ISOString`.

---

### 2.10. Quản lý dữ liệu người dùng (`/me`)

#### A. Xuất toàn bộ dữ liệu cá nhân (Data Export)
- **Method**: `GET`
- **Endpoint**: `/me/export`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Response `200 OK`**:
  ```json
  {
    "exportedAt": "2026-10-09T17:00:23.000Z",
    "source": "MindLog Platform",
    "user": {
      "id": "cm...cuid",
      "email": "demo@example.com",
      "fullName": "Sinh viên Demo",
      "role": "USER",
      "createdAt": "2026-10-09T14:00:00.000Z"
    },
    "totalEmotionLogs": 18,
    "totalJournalEntries": 7,
    "totalConsents": 1,
    "emotionLogs": [ ... ],
    "journalEntries": [ ... ],
    "consents": [ ... ]
  }
  ```

#### B. Xóa toàn bộ dữ liệu cá nhân (Data Deletion)
- **Method**: `DELETE`
- **Endpoint**: `/me/data`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Request Body**:
  ```json
  {
    "password": "password123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Đã xóa toàn bộ dữ liệu nhật ký, cảm xúc và chia sẻ thành công",
    "deletedCounts": {
      "emotionLogs": 18,
      "journalEntries": 7,
      "consentShares": 1
    }
  }
  ```
- **Lỗi thường gặp**:
  - `401 Unauthorized`: `{"message": "Mật khẩu không chính xác", "code": 401}`.

---

### 2.11. Chuyên viên tư vấn (`/counselor`)

#### A. Lấy danh sách sinh viên đồng ý chia sẻ
- **Method**: `GET`
- **Endpoint**: `/counselor/clients`
- **Truy cập**: Cần Bearer Token, Role: `COUNSELOR`
- **Quy tắc**: Chỉ trả những sinh viên có bản ghi `ConsentShare` trạng thái `ACTIVE` với chính chuyên viên này.
- **Response `200 OK`**:
  ```json
  [
    {
      "consentId": "cmv18...",
      "grantedAt": "2026-10-10T00:09:46.000Z",
      "student": {
        "id": "cmv1635vm0000vmc0oydn6sse",
        "fullName": "Sinh viên Demo",
        "email": "demo@example.com"
      },
      "alertLevel": "vua",
      "activeRuleName": "Cảnh báo mức vừa (≥4/7 ngày tiêu cực)",
      "consecutiveNegativeDays": 5,
      "lastCheckIn": "2026-10-10T00:00:00.000Z",
      "lastEmotion": "Sad"
    }
  ]
  ```

#### B. Xem chi tiết tóm tắt xu hướng cảm xúc sinh viên
- **Method**: `GET`
- **Endpoint**: `/counselor/clients/:id/summary?range=day|week`
- **Truy cập**: Cần Bearer Token, Role: `COUNSELOR`
- **Quy tắc bảo mật quan trọng (Không cache)**:
  - Hệ thống truy vấn trực tiếp DB kiểm tra `ConsentShare` với `userId = :id`, `counselorId = counselorId`, `status = ACTIVE`.
  - Nếu sinh viên chưa cấp quyền hoặc đã thu hồi (`REVOKED`): Lập tức trả về **`403 Forbidden`** (`{"message": "Bạn không có quyền truy cập dữ liệu của sinh viên này hoặc sinh viên đã thu hồi quyền chia sẻ.", "code": 403}`).
- **Response `200 OK`**:
  ```json
  {
    "student": { "id": "...", "fullName": "...", "email": "..." },
    "consent": { "id": "...", "grantedAt": "..." },
    "summary": { ... },
    "alert": { ... },
    "recentLogs": [ ... ]
  }
  ```

#### C. Thống kê ẩn danh toàn trường
- **Method**: `GET`
- **Endpoint**: `/counselor/stats`
- **Truy cập**: Cần Bearer Token, Role: `COUNSELOR`
- **Quy tắc bảo mật nhóm nhỏ (k-Anonymity)**:
  - Chỉ trả dữ liệu chi tiết khi có ít nhất 5 sinh viên ghi nhận dữ liệu trong hệ thống (`totalStudents >= 5`).
  - Nếu `< 5` người: Trả về `{ "hasEnoughData": false, "minimumRequired": 5, "currentCount": X, "message": "..." }`.
- **Response `200 OK` (khi >= 5 người)**:
  ```json
  {
    "hasEnoughData": true,
    "totalStudents": 12,
    "totalCheckIns": 145,
    "avgPositiveScore": 58.4,
    "avgNegativeScore": 28.1,
    "distribution": [
      { "emotion": "Happy", "count": 65, "percentage": 44.8 }
    ]
  }
  ```

---

### 2.12. Lịch hẹn tham vấn (`/appointments` & `/counselor/appointments`)

#### A. Sinh viên đặt lịch hẹn mới
- **Method**: `POST`
- **Endpoint**: `/appointments`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Request Body**:
  ```json
  {
    "counselorId": "cmv17...cuid",
    "startAt": "2026-10-11T09:30:00.000Z",
    "note": "Áp lực thi cử và mất ngủ"
  }
  ```
- **Quy tắc**:
  - Chặn trùng lịch của cùng chuyên viên tư vấn (khoảng cách 30 phút giữa các lịch hẹn). Trả về `409 Conflict` nếu trùng giờ.
  - Đặt lịch độc lập với `ConsentShare`, không tự động chia sẻ dữ liệu cảm xúc/nhật ký.
- **Response `201 Created`**: Đối tượng `Appointment` với `status: "PENDING"`.

#### B. Sinh viên xem danh sách lịch hẹn của mình
- **Method**: `GET`
- **Endpoint**: `/appointments/me`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Response `200 OK`**: Danh sách mảng các `Appointment` của chính sinh viên đó.

#### C. Sinh viên hủy lịch hẹn
- **Method**: `PATCH`
- **Endpoint**: `/appointments/:id/cancel`
- **Truy cập**: Cần Bearer Token, Role: `USER`
- **Response `200 OK`**: Đối tượng `Appointment` với `status: "CANCELLED"`.

#### D. Chuyên viên xem danh sách lịch hẹn gửi đến mình
- **Method**: `GET`
- **Endpoint**: `/counselor/appointments`
- **Truy cập**: Cần Bearer Token, Role: `COUNSELOR`
- **Response `200 OK`**: Danh sách các lịch hẹn sinh viên đăng ký với chuyên viên này.

#### E. Chuyên viên cập nhật trạng thái lịch hẹn
- **Method**: `PATCH`
- **Endpoint**: `/counselor/appointments/:id`
- **Truy cập**: Cần Bearer Token, Role: `COUNSELOR`
- **Request Body**:
  ```json
  {
    "status": "CONFIRMED"
  }
  ```
  *(Các giá trị hợp lệ: `"CONFIRMED"`, `"CANCELLED"`)*
---

## 2.10. Quản trị hệ thống (`/admin`) – Role `ADMIN`

Tất cả các endpoint trong mục này bắt buộc có Bearer Token và Role là `ADMIN`. Các vai trò khác đều nhận `403 Forbidden`.
**Cam kết bảo mật:** Không endpoint nào trong nhóm này trả về dữ liệu `EmotionLog` hay `JournalEntry` của cá nhân người dùng.

### A. Lấy danh sách người dùng
- **Method**: `GET`
- **Endpoint**: `/admin/users`
- **Response `200 OK`**:
  ```json
  {
    "total": 8,
    "users": [
      {
        "id": "cm...",
        "email": "user@example.com",
        "fullName": "Sinh viên Demo",
        "role": "USER",
        "isActive": true,
        "createdAt": "2026-10-09T14:00:00.000Z",
        "_count": {
          "emotionLogs": 18,
          "journalEntries": 7,
          "appointmentsStudent": 2,
          "appointmentsCounselor": 0
        }
      }
    ]
  }
  ```

### B. Tạo tài khoản Chuyên viên Tham vấn (Counselor)
- **Method**: `POST`
- **Endpoint**: `/admin/counselors`
- **Request Body**:
  ```json
  {
    "email": "counselor.new@mindlog.edu.vn",
    "fullName": "TS. Lê Hoài An",
    "password": "password123"
  }
  ```
- **Response `201 Created`**: Thông tin chuyên viên vừa tạo (`role: COUNSELOR`, `isActive: true`).

### C. Đổi vai trò người dùng (Role)
- **Method**: `PATCH`
- **Endpoint**: `/admin/users/:id/role`
- **Request Body**:
  ```json
  {
    "role": "COUNSELOR"
  }
  ```
- **Response `200 OK`**: Thông tin người dùng sau khi cập nhật role.

### D. Khóa hoặc Mở khóa tài khoản
- **Method**: `PATCH`
- **Endpoint**: `/admin/users/:id/status`
- **Request Body**:
  ```json
  {
    "isActive": false
  }
  ```
- **Response `200 OK`**: Thông tin người dùng sau khi khóa/mở khóa (`isActive: boolean`). Tài khoản bị khóa sẽ không thể đăng nhập (trả về 401).

### E. Quản lý Quy tắc Cảnh báo (CRUD AlertRule)
- **`GET /admin/alert-rules`**: Lấy danh sách quy tắc hiện tại (ngưỡng %, số ngày liên tiếp, cửa sổ ngày, mức độ, kích hoạt).
- **`POST /admin/alert-rules`**: Tạo quy tắc cảnh báo mới.
- **`PATCH /admin/alert-rules/:id`**: Cập nhật ngưỡng (`negativeThreshold`), `consecutiveDays`, `timeWindowDays`, `level`, `isActive`. (Khi cập nhật, API tính cảnh báo sinh viên `GET /alerts/me` sẽ phản ánh ngưỡng mới ngay lập tức).
- **`DELETE /admin/alert-rules/:id`**: Xóa quy tắc cảnh báo.

### F. Thống kê hệ thống vĩ mô
- **Method**: `GET`
- **Endpoint**: `/admin/stats`
- **Response `200 OK`**:
  ```json
  {
    "users": {
      "total": 9,
      "students": 3,
      "counselors": 4,
      "admins": 2
    },
    "activities": {
      "totalEmotionLogs": 19,
      "totalJournalEntries": 7,
      "totalActiveConsents": 1
    },
    "appointments": {
      "total": 2,
      "confirmed": 0,
      "pending": 0,
      "cancelled": 2
    },
    "resources": {
      "total": 6
    }
  }
  ```

### G. Kiểm duyệt tài liệu & bài tập
- **`GET /admin/resources`**: Lấy toàn bộ tài liệu trong hệ thống (kèm thông tin tác giả).
- **`PATCH /admin/resources/:id/visibility`**: Ẩn hoặc công khai tài liệu (`{"isPublished": false}`).
- **`DELETE /admin/resources/:id`**: Xóa tài liệu vi phạm quy chế.

---

## 3. Database Schema Models (Prisma)
- **User**: `id`, `email`, `password` (hashed with bcrypt), `fullName`, `role` (`USER` | `COUNSELOR` | `ADMIN`), `isActive` (Boolean), `createdAt`, `updatedAt`.
- **EmotionLog**: `id`, `userId`, `emotion`, `positiveScore` (Float), `negativeScore` (Float), `scores` (Json), `startedAt` (DateTime), `endedAt` (DateTime), `note` (Text), `createdAt` (DateTime).
- **JournalEntry**: `id`, `userId`, `mood` (Int 1–5), `note` (Text), `date` (DateTime), `createdAt` (DateTime), `updatedAt` (DateTime).
- **AlertRule**: `id`, `name`, `negativeThreshold`, `consecutiveDays`, `timeWindowDays`, `level`, `isActive`, `createdAt`, `updatedAt`.
- **Resource**: `id`, `creatorId` (nullable), `title`, `description`, `type`, `level`, `content`, `url`, `durationMinutes`, `isPublished` (Boolean), `createdAt`, `updatedAt`.
- **ConsentShare**: `id`, `userId`, `counselorId`, `status` (`ACTIVE` | `REVOKED`), `grantedAt`, `revokedAt`, `createdAt`, `updatedAt`.
- **Appointment**: `id`, `userId`, `counselorId`, `startAt`, `note`, `status` (`PENDING` | `CONFIRMED` | `CANCELLED`), `createdAt`, `updatedAt`.

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

