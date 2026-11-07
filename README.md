# Online Quiz & Course Management System (Quizzify)

Quizzify is a production-grade, professionally designed 3-tier Online Quiz Application built with React (Vite) + Tailwind CSS v4 on the frontend, Node.js + Express.js on the backend, and PostgreSQL 15+ via Sequelize ORM for data storage.

## Features

- **Admin Dashboard**: Register faculty staff, toggle account statuses, and view system-wide KPI metrics and attempt volume charts.
- **Faculty Dashboard**: Create courses, add subtopic units, upload PDF/PPT lecture files, configure exam constraints, import quiz questions via Excel sheets, validate templates with row-level error reports, and view detailed student score statistics.
- **Student Dashboard**: Browse course catalogs, self-enroll, download lesson handouts, take quizzes with live countdown timers, autosave answers to survive connection drops, and check historical grading charts.
- **Role-Based Access Control**: Fully secured REST API and React router guards.
- **Tailwind CSS v4 CSS-First Design System**: Out-of-the-box styled components (Storybook-style documentation available at `/design-system`).

---

## Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js (Vite) + Tailwind CSS v4 + Recharts + Lucide Icons |
| **Backend** | Node.js + Express.js |
| **Database** | PostgreSQL 15+ + Sequelize ORM (Migrations & Seeders) |
| **Authentication** | JWT Access Tokens + Bcrypt password hashing |
| **Excel Parser** | `xlsx` npm package |
| **Uploads Handler** | Multer |

---

## Project Structure

```
d:\Quizz_APP
├── backend/                  # Express REST API
│   ├── src/
│   │   ├── config/           # Database & Sequelize configs
│   │   ├── controllers/      # API Controllers
│   │   ├── middlewares/      # JWT verification, Multer uploaders, Error handlers
│   │   ├── models/           # Sequelize ORM Schema Models
│   │   ├── migrations/       # Database Schema Migration scripts
│   │   ├── seeders/          # Database Mock Data Seeding scripts
│   │   ├── routes/           # Express Route definitions
│   │   ├── services/         # Excel generators and validators
│   │   └── app.js & server.js
│   ├── uploads/              # Material storage folder (Git ignored)
│   └── .env
└── frontend/                 # React SPA
    ├── src/
    │   ├── components/       # Custom reusable UI framework library
    │   ├── context/          # Global Auth & Toast state contexts
    │   ├── layouts/          # Responsive role layouts with sidebar & header
    │   ├── routes/           # Routing configuration & route protection guards
    │   ├── utils/            # API Client wrapper
    │   └── views/            # User views sorted by roles (Admin, Faculty, Student)
    └── .env
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **PostgreSQL 15+** installed and running locally

---

### Step 1: Database Setup

Make sure your PostgreSQL instance is running. Create a database named `quiz_app_db` (or use another name and update `backend/.env`).

```sql
CREATE DATABASE quiz_app_db;
```

---

### Step 2: Backend Configuration & Execution

1. Navigate to `/backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Copy `.env.example` to `.env` and fill in your DB credentials:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `DB_PASS` matches your PostgreSQL password, e.g. `Haritej@123`)*

4. Run database migrations:
   ```bash
   npx sequelize-cli db:migrate
   ```

5. Seed the database with demo mock accounts:
   ```bash
   npx sequelize-cli db:seed:all
   ```

6. Start the Express development server:
   ```bash
   npm run dev
   ```
   The backend server will launch at `http://localhost:5000`.

---

### Step 3: Frontend Configuration & Execution

1. Open a new terminal and navigate to `/frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify or configure variables in `.env` (maps API requests to `http://localhost:5000/api`).
4. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

### Authentication and Access Setup

Copy `backend/.env.example` to `backend/.env` and set the database values, Google OAuth values, frontend origin, and a new random `JWT_SECRET` (at least 32 random bytes). Keep `.env` files out of source control. For local development, `COOKIE_SECURE=false`; use `COOKIE_SECURE=true` behind HTTPS in production. Set `CORS_ORIGINS` to a comma-separated list of exact frontend origins.

Required backend keys are `PORT`, `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `UPLOAD_LIMIT`, `FRONTEND_URL`, `CORS_ORIGINS`, `COOKIE_SECURE`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`. `COOKIE_DOMAIN` is optional. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are required only for the explicit first-admin seed; use a unique password of at least 16 characters. `SHOW_EXAMS_WITHOUT_PUBLISHED_QUIZZES` is optional and defaults to `false`. `RESEND_API_KEY` and `EMAIL_FROM` are optional and enable decision emails; in-app notifications work without them. The frontend key is `VITE_API_URL` in `frontend/.env`.

In Google Cloud Console:

1. Configure the OAuth consent screen and publish/authorize the app for the intended users.
2. Create an OAuth client ID with application type **Web application**.
3. Add the frontend URL (for local development, `http://localhost:5173`) under **Authorized JavaScript origins**.
4. Add the exact value of `GOOGLE_CALLBACK_URL` (for local development, `http://localhost:5000/api/auth/google/callback`) under **Authorized redirect URIs**.
5. Put the client ID and client secret only in `backend/.env`; never add them to a `VITE_` variable.

For the first administrator, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`, then run `npx sequelize-cli db:seed --seed 20261107000001-seed-admin-and-published-competitive-content.js` from `backend/`. The seeder updates an existing matching admin or creates it if missing. Admin roles cannot be assigned by public registration, Google login, or a client-supplied role.

Apply the new database migration with `npx sequelize-cli db:migrate` from `backend/`. Run the focused security tests with `npm test --prefix backend`; build the UI with `npm run build --prefix frontend`.

---

## Role-Based Access Control (RBAC) & Role Flow

Quizzify enforces strict server-side Role-Based Access Control with 3 core roles:

1. **`STUDENT` (Default)**
   - All new signups (via email/password or Google OAuth) are **strictly assigned `STUDENT`**.
   - The user role is never accepted from the client request body.
   - Students can browse published competitive exams, take timed mock assessments or untimed practice drills with instant feedback, bookmark questions, and track mistakes in their revision folder.
   - Students can submit an **Educator Access Request** (`/student/access-request`) with qualifications, experience, proof documents, and target syllabus subjects.

2. **`EDUCATOR` (Verified Instructor)**
   - Users become educators only when:
     - An **Admin approves** their Educator Application from `/admin/operations`, assigning an `educatorType` (`COMPETITIVE`, `COLLEGE`, or `BOTH`).
     - An **Admin generates a single-use invite token** (`POST /api/admin/educator-invites`), allowing registration directly into the `EDUCATOR` role.
   - Educators can author quizzes mapped to Exam, Edition, Subject, and Topic with 4 options, a correct answer, and explanations.
   - Quizzes follow a strict status lifecycle: `DRAFT -> PENDING_REVIEW -> PUBLISHED` or `REJECTED`. Educators can only view and edit their own quizzes (`ownerId === req.user.id`).

3. **`ADMIN` (Platform Governance)**
   - Admins oversee the review queue, approve/reject educator applications, publish or reject quiz sets, manage users and roles, and configure the syllabus taxonomy.
   - **No public admin registration exists.** The first administrator is created exclusively via environment variables and a seed script.

### How to Create / Update the First Admin

1. Open `backend/.env` and set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (minimum 16 characters):
   ```env
   ADMIN_EMAIL=admin@quizapp.com
   ADMIN_PASSWORD=AdminSecurePass2026!
   ```
2. Run the admin seeder:
   ```bash
   cd backend
   npx sequelize-cli db:seed --seed 20261107000001-seed-admin-and-published-competitive-content.js
   ```
3. To seed complete competitive taxonomy (GATE, JEE Main, UPSC CSE, CAT) with published sample quizzes:
   ```bash
   npx sequelize-cli db:seed --seed 20261107000002-seed-missing-competitive-taxonomy.js
   ```

---

## Seeded Login Credentials for Demo

For rapid development and evaluation, demo quick-fill buttons are provided on the login page (`/login`):

### 1. Platform Administrator
- **Email:** `admin@quizapp.com`
- **Password:** `AdminSecurePass2026!`
- **Workspace:** `/admin` (Review queue, Educator applications, User management, Exam hierarchy, Audit logs)

### 2. Verified Educators
- **Competitive Educator:** `contributor1@quizapp.com` / `password123`
- **College Educator (Faculty):** `faculty1@quizapp.com` / `password123`
- **Workspace:** `/contributor` (Create quiz, Authored question banks, Materials, Submissions)

### 3. Student Accounts
- **Emails:** `student1@quizapp.com` to `student5@quizapp.com`
- **Password:** `password123`
- **Workspace:** `/student` (Competitive exams catalog, Drill-down, Practice & Mock assessments)
