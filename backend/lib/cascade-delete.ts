import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Deletes a workspace together with everything that references it
 * (bookings, check-ins, sections, hourly packages, amenity links). Payments are kept but detached.
 */
export async function deleteWorkspaceCascade(tx: Tx, workspaceId: string): Promise<void> {
  await tx.payment.updateMany({ where: { workspaceId }, data: { workspaceId: null } });
  await tx.qrCheckIn.deleteMany({ where: { workspaceId } });
  await tx.hourlyBooking.deleteMany({ where: { workspaceId } });
  await tx.directBooking.deleteMany({ where: { workspaceId } });
  await tx.workspaceAmenity.deleteMany({ where: { workspaceId } });

  const sections = await tx.workspaceSection.findMany({ where: { workspaceId }, select: { id: true } });
  const sectionIds = sections.map((s) => s.id);
  if (sectionIds.length > 0) {
    // Bookings and check-ins attached to a section but not to the workspace row
    await tx.qrCheckIn.deleteMany({ where: { sectionId: { in: sectionIds } } });
    await tx.hourlyBooking.deleteMany({ where: { sectionId: { in: sectionIds } } });
    await tx.directBooking.deleteMany({ where: { sectionId: { in: sectionIds } } });
    await tx.hourlyPackage.deleteMany({ where: { sectionId: { in: sectionIds } } });
    await tx.workspaceSection.deleteMany({ where: { id: { in: sectionIds } } });
  }
  await tx.workspace.delete({ where: { id: workspaceId } });
}

/** Deletes a partner and all of its workspaces. */
export async function deletePartnerCascade(tx: Tx, partnerId: string): Promise<void> {
  const workspaces = await tx.workspace.findMany({ where: { partnerId }, select: { id: true } });
  for (const ws of workspaces) {
    await deleteWorkspaceCascade(tx, ws.id);
  }
  await tx.payout.deleteMany({ where: { partnerId } });
  await tx.partner.delete({ where: { id: partnerId } });
}

/**
 * Deletes a user account and all data owned by that user in one transaction.
 * Corporate (HR admin) accounts also remove their company; its employees are detached, not deleted.
 */
export async function deleteUserCascade(tx: Tx, userId: string): Promise<void> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true, hrAdminOf: { select: { id: true } } },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  // Company owned by this HR admin
  if (user.hrAdminOf) {
    const companyId = user.hrAdminOf.id;
    await tx.user.updateMany({ where: { companyId }, data: { companyId: null } });
    await tx.ticketReply.deleteMany({ where: { ticket: { companyId } } });
    await tx.ticket.deleteMany({ where: { companyId } });
    await tx.company.delete({ where: { id: companyId } }); // ledger rows cascade with the company
  }

  // Partner accounts also own a partner record and its venues
  if (user.role === "PARTNER_ADMIN") {
    const partner = await tx.partner.findFirst({ where: { contactEmail: { equals: user.email, mode: "insensitive" } } });
    if (partner) await deletePartnerCascade(tx, partner.id);
  }

  await tx.ticketReply.deleteMany({ where: { OR: [{ userId }, { ticket: { userId } }] } });
  await tx.ticket.deleteMany({ where: { userId } });
  await tx.qrCheckIn.deleteMany({ where: { userId } });
  await tx.notification.deleteMany({ where: { userId } });
  await tx.otpCode.deleteMany({ where: { userId } });
  await tx.pointsTransaction.deleteMany({ where: { userId } });
  await tx.loyaltyPoint.deleteMany({ where: { userId } });
  await tx.walletTransaction.deleteMany({ where: { userId } });
  await tx.wallet.deleteMany({ where: { userId } });
  await tx.payment.deleteMany({ where: { userId } });
  await tx.hourlyBooking.deleteMany({ where: { userId } });
  await tx.directBooking.deleteMany({ where: { userId } });
  await tx.subscription.deleteMany({ where: { userId } });
  await tx.loyaltyRule.updateMany({ where: { approvedBy: userId }, data: { approvedBy: null } });
  await tx.loyaltyRule.deleteMany({ where: { proposedBy: userId } });
  await tx.amenityCatalog.updateMany({ where: { requestedBy: userId }, data: { requestedBy: null } });

  await tx.user.delete({ where: { id: userId } });
}
