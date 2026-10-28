-- Bell notice telling a volunteer which entrance he was placed in.
ALTER TYPE "NotificationKind" ADD VALUE 'ENTRY_ASSIGNED';

ALTER TABLE "Enrollment" ADD COLUMN "notifiedEntry" TEXT;
