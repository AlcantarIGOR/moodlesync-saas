-- AlterTable Note: add sharing fields
ALTER TABLE "Note" ADD COLUMN "shared" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Note" ADD COLUMN "courseId" INTEGER;
ALTER TABLE "Note" ADD COLUMN "courseName" TEXT;

-- CreateIndex for shared note lookups
CREATE INDEX "Note_shared_courseId_idx" ON "Note"("shared", "courseId");

-- CreateTable NoteViewPosition
CREATE TABLE "NoteViewPosition" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "x" INTEGER NOT NULL DEFAULT 100,
    "y" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "NoteViewPosition_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "NoteViewPosition_noteId_userId_key" ON "NoteViewPosition"("noteId", "userId");

-- CreateIndex
CREATE INDEX "NoteViewPosition_userId_idx" ON "NoteViewPosition"("userId");

-- AddForeignKey
ALTER TABLE "NoteViewPosition" ADD CONSTRAINT "NoteViewPosition_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteViewPosition" ADD CONSTRAINT "NoteViewPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
