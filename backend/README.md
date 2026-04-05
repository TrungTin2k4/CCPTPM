# EduLearn Backend (Next.js)

> Migration branch: `BE`

This is the Node.js/Next.js migration of the Java Spring Boot backend.

The API keeps the same route structure and business rules used by the Java version:

- JWT auth with tokenVersion-based token revocation
- Password reset with hashed reset tokens
- Auth rate limiting on sensitive endpoints
- Public/admin course APIs
- Checkout/order workflow
- Learning progress APIs

## Requirements

- Node.js 20+
- MongoDB (local or cloud)

## Setup

1) Copy env file:

```bash
cp .env.example .env.local
```

Required env vars for deploy pipelines (build/start):

- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET` (minimum 32 chars)

Common optional vars:

- `JWT_EXPIRATION`
- `CORS_ALLOWED_ORIGINS`
- `CORS_ALLOWED_METHODS`
- `CORS_ALLOWED_HEADERS`
- `CORS_ALLOW_CREDENTIALS`
- `PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES`
- `PASSWORD_RESET_DEBUG_RETURN_TOKEN`
- `APP_PROFILE`
- `UPLOAD_MAX_FILE_SIZE_BYTES`

2) Install dependencies:

```bash
npm install
```

3) Start dev server on port 8080:

```bash
npm run dev
```

4) Build and run production:

```bash
npm run build
npm run start
```

## Swagger Testing

- Swagger UI: `http://localhost:8080/api-docs`
- OpenAPI JSON: `http://localhost:8080/openapi.json`
- If you run on another port (for example `8081`), replace the port in both URLs.
- To test protected endpoints:
  1) Call `/api/auth/login` to get a JWT token.
  2) Click `Authorize` in Swagger UI.
  3) Paste: `Bearer <your_token>`

## Main API Groups

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `PUT /api/auth/change-password`
- `GET/DELETE /api/auth/sessions`
- `DELETE /api/auth/sessions/{id}`

- `GET /api/courses`
- `GET /api/courses/featured`
- `GET /api/courses/categories`
- `GET /api/categories`
- `GET /api/courses/{slug}`
- `GET /api/courses/id/{id}` (admin)

- `POST /api/reviews` (auth, create/update my review)
- `GET /api/reviews/course/{courseId}`
- `DELETE /api/reviews/{id}` (owner/admin)

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/me`
- `GET /api/orders/{orderId}`

- `GET/DELETE /api/cart`
- `POST /api/cart/items`
- `DELETE /api/cart/items/{courseId}`

- `GET /api/enrollments/me`

- `GET /api/progress/my-learning`
- `GET /api/progress/courses`
- `GET /api/progress/{courseId}`
- `PUT /api/progress/{courseId}/lesson/{lessonId}`
- `POST /api/progress/complete`
- `GET /api/progress/position/{lessonId}`
- `POST /api/progress/position/{lessonId}`
- `PUT /api/progress/{courseId}/video-position`

- `GET /api/upload`
- `POST /api/upload` (multipart image upload)
- `DELETE /api/upload/{id}`

- `GET /api/admin/dashboard`
- `GET/POST /api/admin/courses`
- `PUT/DELETE /api/admin/courses/{id}`
- `GET/POST /api/admin/categories`
- `PUT/DELETE /api/admin/categories/{id}`
- `GET /api/admin/orders`
- `PATCH/PUT /api/admin/orders/{id}/status`
- `GET /api/admin/users`

## Notes

- Allowed payment methods: `CARD`, `MOMO`, `BANK_TRANSFER`
- Public course detail masks non-preview lesson `videoUrl`
- Pagination constraints: `page >= 0`, `1 <= size <= 100`
- Auth rate-limit responses return HTTP `429` and `Retry-After`
- Upload supports image mime types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Upload max file size is controlled by `UPLOAD_MAX_FILE_SIZE_BYTES` (default: `5242880`)
- Review posting requires course access (must be enrolled)
- Session management is token-based (`/api/auth/sessions`) and logout revokes active sessions

## Legacy Java Backend

The original Java backend remains in the sibling `backend-java/` directory for reference.
