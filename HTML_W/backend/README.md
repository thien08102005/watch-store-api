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
