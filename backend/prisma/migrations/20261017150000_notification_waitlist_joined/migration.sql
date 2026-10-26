-- Confirmation notification sent when a guest joins a waitlist
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WAITLIST_JOINED';
