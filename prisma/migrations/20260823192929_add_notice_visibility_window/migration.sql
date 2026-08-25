-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "visibleFrom" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "visibleUntil" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Notice_visibleFrom_visibleUntil_idx" ON "Notice"("visibleFrom", "visibleUntil");
