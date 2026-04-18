-- AlterTable Task: add reminderSentAt for cron deduplication
ALTER TABLE "Task" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
