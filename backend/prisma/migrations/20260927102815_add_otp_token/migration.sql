-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('PASSWORD_RESET', 'LOGIN_2FA');

-- CreateTable
CREATE TABLE "OtpToken" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpToken_identifier_purpose_idx" ON "OtpToken"("identifier", "purpose");
