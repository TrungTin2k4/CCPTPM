# EduLearn Frontend Test Guide

## Overview

This frontend is built with `React + Vite + Tailwind CSS` and is connected to the backend APIs in the `backend` folder.

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

If `VITE_API_BASE_URL` is not set, the frontend uses `http://localhost:8080` by default.

## Prerequisites

Before testing the frontend, make sure:

- Node.js is installed
- frontend dependencies are installed
- backend is running
- MongoDB is running for the backend

## Install Dependencies

```bash
npm install
```

## Run Frontend

```bash
npm run dev
```

Local env template:

```bash
cp .env.example .env.local
```

Staging env template:

```bash
cp .env.staging.example .env.staging
```

## Useful Commands

```bash
npm run build
npm run lint
npm run preview
npm run dev:staging
npm run build:staging
npm run preview:staging
```

## Backend Requirement

The frontend depends on these backend features being available:

- authentication
- courses list and course details
- checkout and orders
- progress and my learning
- admin dashboard, courses, orders, and users

Recommended backend local config:

- `backend/.env.local`
- `MONGODB_URI=mongodb://127.0.0.1:27017`
- `MONGODB_DB=edulearn`
- `JWT_SECRET=...`

Recommended staging config:

- Frontend staging: `frontend/.env.staging`
- Backend staging: `backend/.env.staging`
- `VITE_API_BASE_URL=http://localhost:8081`

## Test Accounts

Admin account:

- Email: `admin@edulearn.local`
- Password: `Admin@123456`

User account:

- Create one from the Register page

## Main Test Routes

Public routes:

- `/`
- `/courses`
- `/courses/:slug`
- `/login`
- `/register`
- `/forgot-password`

Authenticated user routes:

- `/profile`
- `/checkout`
- `/orders`
- `/my-learning`
- `/learn/:slug`

Admin routes:

- `/admin`
- `/admin/courses`
- `/admin/orders`
- `/admin/users`

## Manual Test Checklist

### 1. Public Flow

- Open `/`
- Confirm the homepage loads correctly
- Confirm featured courses are visible
- Open `/courses`
- Search by title
- Filter by tags/categories
- Open a course detail page

### 2. Register Flow

- Open `/register`
- Create a new account
- Confirm redirect after successful registration
- Confirm avatar menu appears after login

### 3. Login Flow

- Open `/login`
- Login with a normal account or the admin account
- Confirm the navbar updates correctly
- Confirm invalid credentials show an error message

### 4. Profile Flow

- Open `/profile`
- Change full name
- Change avatar URL
- Save profile
- Confirm navbar avatar/name updates
- Change password

### 5. User Checkout Flow

- Login with a normal user account
- Open a course detail page
- Click `View details` or go to a course page
- Add course to checkout
- Open `/checkout`
- Create an order
- Open `/orders`
- Confirm the order is listed

### 6. User Learning Flow

- After an order is moved to `COMPLETED` by admin, open `/my-learning`
- Open the learning player
- Switch lessons
- Save video position
- Mark lesson as complete

### 7. Admin Flow

- Login with `admin@edulearn.local`
- Open `/admin`
- Confirm dashboard metrics load
- Open `/admin/courses`
- Edit a course
- Open `/admin/orders`
- Change an order status to `COMPLETED`
- Open `/admin/users`
- Confirm user list loads

## Important Logic Notes

- Admin users do not use the learner checkout flow
- Admin course cards open edit flow instead of purchase flow
- Normal users can access checkout, orders, and my learning
- Profile settings are available from the avatar menu

## Responsive Testing

Test the UI in these widths:

- Desktop: `1440px`
- Laptop: `1024px`
- Tablet: `768px`
- Mobile: `390px`

Check these areas carefully:

- navbar wrapping
- homepage hero layout
- course cards grid
- forms on login/register/profile
- admin tables/cards

## If Changes Do Not Appear

Do a hard refresh:

```bash
Ctrl + F5
```

Also make sure you are viewing the Vite dev server at `http://localhost:5173`.
