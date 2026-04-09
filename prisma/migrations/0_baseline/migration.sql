-- Baseline migration: represents the existing database state before Prisma Migrate was introduced.
-- This migration is marked as already applied and will not be executed against the database.

CREATE TYPE "Plan" AS ENUM ('FREE', 'PREMIUM');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'DONE', 'ARCHIVED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "moodleUsername" TEXT NOT NULL,
    "moodleUserId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_moodleUsername_key" ON "User"("moodleUsername");

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moodleAssignmentId" INTEGER,
    "title" TEXT NOT NULL,
    "courseId" INTEGER,
    "courseName" TEXT,
    "semester" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Task_userId_moodleAssignmentId_key" ON "Task"("userId", "moodleAssignmentId");

ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
