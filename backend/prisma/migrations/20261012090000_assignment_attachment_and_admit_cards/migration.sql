-- CreateEnum
CREATE TYPE "AdmitCardStatus" AS ENUM ('APPROVED', 'REVOKED');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "attachmentUrl" TEXT;

-- CreateTable
CREATE TABLE "AdmitCard" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "status" "AdmitCardStatus" NOT NULL DEFAULT 'APPROVED',
    "overridden" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmitCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdmitCard_cardNumber_key" ON "AdmitCard"("cardNumber");

-- CreateIndex
CREATE INDEX "AdmitCard_studentId_idx" ON "AdmitCard"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmitCard_examId_studentId_key" ON "AdmitCard"("examId", "studentId");

-- AddForeignKey
ALTER TABLE "AdmitCard" ADD CONSTRAINT "AdmitCard_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmitCard" ADD CONSTRAINT "AdmitCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Same deny-by-default RLS as every other table (see 20261011090000_enable_row_level_security).
ALTER TABLE "AdmitCard" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  EXECUTE format('CREATE POLICY api_full_access ON public."AdmitCard" TO %I USING (true) WITH CHECK (true)', current_user);
END
$$;
REVOKE ALL ON "AdmitCard" FROM PUBLIC;
