import { prisma } from "@/lib/prisma";

interface Caller {
  userId: string;
  role: string;
}

/**
 * Hidden workspaces are only visible to super admins and to the partner that owns them.
 * Everyone else (guests, individuals, organizations, other partners) must not see or book them.
 */
export async function canViewHiddenWorkspace(caller: Caller | null, partnerContactEmail?: string | null): Promise<boolean> {
  if (!caller) return false;
  if (caller.role === "SUPER_ADMIN") return true;
  if (caller.role !== "PARTNER_ADMIN" || !partnerContactEmail) return false;
  const dbUser = await prisma.user.findUnique({ where: { id: caller.userId }, select: { email: true } });
  return Boolean(dbUser?.email && dbUser.email.toLowerCase() === partnerContactEmail.toLowerCase());
}

/** Minimal placeholder for a hidden workspace: keeps the name so clients do not re-add a static copy, exposes nothing else. */
export function redactHiddenWorkspace(w: { id: string; name: string; city: string }) {
  return {
    id: w.id,
    name: w.name,
    city: w.city,
    isVisible: false,
    totalCapacity: 0,
    availableCapacity: 0,
    images: [] as string[],
    amenities: [] as string[],
    sections: [] as unknown[],
    partner: null,
  };
}

/** Throws-free check used by booking routes: returns an error message when the workspace is hidden for this caller. */
export async function hiddenWorkspaceError(workspaceId: string, caller: Caller | null): Promise<string | null> {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { isVisible: true, partner: { select: { contactEmail: true } } },
  });
  if (!ws || ws.isVisible) return null;
  if (await canViewHiddenWorkspace(caller, ws.partner?.contactEmail)) return null;
  return "This workspace is currently unavailable.";
}
