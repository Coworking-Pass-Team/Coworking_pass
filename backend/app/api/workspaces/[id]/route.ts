import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";




/**
 * @swagger
 * /api/workspaces/{id}:
 *   put:
 *     summary: تعديل مساحة عمل
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
 *             properties:
 *               dailyRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: تم تعديل المساحة
 */
async function syncWorkspaceAmenities(workspaceId: string, amenities: string[]) {
  if (!Array.isArray(amenities)) return;
  await prisma.workspaceAmenity.deleteMany({ where: { workspaceId } });

  for (const amenityName of amenities) {
    if (!amenityName || typeof amenityName !== 'string') continue;
    const trimmed = amenityName.trim();
    if (!trimmed) continue;

    let catalogItem = await prisma.amenityCatalog.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } },
    });

    if (!catalogItem) {
      catalogItem = await prisma.amenityCatalog.create({
        data: {
          name: trimmed,
          isDefault: true,
          status: 'APPROVED',
        },
      });
    }

    await prisma.workspaceAmenity.create({
      data: {
        workspaceId,
        amenityId: catalogItem.id,
      },
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const data = await request.json();
    const { amenities, ...workspaceData } = data;

    const workspace = await prisma.workspace.update({
      where: { id },
      data: workspaceData,
    });

    if (Array.isArray(amenities)) {
      await syncWorkspaceAmenities(id, amenities);
    }

    const updatedWithAmenities = await prisma.workspace.findUnique({
      where: { id },
      include: { partner: true, sections: true, amenities: { include: { amenity: true } } },
    });

    const formatted = updatedWithAmenities
      ? {
          ...updatedWithAmenities,
          amenities: Array.isArray(updatedWithAmenities.amenities)
            ? updatedWithAmenities.amenities.map((wa: any) => wa.amenity?.name || wa.name).filter(Boolean)
            : [],
        }
      : workspace;

    return NextResponse.json({ message: "تم تعديل المساحة بنجاح", workspace: formatted });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "المساحة غير موجودة أو حدث خطأ" },
      { status: 404 }
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

    await prisma.workspace.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف المساحة بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "المساحة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}