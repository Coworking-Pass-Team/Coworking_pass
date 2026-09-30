-- New notification type for support ticket alerts sent to administrators
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUPPORT_TICKET';
