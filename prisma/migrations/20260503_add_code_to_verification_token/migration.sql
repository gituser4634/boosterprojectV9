-- Add code column to VerificationToken table
ALTER TABLE "VerificationToken" ADD COLUMN "code" TEXT NOT NULL DEFAULT '';

-- Create index on code for faster lookups
CREATE INDEX "VerificationToken_code_idx" ON "VerificationToken"("code");
