import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { sendPartnerApprovalEmail, sendPartnerRejectionEmail } from "@/lib/mailer";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();
    const { id } = await params;
    const body = await request.json();
    const { rejectionReason, ...data } = body;

    const existingPartner = await prisma.partner.findUnique({
      where: { id },
    });

    if (!existingPartner) {
      return NextResponse.json({ error: "Partner not found." }, { status: 404 });
    }

    const partner = await prisma.partner.update({
      where: { id },
      data,
    });

    // If status changed to APPROVED
    if (data.status === "APPROVED" && existingPartner.status !== "APPROVED") {
      // Send official email
      await sendPartnerApprovalEmail(partner.contactEmail, partner.brandName);

      // Create in-app notification
      const partnerUser = await prisma.user.findFirst({
        where: { email: { equals: partner.contactEmail, mode: "insensitive" } },
      });
      if (partnerUser) {
        await prisma.notification.create({
          data: {
            userId: partnerUser.id,
            type: "PARTNER_APPROVED",
            title: "Partner Account Approved",
            message: `Congratulations! Your venue "${partner.brandName}" has been approved by platform administration. You may now log in and add workspaces.`,
            channel: "BOTH",
          },
        }).catch(() => {});
      }
    }

    // If status changed to REJECTED
    if (data.status === "REJECTED" && existingPartner.status !== "REJECTED") {
      await sendPartnerRejectionEmail(partner.contactEmail, partner.brandName, rejectionReason);
    }

    return NextResponse.json({ message: "Partner updated successfully.", partner });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Partner not found or error occurred during update." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;

    await prisma.partner.delete({ where: { id } });

    return NextResponse.json({ message: "Partner deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Partner not found or an error occurred." },
      { status: 404 }
    );
  }
}