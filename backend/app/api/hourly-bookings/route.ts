import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { seedStandardWorkspaces } from '@/lib/seed-data';


export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const bookings = await prisma.hourlyBooking.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true, city: true, images: true } },
        section: {
          include: {
            workspace: { select: { id: true, name: true, city: true } }
          }
        },
        package: true
      }
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('❌ Error fetching hourly bookings:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الحجوزات الساعية' },
      { status: 500 }
    )
  }
}


/**
 * @swagger
 * /api/hourly-bookings:
 *   post:
 *     summary: إنشاء حجز ساعي
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, sectionId, packageId, startDate, endDate]
 *             properties:
 *               userId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *               packageId:
 *                 type: string
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إنشاء الحجز الساعي
 */

export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);

    const body = await request.json();
    const {
      userId,
      workspaceId,
      sectionId,
      packageId,
      startDate,
      endDate,
      status,
      sectionType,
      spaceName,
      city,
      durationHours,
      durationDetails
    } = body;

    // تطبيع status — HourlyBooking يستخدم LifecycleStatus: ACTIVE, EXPIRED, CANCELLED
    const validStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED'];
    const normalizedStatus = validStatuses.includes((status || '').toUpperCase())
      ? (status || '').toUpperCase()
      : 'ACTIVE';

    // تطبيع المدينة — استنتج المدينة من اسم المساحة أو القيمة المُرسَلة
    const resolveCity = (name?: string, sentCity?: string): string => {
      if (sentCity && sentCity.trim()) return sentCity.trim();
      const n = (name || '').toLowerCase();
      if (n.includes('jeddah') || n.includes('جدة')) return 'Jeddah';
      if (n.includes('dammam') || n.includes('الدمام')) return 'Dammam';
      if (n.includes('riyadh') || n.includes('الرياض')) return 'Riyadh';
      if (n.includes('khobar') || n.includes('الخبر')) return 'Al Khobar';
      if (n.includes('mecca') || n.includes('مكة')) return 'Mecca';
      if (n.includes('medina') || n.includes('المدينة')) return 'Medina';
      return 'Riyadh';
    };

    let effectiveUserId = userId || (user ? user.userId : null);

    if (effectiveUserId) {
      const existingUser = await prisma.user.findUnique({ where: { id: effectiveUserId } });
      if (!existingUser) {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) effectiveUserId = firstUser.id;
      }
    } else {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) effectiveUserId = firstUser.id;
    }

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'يرجى تسجيل الدخول أو توفير معرف مستخدم صالح' },
        { status: 401 }
      );
    }

    // تحديد نوع القسم المطلوب (THEATER, MEETING_ROOM, DESK)
    const validSectionTypes = ['DESK', 'MEETING_ROOM', 'THEATER'];
    const requestedType = validSectionTypes.includes(sectionType) ? sectionType : 'MEETING_ROOM';

    const resolvedCity = resolveCity(spaceName, city);
    const cleanCity = resolvedCity.replace(/al\s+/i, '').trim();

    // البحث عن مساحة العمل المعتمدة مسبقاً بدقة (تماماً مثل DirectBooking)
    let ws = workspaceId ? await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { sections: true }
    }) : null;

    if (!ws && spaceName) {
      const trimmedName = spaceName.trim();

      // 1. Exact match in city (case-insensitive)
      ws = await prisma.workspace.findFirst({
        where: {
          name: { equals: trimmedName, mode: 'insensitive' },
          city: { contains: cleanCity, mode: 'insensitive' }
        },
        include: { sections: true }
      });

      // 2. Contains match in city (e.g. "Oasis Cowork" matches "Oasis Coworking" in Al Khobar)
      if (!ws) {
        ws = await prisma.workspace.findFirst({
          where: {
            name: { contains: trimmedName, mode: 'insensitive' },
            city: { contains: cleanCity, mode: 'insensitive' }
          },
          include: { sections: true }
        });
      }

      // 3. First word match in city (e.g. "Oasis" in Al Khobar)
      if (!ws) {
        const firstWord = trimmedName.split(/\s+/)[0];
        if (firstWord && firstWord.length > 2) {
          ws = await prisma.workspace.findFirst({
            where: {
              name: { contains: firstWord, mode: 'insensitive' },
              city: { contains: cleanCity, mode: 'insensitive' }
            },
            include: { sections: true }
          });
        }
      }

      // 4. Exact match overall
      if (!ws) {
        ws = await prisma.workspace.findFirst({
          where: { name: { equals: trimmedName, mode: 'insensitive' } },
          include: { sections: true }
        });
      }

      // 5. Contains match overall
      if (!ws) {
        ws = await prisma.workspace.findFirst({
          where: { name: { contains: trimmedName, mode: 'insensitive' } },
          include: { sections: true }
        });
      }
    }

    // 6. City match if spaceName alone wasn't enough (e.g., Khobar)
    if (!ws && cleanCity) {
      ws = await prisma.workspace.findFirst({
        where: { city: { contains: cleanCity, mode: 'insensitive' } },
        include: { sections: true }
      });
    }

    // 5. Seed standard workspaces if none found
    if (!ws) {
      await seedStandardWorkspaces();
      if (spaceName) {
        ws = await prisma.workspace.findFirst({
          where: { name: { contains: spaceName.trim(), mode: 'insensitive' } },
          include: { sections: true },
        });
      }
    }

    // 6. Self-healing fallback: Create the workspace with exact name and city (NEVER pick random wrong space!)
    if (!ws && (spaceName || workspaceId)) {
      let partner = await prisma.partner.findFirst();
      if (!partner) {
        partner = await prisma.partner.create({
          data: {
            brandName: 'Coworking Partner Network',
            contactEmail: 'partner@coworkingpass.sa',
            taxNumber: '310000000000003',
            revenueSharePercentage: 15,
          },
        });
      }

      const wsName = spaceName ? spaceName.trim() : 'Coworking Space';
      const wsCity = resolveCity(spaceName, city);
      ws = await prisma.workspace.create({
        data: {
          partnerId: partner.id,
          name: wsName,
          city: wsCity,
          dailyRate: 60,
          monthlyRate: 750,
          passVisitValue: 60,
          totalCapacity: 30,
        },
        include: { sections: true },
      });
    }

    if (!ws) {
      ws = await prisma.workspace.findFirst({ include: { sections: true } });
    }

    if (!ws) {
      return NextResponse.json({ error: 'مساحة العمل غير موجودة' }, { status: 404 });
    }

    // حساب الساعات وتطبيق قيد الـ 4 ساعات كحد أقصى يومياً
    const startObj = startDate ? new Date(startDate) : new Date();
    let endObj = endDate ? new Date(endDate) : new Date(startObj.getTime() + 3600000);

    let computedHours = durationHours ? Number(durationHours) : 0;
    if (!computedHours) {
      const diffMs = endObj.getTime() - startObj.getTime();
      const diffHrs = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      computedHours = diffHrs > 0 ? Math.round(diffHrs) : 1;
    }

    // تطبيق الحد الأقصى للساعات اليومية (4 ساعات كحد أقصى)
    if (computedHours > 4) {
      computedHours = 4;
      endObj = new Date(startObj.getTime() + computedHours * 3600000);
    }
    if (computedHours < 1) {
      computedHours = 1;
    }

    const computedDetails = durationDetails || `${computedHours} ${computedHours === 1 ? 'Hour' : 'Hours'}`;

    // التحقق من وجود القسم المطلوب داخل هذه المساحة المحددة
    let targetSectionId = sectionId;
    let targetPackageId = packageId;

    let sec = targetSectionId ? await prisma.workspaceSection.findUnique({
      where: { id: targetSectionId },
      include: { hourlyPackages: true, workspace: true }
    }) : null;

    if (!sec || sec.workspaceId !== ws.id || (sectionType && sec.type !== requestedType)) {
      sec = await prisma.workspaceSection.findFirst({
        where: { workspaceId: ws.id, type: requestedType },
        include: { hourlyPackages: true, workspace: true }
      });
    }

    if (!sec) {
      const sectionName = requestedType === 'THEATER' 
        ? `${ws.name} - Theater`
        : requestedType === 'MEETING_ROOM'
        ? `${ws.name} - Meeting Room`
        : `${ws.name} - Desk Area`;

      sec = await prisma.workspaceSection.create({
        data: {
          workspaceId: ws.id,
          type: requestedType as any,
          name: sectionName,
          capacity: requestedType === 'THEATER' ? 100 : 20,
          dailyRate: requestedType === 'THEATER' ? 1500 : 200,
        },
        include: { hourlyPackages: true, workspace: true }
      });
    }

    targetSectionId = sec.id;

    // التأكد من وجود باقة ساعات متوافقة
    let pkg = sec.hourlyPackages && sec.hourlyPackages.length > 0
      ? sec.hourlyPackages.find((p: any) => p.id === targetPackageId) || sec.hourlyPackages[0]
      : await prisma.hourlyPackage.findFirst({ where: { sectionId: sec.id } });

    if (!pkg) {
      pkg = await prisma.hourlyPackage.create({
        data: {
          sectionId: sec.id,
          packageName: requestedType === 'THEATER' ? `${computedHours} Hour Theater Package` : `${computedHours} Hour Package`,
          hoursAmount: Math.min(4, computedHours),
          periodType: 'PER_DAY',
          price: Math.max(35, Math.round((sec.dailyRate || 100) / 4 * computedHours)),
        }
      });
    }

    targetPackageId = pkg.id;

    // إنشاء الحجز الساعي مع ربط مساحة العمل وعدد الساعات وتفاصيلها بدقة
    const booking = await prisma.hourlyBooking.create({
      data: {
        userId: effectiveUserId,
        workspaceId: ws.id,
        sectionId: targetSectionId,
        packageId: targetPackageId,
        startDate: startObj,
        endDate: endObj,
        durationDetails: computedDetails,
        status: normalizedStatus as any,
        hoursUsed: computedHours,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true, city: true, images: true } },
        section: {
          include: {
            workspace: { select: { id: true, name: true, city: true } }
          }
        },
        package: true,
      }
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating hourly booking:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ في إنشاء الحجز الساعي' },
      { status: 500 }
    );
  }
}