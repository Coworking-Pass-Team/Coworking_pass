import { NextResponse } from "next/server";
import { getOccupiedSeatsToday } from "@/lib/capacity";
import { redactHiddenWorkspace } from "@/lib/workspace-visibility";
import { isValidHhmm } from "@/lib/operating-hours";
import { pickBilingualFields } from "@/lib/bilingual";
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

import { seedStandardWorkspaces, deduplicateWorkspaces } from "@/lib/seed-data";

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

    // Live availability for today, computed from confirmed bookings
    const occupiedByWorkspace = await getOccupiedSeatsToday(workspaces.map((w: any) => w.id));

    // Hidden workspaces are redacted for everyone except admins and the owning partner
    const caller = await getTokenFromRequest(request);
    const isAdmin = caller?.role === 'SUPER_ADMIN';
    const ownerEmail = caller?.role === 'PARTNER_ADMIN'
      ? (await prisma.user.findUnique({ where: { id: caller.userId }, select: { email: true } }))?.email?.toLowerCase()
      : undefined;

    const formatted = workspaces.map((w: any) => w.isVisible === false && !isAdmin && !(ownerEmail && w.partner?.contactEmail?.toLowerCase() === ownerEmail)
      ? redactHiddenWorkspace(w)
      : ({
      ...w,
      occupiedSeats: occupiedByWorkspace.get(w.id) || 0,
      availableCapacity: Math.max(0, (Number(w.totalCapacity) || 0) - (occupiedByWorkspace.get(w.id) || 0)),
      images: Array.isArray(w.images) ? w.images : [],
      amenities: Array.isArray(w.amenities)
        ? w.amenities.map((wa: any) => wa.amenity?.name || wa.name).filter(Boolean)
        : [],
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error.", details: error?.message || String(error) }, { status: 500 });
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
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    // Verify that the requester is a space partner or platform admin
    const userRole = String(user.role || '').toUpperCase();
    const isPartnerOrAdmin = userRole === 'PARTNER_ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'PROVIDER' || userRole === 'ADMIN';
    if (!isPartnerOrAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only space partners and platform administrators are authorized to add workspaces." },
        { status: 403 }
      );
    }

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
      openingTime,
      closingTime,
      is24Hours,
    } = body;

    const effectivePassVisitValue = passVisitValue ?? 15;
    const effectiveTotalCapacity = totalCapacity ?? 30;

    if (!name || !city) {
      return NextResponse.json(
        { error: "Required fields: name, city" },
        { status: 400 }
      );
    }

    let finalPartnerId = partnerId;
    let partnerExists = partnerId ? await prisma.partner.findUnique({ where: { id: partnerId } }) : null;
    if (!partnerExists) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
      if (dbUser?.email) {
        const foundPartner = await prisma.partner.findFirst({
          where: { contactEmail: { equals: dbUser.email, mode: 'insensitive' } },
        });
        if (foundPartner) {
          partnerExists = foundPartner;
          finalPartnerId = foundPartner.id;
        }
      }
      if (!partnerExists) {
        const fallbackPartner = await prisma.partner.findFirst();
        if (fallbackPartner) {
          partnerExists = fallbackPartner;
          finalPartnerId = fallbackPartner.id;
        } else {
          partnerExists = await prisma.partner.create({
            data: {
              brandName: dbUser?.name || 'Workspace Partner',
              contactEmail: dbUser?.email || 'partner@coworkingpass.sa',
              taxNumber: '300000000000003',
              revenueSharePercentage: 15,
            },
          });
          finalPartnerId = partnerExists.id;
        }
      }
    }

    const workspace = await prisma.workspace.create({
      data: {
        partnerId: finalPartnerId,
        name,
        city,
        locationMapUrl,
        dailyRate,
        monthlyRate,
        yearlyRate,
        passVisitValue: effectivePassVisitValue,
        totalCapacity: effectiveTotalCapacity,
        images: Array.isArray(images) ? images : [],
        ...(isValidHhmm(openingTime) && { openingTime: openingTime.trim() }),
        ...(isValidHhmm(closingTime) && { closingTime: closingTime.trim() }),
        ...(typeof is24Hours === 'boolean' && { is24Hours }),
        ...pickBilingualFields(body),
      },
    });

    if (Array.isArray(amenities) && amenities.length > 0) {
      await syncWorkspaceAmenities(workspace.id, amenities);
    }

    return NextResponse.json(
      { message: "Workspace created successfully.", workspace: { ...workspace, amenities: amenities || [] } },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}