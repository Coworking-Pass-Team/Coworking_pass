import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

/**
 * @swagger
 * /api/workspaces:
 *   get:
 *     summary: عرض المساحات (مع إمكانية التصفية)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: قائمة المساحات المطابقة للفلاتر
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

import { seedStandardWorkspaces } from "@/lib/seed-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    let workspaces = await prisma.workspace.findMany({
      where: {
        ...(city && { city: { equals: city, mode: "insensitive" } }),
        ...(minPrice && { dailyRate: { gte: Number(minPrice) } }),
        ...(maxPrice && { dailyRate: { lte: Number(maxPrice) } }),
      },
      include: { partner: true, sections: { include: { hourlyPackages: true } }, amenities: { include: { amenity: true } } },
    });

    // إذا كانت قاعدة البيانات جديدة وخالية، نغذيها تلقائياً بجميع مساحات الشبكة الرسمية
    if (workspaces.length === 0 && !city && !minPrice && !maxPrice) {
      await seedStandardWorkspaces();
      workspaces = await prisma.workspace.findMany({
        include: { partner: true, sections: { include: { hourlyPackages: true } }, amenities: { include: { amenity: true } } },
      });
    }

    const formatted = workspaces.map((w: any) => ({
      ...w,
      images: Array.isArray(w.images) ? w.images : [],
      amenities: Array.isArray(w.amenities)
        ? w.amenities.map((wa: any) => wa.amenity?.name || wa.name).filter(Boolean)
        : [],
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}


/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     summary: إضافة مساحة عمل جديدة
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [partnerId, name, city, passVisitValue, totalCapacity]
 *             properties:
 *               partnerId:
 *                 type: string
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               locationMapUrl:
 *                 type: string
 *               dailyRate:
 *                 type: number
 *               monthlyRate:
 *                 type: number
 *               yearlyRate:
 *                 type: number
 *               passVisitValue:
 *                 type: number
 *               totalCapacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: تم إنشاء المساحة بنجاح
 */
// POST /api/workspaces — إضافة مساحة عمل جديدة
export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const {
      partnerId,
      name,
      city,
      locationMapUrl,
      dailyRate,
      monthlyRate,
      yearlyRate,
      passVisitValue,
      totalCapacity,
      amenities,
      images,
    } = body;

    if (!partnerId || !name || !city || !passVisitValue || !totalCapacity) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: partnerId, name, city, passVisitValue, totalCapacity" },
        { status: 400 }
      );
    }

    const partnerExists = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partnerExists) {
      return NextResponse.json(
        { error: "الشريك (partnerId) غير موجود" },
        { status: 404 }
      );
    }

    const workspace = await prisma.workspace.create({
      data: {
        partnerId,
        name,
        city,
        locationMapUrl,
        dailyRate,
        monthlyRate,
        yearlyRate,
        passVisitValue,
        totalCapacity,
        images: Array.isArray(images) ? images : [],
      },
    });

    if (Array.isArray(amenities) && amenities.length > 0) {
      await syncWorkspaceAmenities(workspace.id, amenities);
    }

    return NextResponse.json(
      { message: "تم إنشاء مساحة العمل بنجاح", workspace: { ...workspace, amenities: amenities || [] } },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}