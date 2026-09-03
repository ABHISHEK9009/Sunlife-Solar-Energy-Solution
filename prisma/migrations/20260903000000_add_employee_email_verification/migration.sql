ALTER TABLE "sunlife"."TeamMember"
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "verificationCodeHash" TEXT,
  ADD COLUMN "verificationExpiresAt" TIMESTAMP(3),
  ADD COLUMN "employeeAccessEnabled" BOOLEAN NOT NULL DEFAULT false;
