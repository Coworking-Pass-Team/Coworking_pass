import { NextResponse } from "next/server";
import { isValidHhmm } from "@/lib/operating-hours";
import { pickBilingualFields } from "@/lib/bilingual";
import { canViewHiddenWorkspace } from "@/lib/workspace-visibility";
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        partner: true,
        sections: {
          include: {
            hourlyPackages: true,
          },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 404 }
      );
    }

    // Hidden workspaces look like they do not exist to anyone but admins and the owning partner
    if (workspace.isVisible === false) {
      const caller = await getTokenFromRequest(request);
      if (!(await canViewHiddenWorkspace(caller, workspace.partner?.contactEmail))) {
        return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
      }
    }

    const formatted = {
      ...workspace,
      images: Array.isArray(workspace.images) ? workspace.images : [],
      amenities: Array.isArray(workspace.amenities)
        ? workspace.amenities.map((wa: any) => wa.amenity?.name || wa.name).filter(Boolean)
        : [],
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching workspace details:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    const { id } = await params;
    const data = await request.json();
    const { amenities } = data;

    // Only platform admins and the owning partner may edit a workspace
    const role = String(user.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN') {
      const owner = await prisma.workspace.findUnique({ where: { id }, include: { partner: true } });
      const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { email: true } });
      const ownsWorkspace = role === 'PARTNER_ADMIN' && owner && dbUser?.email
        && owner.partner.contactEmail.toLowerCase() === dbUser.email.toLowerCase();
      if (!ownsWorkspace) {
        return NextResponse.json({ error: 'You are not allowed to modify this workspace.' }, { status: 403 });
      }
    }

    // Whitelist editable fields (no partnerId / id changes)
    const workspaceData: Record<string, unknown> = {};
    for (const key of ['name', 'city', 'locationMapUrl', 'dailyRate', 'monthlyRate', 'yearlyRate', 'passVisitValue', 'totalCapacity', 'latitude', 'longitude'] as const) {
      if (data[key] !== undefined) workspaceData[key] = data[key];
    }
    if (Array.isArray(data.images)) workspaceData.images = data.images;
    if (isValidHhmm(data.openingTime)) workspaceData.openingTime = data.openingTime.trim();
    if (isValidHhmm(data.closingTime)) workspaceData.closingTime = data.closingTime.trim();
    if (typeof data.is24Hours === 'boolean') workspaceData.is24Hours = data.is24Hours;
    if (typeof data.isVisible === 'boolean') workspaceData.isVisible = data.isVisible;
    Object.assign(workspaceData, pickBilingualFields(data));

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
          images: Array.isArray(updatedWithAmenities.images) ? updatedWithAmenities.images : [],
          amenities: Array.isArray(updatedWithAmenities.amenities)
            ? updatedWithAmenities.amenities.map((wa: any) => wa.amenity?.name || wa.name).filter(Boolean)
            : [],
        }
      : workspace;

    return NextResponse.json({ message: "Workspace updated successfully.", workspace: formatted });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Workspace not found or an error occurred." },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);

    const { id } = await params;

    await prisma.workspaceAmenity.deleteMany({ where: { workspaceId: id } });
    await prisma.workspaceSection.deleteMany({ where: { workspaceId: id } });
    await prisma.workspace.delete({ where: { id } });

    return NextResponse.json({ message: "Workspace deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Workspace not found or an error occurred." },
      { status: 404 }
    );
  }
}