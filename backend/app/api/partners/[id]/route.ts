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
      return NextResponse.json({ error: "الشريك غير موجود" }, { status: 404 });
    }

    const partner = await prisma.partner.update({
      where: { id },
      data,
    });

    // إذا تحولت الحالة إلى APPROVED
    if (data.status === "APPROVED" && existingPartner.status !== "APPROVED") {
      // إرسال بريد إلكتروني رسمي للمزود
      await sendPartnerApprovalEmail(partner.contactEmail, partner.brandName);

      // إنشاء إشعار داخلي للمستخدم
      const partnerUser = await prisma.user.findFirst({
        where: { email: { equals: partner.contactEmail, mode: "insensitive" } },
      });
      if (partnerUser) {
        await prisma.notification.create({
          data: {
            userId: partnerUser.id,
            type: "PARTNER_APPROVED",
            title: "تم اعتماد حسابك بنجاح",
            message: `تهانينا! تم اعتماد منشأتكم "${partner.brandName}" بنجاح من قبل إدارة المنصة. يمكنك الآن تسجيل الدخول وإضافة مساحات العمل.`,
            channel: "BOTH",
          },
        }).catch(() => {});
      }
    }

    // إذا تحولت الحالة إلى REJECTED
    if (data.status === "REJECTED" && existingPartner.status !== "REJECTED") {
      await sendPartnerRejectionEmail(partner.contactEmail, partner.brandName, rejectionReason);
    }

    return NextResponse.json({ message: "تم تحديث بيانات الشريك بنجاح", partner });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الشريك غير موجود أو حدث خطأ أثناء التحديث" },
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

    return NextResponse.json({ message: "تم حذف الشريك بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الشريك غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}