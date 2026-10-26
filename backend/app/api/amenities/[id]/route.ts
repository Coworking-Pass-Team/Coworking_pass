import { NextResponse } from "next/server";
import { requireRoles } from '@/lib/ownership';
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


/**
 * @swagger
 * /api/amenities/{id}:
 *   put:
 *     summary: الموافقة أو رفض مرفق
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: تم تحديث حالة المرفق
 */
// PUT /api/amenities/[id] — الموافقة أو رفض مرفق مقترح
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const roleDenied = requireRoles(user, ['SUPER_ADMIN']);
    if (roleDenied) return roleDenied;

    const { id } = await params;
    const { status, reason } = await request.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "status must be either APPROVED or REJECTED." },
        { status: 400 }
      );
    }

    const before = await prisma.amenityCatalog.findUnique({ where: { id }, select: { status: true, requestedBy: true } });
    const amenity = await prisma.amenityCatalog.update({
      where: { id },
      data: { status },
    });

    // Tell the partner who asked for it what the administration decided (best effort)
    if (before && before.status !== status && before.requestedBy && before.requestedBy !== user.userId) {
      const approved = status === "APPROVED";
      const note = typeof reason === "string" && reason.trim() ? ` Reason: ${reason.trim().slice(0, 300)}` : "";
      await prisma.notification.create({
        data: {
          userId: before.requestedBy,
          type: "AMENITY_REQUEST_STATUS",
          title: approved ? "Amenity Request Approved" : "Amenity Request Rejected",
          message: approved
            ? `Your custom amenity request "${amenity.name}" has been approved by the Admin and added to the platform catalog!`
            : `Your custom amenity request "${amenity.name}" was rejected by the Admin.${note}`,
          channel: "IN_APP",
          sentAt: new Date(),
        },
      }).catch((err) => console.warn("Amenity decision notification failed:", err));
    }

    return NextResponse.json({ message: "Amenity status updated successfully.", amenity });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Amenity not found or an error occurred." },
      { status: 404 }
    );
  }
}

// DELETE /api/amenities/[id] — حذف مرفق
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const roleDenied = requireRoles(user, ['SUPER_ADMIN']);
    if (roleDenied) return roleDenied;

    const { id } = await params;
    await prisma.amenityCatalog.delete({ where: { id } });
    return NextResponse.json({ message: "Amenity deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Amenity not found or an error occurred." },
      { status: 404 }
    );
  }
}