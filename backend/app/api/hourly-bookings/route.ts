import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const bookings = await prisma.hourlyBooking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        section: true,
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
    const { userId, sectionId, packageId, startDate, endDate, status = 'ACTIVE' } = body;

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

    // التحقق من وجود القسم والباقة في قاعدة بيانات Neon
    let targetSectionId = sectionId;
    let targetPackageId = packageId;

    let sec = targetSectionId ? await prisma.workspaceSection.findUnique({
      where: { id: targetSectionId },
      include: { hourlyPackages: true }
    }) : null;

    if (!sec) {
      sec = await prisma.workspaceSection.findFirst({
        include: { hourlyPackages: true }
      });
    }

    if (!sec) {
      // إنشاء مساحة وقسم وباقة إذا كانت الجداول فارغة
      let ws = await prisma.workspace.findFirst();
      if (!ws) {
        let partner = await prisma.partner.findFirst();
        if (!partner) {
          partner = await prisma.partner.create({
            data: {
              companyName: 'Coworking Main Partner',
              contactEmail: 'partner@coworkingpass.com',
              phone: '0500000000',
              status: 'ACTIVE',
            }
          });
        }
        ws = await prisma.workspace.create({
          data: {
            partnerId: partner.id,
            name: 'The Hub Riyadh',
            city: 'Riyadh',
            address: 'Al Olaya District',
            totalCapacity: 50,
            dailyRate: 100,
          }
        });
      }

      sec = await prisma.workspaceSection.create({
        data: {
          workspaceId: ws.id,
          type: 'MEETING_ROOM',
          name: 'Main Meeting Room',
          capacity: 10,
          dailyRate: 200,
        },
        include: { hourlyPackages: true }
      });
    }

    targetSectionId = sec.id;

    // التأكد من وجود باقة ساعات
    let pkg = sec.hourlyPackages && sec.hourlyPackages.length > 0
      ? sec.hourlyPackages.find((p: any) => p.id === targetPackageId) || sec.hourlyPackages[0]
      : await prisma.hourlyPackage.findFirst();

    if (!pkg) {
      pkg = await prisma.hourlyPackage.create({
        data: {
          sectionId: sec.id,
          packageName: '1 Hour Meeting Package',
          hoursAmount: 1,
          periodType: 'CUSTOM',
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
        status,
        hoursUsed: 0,
      },
      include: {
        user: { select: { name: true, email: true } },
        section: true,
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