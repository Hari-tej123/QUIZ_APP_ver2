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

---

## Seeded Login Credentials for Demo

All seeded accounts are initialized with the password: `password123`.

### 1. Administrator Account
- **Email:** `admin@quizapp.com`
- **Role:** Full control over Faculty staff registration and usage stats.
- **Route to Design System Reference:** Log in as Admin and navigate to `/design-system` using the sidebar or browser URL.

### 2. Faculty Staff Accounts
- **Email:** `faculty1@quizapp.com`
  - **Specialization:** Algorithms, Discrete Maths.
  - **Must Change Password on First Login:** No.
- **Email:** `faculty2@quizapp.com`
  - **Specialization:** Discrete Structures, Calculus.
  - **Must Change Password on First Login:** Yes (will force password update modal upon signing in).

### 3. Active Student Accounts
- **Emails:**
  - `student1@quizapp.com` (Enrolled in Algorithms & Calculus, has completed Big O Quiz)
  - `student2@quizapp.com` (Enrolled in Algorithms)
  - `student3@quizapp.com` (Enrolled in Algorithms)
  - `student4@quizapp.com` (Enrolled in Calculus)
  - `student5@quizapp.com` (Enrolled in Calculus)
