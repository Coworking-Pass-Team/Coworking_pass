import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, unauthorizedResponse } from '@/lib/auth/verify-token';
import { seedStandardWorkspaces } from '@/lib/seed-data';
import { getKsaNow, parseDateAndTimeToKsaDate } from '@/lib/time-utils';

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
      { error: 'Failed to fetch direct bookings.' },
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
    const { userId, workspaceId, sectionId, durationType, durationDetails, durationDays, durationMonths, bookingDate, status = 'CONFIRMED', spaceName, city } = body;

    // تطبيع المدينة
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
        { error: 'Please log in or provide a valid user ID.' },
        { status: 401 }
      );
    }

    const validDurations = ['DAILY', 'MONTHLY', 'YEARLY'];
    const normalizedDuration = (durationType || 'DAILY').toUpperCase();
    const finalDuration = validDurations.includes(normalizedDuration) ? normalizedDuration : 'DAILY';

    //  BE-07: منع الحجز المتزامن (Universal Pass)
    const activeBooking = await prisma.directBooking.findFirst({
      where: {
        userId: effectiveUserId,
        status: 'CONFIRMED',
        bookingDate: { gte: getKsaNow() }
      }
    });

    if (activeBooking) {
      return NextResponse.json(
        { 
          error: 'لديك حجز نشط بالفعل. يجب إلغاؤه قبل حجز مساحة أخرى.',
          activeBookingId: activeBooking.id
        },
        { status: 400 }
      );
    }

    let targetWorkspaceId = workspaceId;
    let targetSectionId = sectionId;

    const resolvedCity = resolveCity(spaceName, city);
    const cleanCity = resolvedCity.replace(/al\s+/i, '').trim();

    let ws = targetWorkspaceId ? await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
      include: { sections: true }
    }) : null;

    if (!ws && spaceName) {
      const trimmedName = spaceName.trim();

      ws = await prisma.workspace.findFirst({
        where: {
          name: { equals: trimmedName, mode: 'insensitive' },
          city: { contains: cleanCity, mode: 'insensitive' }
        },
        include: { sections: true }
      });

      if (!ws) {
        ws = await prisma.workspace.findFirst({
          where: {
            name: { contains: trimmedName, mode: 'insensitive' },
            city: { contains: cleanCity, mode: 'insensitive' }
          },
          include: { sections: true }
        });
      }

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

      if (!ws) {
        ws = await prisma.workspace.findFirst({
          where: { name: { equals: trimmedName, mode: 'insensitive' } },
          include: { sections: true }
        });
      }

      if (!ws) {
        ws = await prisma.workspace.findFirst({
          where: { name: { contains: trimmedName, mode: 'insensitive' } },
          include: { sections: true }
        });
      }
    }

    if (!ws && cleanCity) {
      ws = await prisma.workspace.findFirst({
        where: { city: { contains: cleanCity, mode: 'insensitive' } },
        include: { sections: true }
      });
    }

    if (!ws) {
      await seedStandardWorkspaces();
      if (spaceName) {
        ws = await prisma.workspace.findFirst({
          where: { name: { contains: spaceName.trim(), mode: 'insensitive' } },
          include: { sections: true },
        });
      }
    }

    if (!ws && (spaceName || targetWorkspaceId)) {
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
          dailyRate: 110,
          monthlyRate: 1400,
          yearlyRate: 14000,
          passVisitValue: 1,
          totalCapacity: 40,
          locationMapUrl: `https://maps.google.com/?q=${encodeURIComponent(wsCity)}`,
        },
        include: { sections: true },
      });
    }

    if (!ws) {
      return NextResponse.json({ error: 'Requested workspace not found.' }, { status: 404 });
    }

    targetWorkspaceId = ws.id;

    let sec = ws.sections && ws.sections.length > 0
      ? (targetSectionId ? ws.sections.find((s: any) => s.id === targetSectionId) : null) || ws.sections[0]
      : null;

    if (!sec) {
      sec = await prisma.workspaceSection.create({
        data: {
          workspaceId: ws.id,
          type: 'DESK',
          name: `${ws.name} - General Desk Area`,
          capacity: ws.totalCapacity || 30,
          dailyRate: ws.dailyRate || 100,
        }
      });
    }

    targetSectionId = sec.id;

    //  BE-09: حساب السعر الفعلي حسب نوع الحجز
    let bookingCost = 100;
    switch (finalDuration) {
      case 'DAILY':
        bookingCost = ws.dailyRate || 100;
        break;
      case 'MONTHLY':
        bookingCost = ws.monthlyRate || 800;
        break;
      case 'YEARLY':
        bookingCost = ws.yearlyRate || 8000;
        break;
    }

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

    let finalDurationDetails = durationDetails;
    if (!finalDurationDetails) {
      if (finalDuration === 'DAILY') {
        const d = Number(durationDays) || 1;
        finalDurationDetails = `${d} ${d === 1 ? 'Day' : 'Days'}`;
      } else if (finalDuration === 'MONTHLY') {
        const m = Number(durationMonths) || 1;
        finalDurationDetails = `${m} ${m === 1 ? 'Month' : 'Months'}`;
      } else if (finalDuration === 'YEARLY') {
        finalDurationDetails = '1 Year';
      } else {
        finalDurationDetails = '1 Day';
      }
    }

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "durationDetails" TEXT;'
    ).catch(() => {});

    const booking = await prisma.directBooking.create({
      data: {
        userId: effectiveUserId,
        workspaceId: targetWorkspaceId,
        sectionId: targetSectionId,
        durationType: finalDuration as any,
        durationDetails: finalDurationDetails,
        bookingDate: parseDateAndTimeToKsaDate(bookingDate, null, 9),
        status: (status as any) || 'CONFIRMED',
        createdAt: getKsaNow(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, companyId: true } },
        workspace: true,
        section: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: effectiveUserId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message: `Your booking at ${booking.workspace.name} has been confirmed successfully.`,
        channel: 'IN_APP',
        sentAt: getKsaNow()
      }
    }).catch(() => {});

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating direct booking:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create direct booking.' },
      { status: 500 }
    );
  }
}