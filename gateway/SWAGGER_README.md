# Swagger Documentation

## Tổng quan

Dự án sử dụng Swagger/OpenAPI 3.0 để tạo documentation cho tất cả các API endpoints. Documentation được tổ chức trong thư mục `src/swagger/` với các file riêng biệt cho từng module.

## Cấu trúc thư mục

```
src/swagger/
├── auth.js          # Authentication endpoints
├── user.js          # User profile & address management
├── booking.js       # Booking management
├── event.js         # Event management
├── payment.js       # Payment processing
└── health.js        # Health check endpoints
```

## Cách truy cập Swagger UI

1. Khởi động gateway service:

   ```bash
   npm run dev
   # hoặc
   ./scripts/dev-local.sh
   ```

2. Truy cập Swagger UI tại:
   ```
   http://localhost:3000/api/docs
   ```

## Các API Groups

### 🔐 Auth

- **Register**: Đăng ký tài khoản mới
- **Login**: Đăng nhập và nhận JWT tokens
- **Refresh Token**: Làm mới access token
- **Logout**: Đăng xuất và vô hiệu hóa refresh token

### 👤 Users

- **Get Profile**: Lấy thông tin profile người dùng
- **Update Profile**: Cập nhật thông tin profile
- **Get Addresses**: Lấy danh sách địa chỉ
- **Add Address**: Thêm địa chỉ mới
- **Update Address**: Cập nhật địa chỉ
- **Delete Address**: Xóa địa chỉ

### 🎫 Events

- **Get Events**: Lấy danh sách events với filtering
- **Get Event**: Lấy thông tin chi tiết event
- **Create Event**: Tạo event mới
- **Update Event**: Cập nhật event
- **Delete Event**: Xóa event

### 📅 Bookings

- **Create Booking**: Tạo booking mới
- **Get User Bookings**: Lấy danh sách bookings của user
- **Get Booking**: Lấy thông tin chi tiết booking
- **Cancel Booking**: Hủy booking

### 💳 Payments

- **Process Payment**: Xử lý thanh toán
- **Get Payment History**: Lấy lịch sử thanh toán
- **Get Payment Methods**: Lấy danh sách phương thức thanh toán
- **Add Payment Method**: Thêm phương thức thanh toán
- **Get Payment**: Lấy thông tin chi tiết payment
- **Refund Payment**: Hoàn tiền

### 🏥 Health

- **Health Check**: Kiểm tra tình trạng tổng thể
- **Readiness Check**: Kiểm tra readiness
- **Liveness Check**: Kiểm tra liveness

## Authentication

Hầu hết các endpoints yêu cầu authentication thông qua JWT Bearer token:

```bash
Authorization: Bearer <your-jwt-token>
```

## Schemas

Mỗi module có các schemas riêng được định nghĩa trong file swagger tương ứng:

### Auth Schemas

- `UserRegistration`: Schema cho đăng ký
- `UserLogin`: Schema cho đăng nhập
- `RefreshToken`: Schema cho refresh token
- `AuthResponse`: Schema response authentication

### User Schemas

- `UserProfile`: Thông tin profile người dùng
- `UserProfileUpdate`: Schema cập nhật profile
- `UserAddress`: Thông tin địa chỉ
- `UserAddressCreate`: Schema tạo địa chỉ

### Event Schemas

- `Event`: Thông tin event
- `EventCreate`: Schema tạo event
- `EventUpdate`: Schema cập nhật event

### Booking Schemas

- `Booking`: Thông tin booking
- `BookingCreate`: Schema tạo booking

### Payment Schemas

- `Payment`: Thông tin payment
- `PaymentCreate`: Schema tạo payment
- `PaymentMethod`: Thông tin phương thức thanh toán
- `PaymentMethodCreate`: Schema tạo phương thức thanh toán
- `RefundRequest`: Schema yêu cầu hoàn tiền

### Health Schemas

- `HealthStatus`: Trạng thái health check
- `ReadinessStatus`: Trạng thái readiness
- `LivenessStatus`: Trạng thái liveness

## Cách thêm endpoint mới

1. Tạo route trong file `src/routes/`
2. Thêm swagger documentation trong file `src/swagger/` tương ứng
3. Import file swagger trong `src/services/swaggerService.js`
4. Thêm tag mới nếu cần trong `swaggerService.js`

## Ví dụ thêm endpoint

```javascript
// src/routes/example.js
router.get('/example', exampleHandler);

// src/swagger/example.js
/**
 * @swagger
 * /example:
 *   get:
 *     summary: Example endpoint
 *     description: Example description
 *     tags: [Example]
 *     responses:
 *       200:
 *         description: Success
 */
export default {};
```

## Lưu ý

- Tất cả documentation được viết bằng JSDoc comments
- Sử dụng OpenAPI 3.0 specification
- Các schemas được tái sử dụng giữa các endpoints
- Response codes được định nghĩa rõ ràng cho từng endpoint
- Validation rules được mô tả trong schemas
