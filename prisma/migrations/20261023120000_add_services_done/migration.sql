-- Keeps the volunteer ranking alive after old events are purged from the archive.
ALTER TABLE "User" ADD COLUMN "servicesDone" INTEGER NOT NULL DEFAULT 0;
