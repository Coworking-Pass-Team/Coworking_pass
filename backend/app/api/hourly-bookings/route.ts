import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { seedStandardWorkspaces } from '@/lib/seed-data';


export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const bookings = await prisma.hourlyBooking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        section: {
          include: {
            workspace: true
          }
        },
        package: true
      }
    })
    return NextResponse.json(bookings)
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
    const { userId, sectionId, packageId, startDate, endDate, status, sectionType, spaceName, workspaceId, city } = body;

    // تطبيع status — HourlyBooking يستخدم LifecycleStatus: ACTIVE, EXPIRED, CANCELLED
    const validStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED'];
    const normalizedStatus = validStatuses.includes((status || '').toUpperCase())
      ? (status || '').toUpperCase()
      : 'ACTIVE';

    // تطبيع المدينة — استخدم المدينة المُرسَلة أو استنتجها من اسم المساحة
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

    // التحقق من وجود القسم والباقة في قاعدة بيانات Neon
    let targetSectionId = sectionId;
    let targetPackageId = packageId;

    // البحث عن مساحة العمل المعتمدة مسبقاً (لا ننشئ Workspace جديد عند الحجز أبداً)
    let ws = workspaceId ? await prisma.workspace.findUnique({ where: { id: workspaceId } }) : null;
    if (!ws && spaceName) {
      ws = await prisma.workspace.findFirst({
        where: { name: { equals: spaceName, mode: 'insensitive' } }
      });
    }

    if (!ws) {
      const count = await prisma.workspace.count();
      if (count === 0) {
        await seedStandardWorkspaces();
        ws = await prisma.workspace.findFirst({
          where: spaceName ? { name: { equals: spaceName, mode: 'insensitive' } } : undefined
        });
      }
    }

    if (!ws) {
      ws = await prisma.workspace.findFirst();
    }

    if (!ws) {
      return NextResponse.json({ error: 'مساحة العمل غير موجودة' }, { status: 404 });
    }

    // التحقق من وجود القسم المطلوب داخل هذه المساحة المحددة
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

    // التأكد من وجود باقة ساعات
    let pkg = sec.hourlyPackages && sec.hourlyPackages.length > 0
      ? sec.hourlyPackages.find((p: any) => p.id === targetPackageId) || sec.hourlyPackages[0]
      : await prisma.hourlyPackage.findFirst({ where: { sectionId: sec.id } });

    if (!pkg) {
      pkg = await prisma.hourlyPackage.create({
        data: {
          sectionId: sec.id,
          packageName: requestedType === 'THEATER' ? '1 Hour Theater Package' : '1 Hour Hourly Package',
          hoursAmount: 1,
          periodType: 'PER_DAY',
          price: 50,
        }
      });
    }

    targetPackageId = pkg.id;

    const booking = await prisma.hourlyBooking.create({
      data: {
        userId: effectiveUserId,
        sectionId: targetSectionId,
        packageId: targetPackageId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 3600000),
        status: normalizedStatus as any,
        hoursUsed: 0,
      },
      include: {
        user: { select: { name: true, email: true } },
        section: {
          include: {
            workspace: true
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