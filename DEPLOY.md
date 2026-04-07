# First Release Deployment

## Kết luận

Repo đã được chuẩn bị để deploy release đầu tiên theo mô hình:

- `frontend` deploy trên Render Static Site
- `backend` deploy trên Render Web Service
- MongoDB dùng MongoDB Atlas qua biến môi trường

File hạ tầng chính:

- `render.yaml`
- `frontend/.env.example`
- `backend/.env.example`

## Các thay đổi đã có trong repo

- Thêm `render.yaml` để Render tạo đồng thời frontend và backend
- Thêm `backend/src/app/api/health/route.js` cho health check
- Thêm mẫu env cho cả 2 app
- Chuẩn hóa `VITE_API_BASE_URL` để tránh lỗi dấu `/` cuối
- Thêm GitHub Actions `/.github/workflows/ci.yml` để kiểm tra build tự động

## Cách deploy

### 1. Chuẩn bị MongoDB Atlas

Tạo database và lấy connection string dạng:

```bash
mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
```

### 2. Tạo services từ `render.yaml`

1. Push repo lên GitHub
2. Trong Render, chọn `New +` -> `Blueprint`
3. Chọn repo này
4. Render sẽ đọc `render.yaml` và tạo:
   - `ccptpm-api`
   - `ccptpm-frontend`

### 3. Khai báo secret bắt buộc

Tại service `ccptpm-api`, đặt:

- `MONGODB_URI`
- `JWT_SECRET`

Nếu frontend/backend có domain khác với mặc định trong `render.yaml`, cập nhật lại:

- `CORS_ALLOWED_ORIGINS`
- `VITE_API_BASE_URL`

## Domain mặc định đang giả định

- Frontend: `https://ccptpm-frontend.onrender.com`
- Backend: `https://ccptpm-api.onrender.com`

Nếu Render cấp domain khác, cần sửa đúng theo domain thực tế trong dashboard.

## Checklist release v1

1. Deploy backend xong, mở `GET /api/health`
2. Seed admin nếu database chưa có dữ liệu
3. Cập nhật `VITE_API_BASE_URL` của frontend trỏ đúng backend thật
4. Mở frontend và test:
   - đăng ký / đăng nhập
   - danh sách khóa học
   - checkout
   - admin dashboard

## Seed dữ liệu

Chạy local hoặc chạy một lần trong môi trường có quyền truy cập MongoDB:

```bash
cd backend
npm install
node seed-admin.mjs
node seed-demo-course.mjs
```

## Lưu ý

- Backend hiện chạy bằng `next start -p 8080`
- Chưa cấu hình custom domain
- Chưa cấu hình object storage/CDN cho upload, nên media hiện vẫn phụ thuộc backend hiện tại
- Chưa có bước migrate dữ liệu tự động
- Chưa verify build trong workspace hiện tại vì máy đang thiếu `node_modules`
