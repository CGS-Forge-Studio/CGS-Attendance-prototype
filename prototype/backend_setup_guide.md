# CGS Attendance - Prototype Setup & Architecture

This document provides the blueprint for setting up the full NestJS + Next.js + PostgreSQL stack for the CGS Attendance App.

## 1. Tech Stack Overview
*   **Backend:** NestJS (TypeScript)
*   **Frontend:** Next.js (React) + Tailwind CSS
*   **Database:** PostgreSQL
*   **ORM:** Prisma or TypeORM (Prisma recommended for Next.js/NestJS synergy)

## 2. Database Schema (PostgreSQL via Prisma)
For this prototype, you need three core models.

```prisma
model Class {
  id         Int         @id @default(autoincrement())
  name       String      // e.g., "11"
  section    String      // e.g., "C"
  students   Student[]
}

model Student {
  id         Int          @id @default(autoincrement())
  rollNumber String       @unique
  name       String
  classId    Int
  class      Class        @relation(fields: [classId], references: [id])
  attendance Attendance[]
}

model Attendance {
  id         Int      @id @default(autoincrement())
  date       DateTime @db.Date
  status     String   // "pre", "ab", "od"
  studentId  Int
  student    Student  @relation(fields: [studentId], references: [id])
  updatedAt  DateTime @updatedAt

  @@unique([date, studentId]) // One record per student per day
}
```

## 3. NestJS Backend Logic (API Endpoints)
Your NestJS controllers should expose the following endpoints:

*   `GET /api/class/11-c/details`: Returns class strength and average attendance for the login screen.
*   `GET /api/attendance/dates`: Returns a list of the last 7 days (excluding Sundays) and flags which days are missing attendance.
*   `GET /api/attendance?date=YYYY-MM-DD`: Fetches the attendance records for a specific date.
*   `POST /api/attendance`: Submits the attendance array. 
    *   **CRITICAL BACKEND VALIDATION:** The NestJS service must check the server time. If `currentTime > 09:45 AM`, it must throw an HTTP 403 Forbidden error, rejecting any modifications. This ensures security beyond the frontend UI lock.

## 4. IDE Setup Instructions (Testing the Prototype)

To run the frontend prototype provided in `App.tsx` immediately without setting up the full backend yet:

1.  **Initialize Next.js Project:**
    ```bash
    npx create-next-app@latest cgs-attendance --typescript --tailwind --eslint
    cd cgs-attendance
    ```
2.  **Install Icons:**
    ```bash
    npm install lucide-react
    ```
3.  **Replace App Content:**
    *   Open `src/app/page.tsx` (or `App.tsx` if standard React).
    *   Replace the entire contents of that file with the code provided in the `App.tsx` block below.
4.  **Run the Server:**
    ```bash
    npm run dev
    ```
5.  **Test the Logic:** Use the "Time Simulator" in the prototype's UI to change the current time and verify the 9:45 AM cutoff behavior for both today and missed days.