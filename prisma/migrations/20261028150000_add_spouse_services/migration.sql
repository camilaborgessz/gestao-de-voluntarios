-- Services done by a volunteer's spouse (no account), kept for the "mais assíduos" ranking.
CREATE TABLE "SpouseService" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SpouseService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SpouseService_userId_key_key" ON "SpouseService"("userId", "key");

ALTER TABLE "SpouseService" ADD CONSTRAINT "SpouseService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
