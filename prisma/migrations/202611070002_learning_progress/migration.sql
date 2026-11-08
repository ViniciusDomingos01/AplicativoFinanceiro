ALTER TABLE "lesson_progress" ADD COLUMN "courseId" VARCHAR(80) NOT NULL DEFAULT '1';
DROP INDEX "lesson_progress_userId_lessonId_key";
CREATE UNIQUE INDEX "lesson_progress_userId_courseId_lessonId_key" ON "lesson_progress"("userId", "courseId", "lessonId");
CREATE INDEX "lesson_progress_userId_courseId_idx" ON "lesson_progress"("userId", "courseId");

ALTER TABLE "quiz_attempts" ADD COLUMN "courseId" VARCHAR(80) NOT NULL DEFAULT '1';
