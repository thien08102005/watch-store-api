# Backend Chronos

Hướng dẫn chạy backend trong thư mục `HTML_W/backend`.

## Cấu hình môi trường

Tạo file `.env` trong thư mục `backend` với nội dung:

```env
MONGO_URI=mongodb://localhost:27017/ChronosWatchDB
PORT=5000
```

> File `.env` đã được thêm vào `.gitignore`, nên khi `git push` / `git clone` sẽ không tự động có file này.

## Cài đặt và chạy

```bash
cd HTML_W/backend
npm install
npm run dev
```

## Kiểm tra

- API backend chạy tại: `http://localhost:5000`
- `products` có thể kiểm tra bằng: `http://localhost:5000/api/products`

## Phân quyền tài khoản

Hệ thống có ba vai trò: `customer` (khách hàng), `staff` (nhân viên) và
`manager` (quản lý). Tài khoản đăng ký mới luôn nhận vai trò `customer`.

Ba tài khoản demo được tạo tự động khi backend khởi động (mật khẩu chung là
`123`):

| Vai trò | Email |
| --- | --- |
| Quản lý | `admin@chronos.local` |
| Nhân viên | `nhanvien@chronos.local` |
| Khách hàng | `khachhang@chronos.local` |

Sau khi tạo tài khoản quản lý đầu tiên, chạy lệnh sau để cấp vai trò:

```bash
npm run set-role -- admin@example.com manager
```

Đăng nhập lại sau khi đổi vai trò để nhận JWT mới. API yêu cầu header:

```http
Authorization: Bearer <token>
```

- `GET /api/auth/me`: mọi tài khoản đã đăng nhập.
- `GET /api/auth/users`: chỉ quản lý.
- `POST /api/auth/users/staff`: chỉ quản lý; body gồm `name`, `email`, `password`; tạo tài khoản nhân viên.
- `PATCH /api/auth/users/:id/role`: chỉ quản lý; body là `{ "role": "staff" }` hoặc `customer`.
- `POST /api/products`: quản lý và nhân viên; body gồm `name`, `brand`, `price`, `category`, `imageUrl` (có thể thêm `rating`).
