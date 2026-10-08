-- CreateEnum
CREATE TYPE "HelpMode" AS ENUM ('INDIVIDUAL', 'COUPLE');

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "slotId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "helpMode" "HelpMode" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateTable
CREATE TABLE "EventSlot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "location" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventSlot_eventId_idx" ON "EventSlot"("eventId");

-- AddForeignKey
ALTER TABLE "EventSlot" ADD CONSTRAINT "EventSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "EventSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
