CREATE TABLE "sunlife"."PayrollProfile" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "fieldAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMode" TEXT NOT NULL DEFAULT 'Bank Transfer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PayrollProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PayrollProfile_memberId_key" ON "sunlife"."PayrollProfile"("memberId");
ALTER TABLE "sunlife"."PayrollProfile" ADD CONSTRAINT "PayrollProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "sunlife"."TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "sunlife"."EmployeeAdvance" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "advanceAmount" DOUBLE PRECISION NOT NULL,
    "advanceDate" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "monthlyDeduction" DOUBLE PRECISION NOT NULL,
    "totalRecovered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstandingBalance" DOUBLE PRECISION NOT NULL,
    "recoveryStatus" TEXT NOT NULL DEFAULT 'Active',
    "startMonth" TEXT NOT NULL,
    "expectedCompletionMonth" TEXT NOT NULL,
    "notes" TEXT,
    "settlements" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmployeeAdvance_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmployeeAdvance_memberId_idx" ON "sunlife"."EmployeeAdvance"("memberId");
ALTER TABLE "sunlife"."EmployeeAdvance" ADD CONSTRAINT "EmployeeAdvance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "sunlife"."TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "sunlife"."MonthlyPayroll" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "monthlySalary" DOUBLE PRECISION NOT NULL,
    "totalDaysInMonth" INTEGER NOT NULL,
    "payableDays" DOUBLE PRECISION NOT NULL,
    "payableSalary" DOUBLE PRECISION NOT NULL,
    "fieldAllowance" DOUBLE PRECISION NOT NULL,
    "advanceOutstanding" DOUBLE PRECISION NOT NULL,
    "scheduledAdvanceDeduction" DOUBLE PRECISION NOT NULL,
    "otherDeductions" DOUBLE PRECISION NOT NULL,
    "otherDeductionNote" TEXT,
    "netPayable" DOUBLE PRECISION NOT NULL,
    "advanceSettlementType" TEXT,
    "advanceSettlementAmount" DOUBLE PRECISION,
    "advanceNotSettledReason" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" TEXT,
    "paymentMode" TEXT,
    "paidAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MonthlyPayroll_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MonthlyPayroll_memberId_month_key" ON "sunlife"."MonthlyPayroll"("memberId", "month");
ALTER TABLE "sunlife"."MonthlyPayroll" ADD CONSTRAINT "MonthlyPayroll_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "sunlife"."TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "sunlife"."LeaveRequest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LeaveRequest_memberId_status_idx" ON "sunlife"."LeaveRequest"("memberId", "status");
ALTER TABLE "sunlife"."LeaveRequest" ADD CONSTRAINT "LeaveRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "sunlife"."TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
