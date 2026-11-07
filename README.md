# CGS Attendance - Digital School Attendance System

Full-stack school attendance web application featuring NestJS (Backend), Next.js with React & Tailwind CSS (Frontend), and PostgreSQL (Supabase / Managed Cloud Database).

## Tech Stack Overview
- **Frontend**: Next.js 14+ (App Router), React 18/19, TypeScript, Tailwind CSS, Lucide React
- **Backend**: NestJS, TypeScript, class-validator, class-transformer
- **Database**: PostgreSQL with Prisma ORM (supports local PostgreSQL and cloud providers like Supabase)
- **Deployment Targets**: 
  - Frontend: Netlify / Vercel
  - Backend: Render / Railway
  - Database: Supabase PostgreSQL (Managed Free Tier)

---

## Project Structure
```
Software/
├── package.json                   # Monorepo root scripts
├── README.md                      # Architecture, database schema, & deployment guide
├── PLAN                           # Development plan & roadmap
├── App.tsx                        # Original single-file prototype backup
│
├── frontend/                      # Next.js frontend application
│   ├── .env.example               # Environment variable templates
│   ├── .env.local                 # Local environment config (NEXT_PUBLIC_API_URL)
│   ├── netlify.toml               # Netlify build and routing configuration
│   ├── tailwind.config.ts         # Purple & white sports-card palette (#F4F2F7 canvas)
│   ├── next.config.mjs            # Dynamic API proxy rewrites
│   └── src/
│       ├── app/                   # App Router (page.tsx, layout.tsx, globals.css)
│       ├── components/            # Modular UI (LoginView, StudentList, TimeSimulator, etc.)
│       ├── services/              # API client with dynamic NEXT_PUBLIC_API_URL & mock fallback
│       └── types/                 # TypeScript interfaces
│
└── backend/                       # NestJS backend application
    ├── .env.example               # Environment variables template (DATABASE_URL, ALLOWED_ORIGINS)
    ├── .env                       # Local environment configuration
    ├── nest-cli.json
    ├── prisma/
    │   ├── schema.prisma          # PostgreSQL schema (Class, Teacher, Student, Attendance)
    │   └── seed.ts                # Database seed script for Class 11-C & teacher credentials
    └── src/
        ├── main.ts                # Bootstrap with multi-domain CORS & DTO validation
        ├── app.module.ts          # Core application module
        ├── prisma/                # PrismaService & PrismaModule with database connectivity
        ├── class/                 # Class details endpoint (11-C metrics)
        └── attendance/            # Attendance submission, retrieval, and 9:45 AM cutoff logic
```

---

## Database Schema (PostgreSQL via Prisma)

```prisma
model Class {
  id         Int         @id @default(autoincrement())
  name       String      // e.g., "11"
  section    String      // e.g., "C"
  students   Student[]
  teachers   Teacher[]

  @@unique([name, section])
  @@map("classes")
}

model Teacher {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // Secure credentials for teacher login
  name      String
  classId   Int?
  class     Class?   @relation(fields: [classId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("teachers")
}

model Student {
  id         Int          @id @default(autoincrement())
  rollNumber String       @unique
  name       String
  classId    Int
  class      Class        @relation(fields: [classId], references: [id])
  attendance Attendance[]

  @@map("students")
}

model Attendance {
  id         Int      @id @default(autoincrement())
  date       DateTime @db.Date
  status     String   // "pre", "ab", "od"
  studentId  Int
  student    Student  @relation(fields: [studentId], references: [id])
  updatedAt  DateTime @updatedAt

  @@unique([date, studentId]) // One record per student per day
  @@map("attendances")
}
```

---

## Cloud Deployment Guide

### 1. Database Setup (Supabase)
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In Project Settings > **Database**, copy your **Connection String (URI)**:
   - Use the **Transaction Pooler** (port 6543) for runtime queries:
     `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Use the **Session / Direct Connection** (port 5432) for running migrations and seeding.
3. In `backend/.env`, set `DATABASE_URL` to your Supabase connection string.
4. Push schema to Supabase:
   ```bash
   cd backend
   npx prisma db push
   ```
5. Seed initial data (Class 11-C students and teacher credentials):
   ```bash
   npm run seed
   ```

### 2. Backend Deployment (Render or Railway)
1. Push your repository to GitHub.
2. In **Render** (or **Railway**), create a new **Web Service** pointing to the `backend` folder (or specify root directory `products/Attendance system/Software/backend`).
3. Set build and start commands:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start:prod`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3001` (or let Render set it dynamically)
   - `DATABASE_URL`: Your Supabase connection string
   - `ALLOWED_ORIGINS`: Your Netlify URL (e.g. `https://cgs-attendance.netlify.app`)
5. Copy your deployed backend service URL (e.g., `https://cgs-attendance-api.onrender.com`).

### 3. Frontend Deployment (Netlify)
1. Create a new site in **Netlify** connected to your GitHub repository.
2. Configure build settings (already defined in `frontend/netlify.toml`):
   - **Base directory**: `products/Attendance system/Software/frontend` (or `frontend`)
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
3. Set Environment Variable in Netlify:
   - `NEXT_PUBLIC_API_URL`: Your deployed NestJS backend URL (e.g., `https://cgs-attendance-api.onrender.com`)
4. Deploy! Your permanent Netlify URL (e.g. `https://cgs-attendance.netlify.app`) is now ready for the teacher.

---

## Local Development (Unchanged)
You can continue developing locally without affecting the cloud setup:

```bash
# 1. Backend (runs on port 3001)
cd backend
npm run start:dev

# 2. Frontend (runs on port 3000)
cd frontend
npm run dev
```
*(Or run `npm run dev` from the root to launch both concurrently)*

---

## Testing Cutoff & Seeding Credentials
- **Class 11-C Teacher Login**:
  - Email: `teacher.11c@cgs.edu`
  - Password: `Teacher@CGS2026`
- **Cutoff Security**:
  - Cutoff is 09:45 AM. After 09:45 AM, both the frontend UI and backend API reject modifications with `HTTP 403 Forbidden`.
  - Use the floating **"Dev: Simulate Time"** widget to switch between `09:30 AM` (open) and `10:00 AM` (locked).
