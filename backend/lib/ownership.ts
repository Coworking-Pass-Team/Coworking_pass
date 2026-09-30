import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Caller {
  userId: string;
  role: string;
}

/** Ids of the partner records that belong to a partner-admin account (matched by contact email). */
export async function getPartnerIdsForUser(userId: string): Promise<string[]> {
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!dbUser?.email) return [];
  const partners = await prisma.partner.findMany({
    where: { contactEmail: { equals: dbUser.email, mode: "insensitive" } },
    select: { id: true },
  });
  return partners.map((p) => p.id);
}

/** Ids of the workspaces owned by a partner-admin account. */
export async function getOwnedWorkspaceIds(userId: string): Promise<string[]> {
  const partnerIds = await getPartnerIdsForUser(userId);
  if (partnerIds.length === 0) return [];
  const workspaces = await prisma.workspace.findMany({ where: { partnerId: { in: partnerIds } }, select: { id: true } });
  return workspaces.map((w) => w.id);
}

/** True for super admins and for the partner that owns the workspace. */
export async function canManageWorkspace(caller: Caller, workspaceId: string): Promise<boolean> {
  if (caller.role === "SUPER_ADMIN") return true;
  if (caller.role !== "PARTNER_ADMIN") return false;
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { partnerId: true } });
  if (!workspace) return false;
  const partnerIds = await getPartnerIdsForUser(caller.userId);
  return partnerIds.includes(workspace.partnerId);
}

export function forbiddenResponse(message = "You are not allowed to perform this action.") {
  return NextResponse.json({ error: message }, { status: 403 });
}
