-- Member accounts asking to join a company team (approved or declined by the HR admin)
CREATE TABLE IF NOT EXISTS "CompanyJoinRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    CONSTRAINT "CompanyJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CompanyJoinRequest_companyId_status_idx" ON "CompanyJoinRequest"("companyId", "status");
CREATE INDEX IF NOT EXISTS "CompanyJoinRequest_userId_status_idx" ON "CompanyJoinRequest"("userId", "status");

ALTER TABLE "CompanyJoinRequest" ADD CONSTRAINT "CompanyJoinRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyJoinRequest" ADD CONSTRAINT "CompanyJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
