-- AddColumn isOnline and lastSeenAt to BoosterProfile
ALTER TABLE "BoosterProfile" ADD COLUMN "isOnline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BoosterProfile" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index for online status queries
CREATE INDEX "BoosterProfile_isOnline_idx" ON "BoosterProfile"("isOnline");
