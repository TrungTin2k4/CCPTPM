# GitHub CI/CD

## Những gì đã được thiết lập

- `workflows/ci.yml`
  - Chạy trên mọi `push` và `pull_request`
  - Kiểm tra `frontend`: `npm ci`, `npm run lint`, `npm run build`
  - Kiểm tra `backend`: `npm ci`, `npm run lint`, `npm run build`

- `workflows/deploy.yml`
  - Tự động deploy khi push vào `main`
  - Có thể chạy thủ công bằng `workflow_dispatch`
  - Deploy theo kiểu generic qua SSH để không khóa vào Vercel/Docker/PM2 cụ thể

## Secrets cần cấu hình

Thiết lập các secret trong GitHub repository hoặc theo từng GitHub Environment:

- `DEPLOY_HOST`: IP hoặc domain của server
- `DEPLOY_PORT`: cổng SSH, ví dụ `22`
- `DEPLOY_USER`: user SSH
- `DEPLOY_SSH_KEY`: private key dùng để SSH vào server
- `DEPLOY_PATH`: thư mục chứa project trên server, ví dụ `/var/www/ccptpm`
- `DEPLOY_RESTART_COMMAND`: lệnh restart service sau deploy

Ví dụ:

```bash
pm2 reload all
```

hoặc:

```bash
sudo systemctl restart ccptpm-backend
```

## Kỳ vọng trên server

Workflow `deploy.yml` giả định:

- Server đã cài sẵn Node.js 20+
- Thư mục `$DEPLOY_PATH` tồn tại và có quyền ghi
- `backend` và `frontend` được build trực tiếp trên server
- Biến môi trường runtime của `backend` được cấu hình sẵn trên server

## Lưu ý

- Hiện chưa có bước test tự động vì repo chưa khai báo script `test` trong `frontend/package.json` và `backend/package.json`.
- Nếu bạn muốn deploy theo Vercel, Docker, VPS + PM2, hoặc tách riêng staging/production chặt hơn, nên tùy biến tiếp `deploy.yml` theo đúng hạ tầng thực tế.
