-- Team-booking attendees and rescheduling
ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "attendeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "rescheduleCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "rescheduledFrom" TIMESTAMP(3);

ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "attendeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "rescheduleCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "rescheduledFrom" TIMESTAMP(3);
