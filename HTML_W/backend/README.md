# Backend Chronos

Hướng dẫn chạy backend trong thư mục `HTML_W/backend`.

## Cấu hình môi trường

Tạo file `.env` trong thư mục `backend` với nội dung:

```env
MONGO_URI=mongodb://localhost:27017/ChronosWatchDB
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id
```

> File `.env` đã được thêm vào `.gitignore`, nên khi `git push` / `git clone` sẽ không tự động có file này.
>
> Nếu bạn chưa dùng Google login, vẫn có thể giữ nguyên giá trị `PORT` và `MONGO_URI` như hiện tại.

## Cấu hình Google login

Để bật Google login, thực hiện các bước sau:

1. Vào Google Cloud Console và tạo một OAuth 2.0 Client ID.
2. Chọn loại `Web application`.
3. Trong phần `Authorized JavaScript origins`, thêm đúng origin của trang frontend đang chạy, ví dụ:
   - `http://localhost:5500` nếu bạn dùng Live Server
   - `http://127.0.0.1:5500` nếu bạn mở bằng địa chỉ này

   > Chú ý: chỉ nhập `http://127.0.0.1:5500`, không cần thêm `/HTML_W/frontend/index.html`.
4. `Authorized redirect URIs` không cần thiết với Google Identity Services kiểu client-side, nhưng bạn vẫn có thể thêm nếu dùng flow server-side khác.
5. Sao chép `Client ID` vào file `HTML_W/backend/.env` trường `GOOGLE_CLIENT_ID`.
6. Mở file `HTML_W/frontend/js/google-config.js` và gán cùng giá trị:

```js
window.GOOGLE_CLIENT_ID = 'your_google_client_id';
```

7. Công thức đúng là: giá trị `GOOGLE_CLIENT_ID` trên backend và frontend phải giống nhau.

8. Nếu bạn đang mở trang bằng `file://`, Google login sẽ không hoạt động. Hãy chạy frontend bằng một web server như Live Server hoặc `http://localhost:5500`.

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
