# Backend (Node.js ES6 + Express + MongoDB)

## Tech
- Node.js ES6 modules
- Express
- MongoDB + Mongoose
- Joi validation
- JWT auth with role-based access

## Setup
1. Go to backend:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from `.env.example` and update values.
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env
   # macOS/Linux
   # cp .env.example .env
   ```
4. Seed demo users:
   ```bash
   npm run seed
   ```
5. Start server:
   ```bash
   npm run dev
   ```

Server URL: `http://localhost:5000`

## Demo Users
- `admin@edumerge.local` / `Admin@123`
- `officer@edumerge.local` / `Officer@123`
- `management@edumerge.local` / `Manager@123`

## Deployment Notes (Render / Vercel)
- Set `NODE_ENV=production`.
- Use a strong `JWT_SECRET` (at least 16 chars, not placeholders).
- Ensure Mongo Atlas network access allows your host (quick test: `0.0.0.0/0`).
- Verify runtime health at `/health` before testing login.

## Core APIs
- `POST /api/auth/login`
- `POST /api/auth/register` (ADMIN only)
- `GET /api/dashboard`
- `POST/GET /api/masters/institutions`
- `PUT/DELETE /api/masters/institutions/:id`
- `POST/GET /api/masters/campuses`
- `PUT/DELETE /api/masters/campuses/:id`
- `POST/GET /api/masters/departments`
- `PUT/DELETE /api/masters/departments/:id`
- `POST/GET /api/masters/programs`
- `PUT/DELETE /api/masters/programs/:id`
- `PATCH /api/masters/programs/:id/quotas`
- `POST/GET /api/applicants`
- `PUT/DELETE /api/applicants/:id`
- `PATCH /api/applicants/:id/documents`
- `GET /api/admissions/availability/:programId/:quotaType`
- `POST /api/admissions/allocate`
- `PUT/DELETE /api/admissions/:id`
- `PATCH /api/admissions/:id/fee`
- `PATCH /api/admissions/:id/confirm`

## Implemented Rules
- Quota seats must equal intake while creating a program.
- No seat allocation when quota is full.
- Real-time quota seat counters (`filled`, `remaining`).
- Admission number generated once and immutable.
- Admission confirmation only when fee is `PAID` and documents are `VERIFIED`.
