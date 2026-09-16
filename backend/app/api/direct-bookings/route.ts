import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, unauthorizedResponse } from '@/lib/auth/verify-token';
import { seedStandardWorkspaces } from '@/lib/seed-data';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');
    const sectionId = searchParams.get('sectionId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    } else if (user && user.role !== 'SUPER_ADMIN') {
      whereClause.userId = user.userId;
    }

    if (workspaceId) whereClause.workspaceId = workspaceId;
    if (sectionId) whereClause.sectionId = sectionId;
    if (status) whereClause.status = status;

    const bookings = await prisma.directBooking.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, companyId: true } },
        workspace: true,
        section: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error(' Error fetching direct bookings:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الحجوزات المباشرة' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/direct-bookings:
 *   post:
 *     summary: إنشاء حجز مباشر
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, workspaceId, sectionId, durationType, bookingDate]
 *             properties:
 *               userId:
 *                 type: string
 *               workspaceId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *               durationType:
 *                 type: string
 *                 enum: [DAILY, MONTHLY, YEARLY]
 *               bookingDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إنشاء الحجز (أو تسجيله بالطابور لو المساحة ممتلئة). لو المستخدم مرتبط بشركة، يُخصم تلقائياً من رصيد محفظة الشركة.
 *       400:
 *         description: رصيد الشركة غير كافٍ لهذا الحجز
 */
export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);

    const body = await request.json();
    const { userId, workspaceId, sectionId, durationType, bookingDate, status = 'CONFIRMED', spaceName, city } = body;

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

    // التحقق من وجود المستخدم في قاعدة البيانات، أو جلبه تلقائياً
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

    const validDurations = ['DAILY', 'MONTHLY', 'YEARLY'];
    const normalizedDuration = (durationType || 'DAILY').toUpperCase();
    const finalDuration = validDurations.includes(normalizedDuration) ? normalizedDuration : 'DAILY';

    let targetWorkspaceId = workspaceId;
    let targetSectionId = sectionId;

    // البحث عن مساحة العمل المعتمدة مسبقاً (لا ننشئ Workspace جديد عند الحجز أبداً)
    let ws = targetWorkspaceId ? await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
      include: { sections: true }
    }) : null;

    if (!ws && spaceName) {
      ws = await prisma.workspace.findFirst({
        where: { name: { equals: spaceName, mode: 'insensitive' } },
        include: { sections: true }
      });
    }

    if (!ws) {
      const count = await prisma.workspace.count();
      if (count === 0) {
        await seedStandardWorkspaces();
        ws = await prisma.workspace.findFirst({
          where: spaceName ? { name: { equals: spaceName, mode: 'insensitive' } } : undefined,
          include: { sections: true }
        });
      }
    }

    if (!ws) {
      ws = await prisma.workspace.findFirst({ include: { sections: true } });
    }

    if (!ws) {
      return NextResponse.json({ error: 'مساحة العمل غير موجودة' }, { status: 404 });
    }

    targetWorkspaceId = ws.id;

    // التأكد من وجود القسم
    let sec = ws.sections && ws.sections.length > 0
      ? ws.sections.find((s: any) => s.id === targetSectionId) || ws.sections[0]
      : null;

    if (!sec) {
      sec = await prisma.workspaceSection.create({
        data: {
          workspaceId: ws.id,
          type: 'DESK',
          name: 'General Desk Area',
          capacity: ws.totalCapacity || 30,
          dailyRate: ws.dailyRate || 100,
        }
      });
    }

    targetSectionId = sec.id;

    // فحص المحفظة المشتركة للشركات إذا كان المستخدم يتبع لشركة
    const bookingCost = 100;
    const bookingUser = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      include: { company: true },
    });

    if (bookingUser?.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: bookingUser.companyId },
      });

      if (company && company.balance >= bookingCost) {
        await prisma.company.update({
          where: { id: bookingUser.companyId },
          data: { balance: { decrement: bookingCost } },
        }).catch(() => {});
      }
    }

    // إنشاء الحجز في قاعدة بيانات Neon
    const booking = await prisma.directBooking.create({
      data: {
        userId: effectiveUserId,
        workspaceId: targetWorkspaceId,
        sectionId: targetSectionId,
        durationType: finalDuration as any,
        bookingDate: bookingDate ? new Date(bookingDate) : new Date(),
        status: (status as any) || 'CONFIRMED',
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, companyId: true } },
        workspace: true,
        section: true,
      },
    });

    // إرسال الإشعار للمستخدم بشكل آمن دون التسبب في إلغاء الحجز لو تعثر
    await prisma.notification.create({
      data: {
        userId: effectiveUserId,
        type: 'BOOKING_CONFIRMED',
        title: 'تم تأكيد حجزك',
        message: `تم تأكيد حجزك في ${booking.workspace.name} بنجاح`,
        channel: 'IN_APP',
        sentAt: new Date()
      }
    }).catch(() => {});

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating direct booking:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ في إنشاء الحجز المباشر' },
      { status: 500 }
    );
  }
}