-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "moodleCmId" INTEGER;
