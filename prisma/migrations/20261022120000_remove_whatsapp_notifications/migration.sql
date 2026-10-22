-- Reminders are email-only now: drop the WhatsApp delivery tracking and the 12h reminder mark.
DROP INDEX IF EXISTS "Notification_whatsappStatus_createdAt_idx";

ALTER TABLE "Notification"
  DROP COLUMN "whatsappStatus",
  DROP COLUMN "whatsappError",
  DROP COLUMN "whatsappAttempts";

ALTER TABLE "User" DROP COLUMN "notifyWhatsapp";

ALTER TABLE "Enrollment" DROP COLUMN "remind12At";
