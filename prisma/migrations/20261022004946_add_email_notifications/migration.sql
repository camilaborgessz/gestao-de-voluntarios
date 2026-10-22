-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "emailAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "emailStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyWhatsapp" BOOLEAN NOT NULL DEFAULT true;
