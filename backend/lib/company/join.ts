import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type JoinTargetResult =
  | { ok: true; company: { id: string; companyName: string; hrAdminId: string } }
  | { ok: false; status: number; error: string };

/** The company whose HR admin uses this email (how an employee names their company). */
export async function findCompanyByHrEmail(rawEmail: unknown): Promise<JoinTargetResult> {
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return { ok: false, status: 400, error: "Please enter your company HR admin's email address." };
  }
  const company = await prisma.company.findFirst({
    where: { hrAdmin: { email: { equals: email, mode: "insensitive" } } },
    select: { id: true, companyName: true, hrAdminId: true },
  });
  if (!company) {
    return { ok: false, status: 404, error: "No company on Coworking Pass uses this HR email. Please check it with your HR admin." };
  }
  return { ok: true, company };
}

/** Records a pending request (one per member at a time) without notifying anyone yet. */
export async function createPendingJoinRequest(userId: string, companyId: string) {
  await prisma.companyJoinRequest.updateMany({
    where: { userId, status: "PENDING" },
    data: { status: "CANCELLED", decidedAt: new Date() },
  });
  return prisma.companyJoinRequest.create({ data: { userId, companyId } });
}

/** Tells the HR admin about a member's pending request. */
export async function notifyHrOfJoinRequest(requestId: string) {
  const request = await prisma.companyJoinRequest.findUnique({
    where: { id: requestId },
    select: {
      status: true,
      user: { select: { name: true, email: true } },
      company: { select: { companyName: true, hrAdminId: true } },
    },
  });
  if (!request || request.status !== "PENDING") return;
  await prisma.notification.create({
    data: {
      userId: request.company.hrAdminId,
      type: "PASS_ASSIGNED",
      title: "New team join request",
      message: `${request.user.name} (${request.user.email}) asked to join the ${request.company.companyName} team.`,
      channel: "IN_APP",
      sentAt: new Date(),
    },
  }).catch((err) => console.error("Join request notification failed:", err));
}

/** Notifies HR admins about the requests a member made while signing up, once their email is verified. */
export async function notifyPendingJoinRequestsOf(userId: string) {
  const pending = await prisma.companyJoinRequest.findMany({ where: { userId, status: "PENDING" }, select: { id: true } });
  for (const request of pending) await notifyHrOfJoinRequest(request.id);
}
