-- Arabic name of a room / section (the English name stays the fallback)
ALTER TABLE "WorkspaceSection" ADD COLUMN IF NOT EXISTS "nameAr" TEXT;
