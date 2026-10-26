-- Corporate spending policy, team-booking attendees, company-funded payments and rescheduling
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "employeeSpendingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "employeeMonthlyLimit" DOUBLE PRECISION;

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "attendeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "rescheduleCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "rescheduledFrom" TIMESTAMP(3);

ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "attendeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "rescheduleCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "rescheduledFrom" TIMESTAMP(3);
