CREATE TABLE "sunlife"."TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "territory" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "skills" JSONB NOT NULL DEFAULT '[]',
    "joinedYear" TEXT NOT NULL,
    "monthlySalary" DOUBLE PRECISION,
    "email" TEXT,
    "dob" TEXT,
    "address" TEXT,
    "department" TEXT,
    "joiningDate" TEXT,
    "employmentType" TEXT,
    "reportingManager" TEXT,
    "bankAccountHolder" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankIFSC" TEXT,
    "bankBranch" TEXT,
    "bankAccountType" TEXT,
    "upiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sunlife"."Attendance" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Present',
    "checkIn" TEXT NOT NULL DEFAULT '--',
    "checkOut" TEXT NOT NULL DEFAULT '--',
    "assignedSite" TEXT NOT NULL,
    "remarks" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attendance_memberId_date_key" ON "sunlife"."Attendance"("memberId", "date");
CREATE INDEX "Attendance_date_idx" ON "sunlife"."Attendance"("date");
ALTER TABLE "sunlife"."Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "sunlife"."TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
