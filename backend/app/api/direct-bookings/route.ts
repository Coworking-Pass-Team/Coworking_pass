import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, unauthorizedResponse, suspendedResponse } from '@/lib/auth/verify-token';
import { seedStandardWorkspaces } from '@/lib/seed-data';
import { getOwnedWorkspaceIds } from '@/lib/ownership';
import { directBookingEnd, getOccupiedSeats, getOccupiedSeatsForSection } from '@/lib/capacity';
import { hiddenWorkspaceError } from '@/lib/workspace-visibility';
import { getKsaNow, parseDateAndTimeToKsaDate } from '@/lib/time-utils';

export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return unauthorizedResponse(request);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');
    const sectionId = searchParams.get('sectionId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (user.role === 'SUPER_ADMIN') {
      if (userId) whereClause.userId = userId;
    } else if (user.role === 'PARTNER_ADMIN') {
      // A partner sees bookings made at their own workspaces, plus any they made themselves as a customer
      const owned = await getOwnedWorkspaceIds(user.userId);
      whereClause.AND = [{ OR: [{ workspaceId: { in: owned } }, { userId: user.userId }] }];
      if (userId) whereClause.AND.push({ userId });
    } else {
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
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

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

    // Bookings always belong to the authenticated caller; only super admins may book on behalf of others
    const effectiveUserId: string = user.role === 'SUPER_ADMIN' && userId ? userId : user.userId;

    const bookingOwner = await prisma.user.findUnique({ where: { id: effectiveUserId }, select: { id: true, isBanned: true } });
    if (!bookingOwner) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (bookingOwner.isBanned) {
      return suspendedResponse();
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

    // The corporate wallet is charged only through POST /api/companies/[id]/withdraw (idempotent, ledgered).
    // Deducting here as well would charge the company twice for a single booking.

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

    // Hidden workspaces cannot be booked by the public
    const hiddenError = await hiddenWorkspaceError(targetWorkspaceId, user);
    if (hiddenError) {
      return NextResponse.json({ error: hiddenError }, { status: 403 });
    }

    // Capacity check: reject requests that would exceed the venue's total seats for the booked period
    const requestedSeats = Math.max(1, Math.floor(Number(body.seats) || 1));
    const bookingStart = parseDateAndTimeToKsaDate(bookingDate, null, 9);
    const workspaceForCapacity = await prisma.workspace.findUnique({ where: { id: targetWorkspaceId }, select: { totalCapacity: true } });
    if (ws.sections.length > 1 && sec.capacity > 0) {
      // A hub with several rooms: each room seats only its own capacity
      const roomEnd = directBookingEnd({ bookingDate: bookingStart, durationType: finalDuration, durationDetails: finalDurationDetails });
      const roomOccupied = await getOccupiedSeatsForSection(sec.id, bookingStart, roomEnd);
      if (roomOccupied + requestedSeats > sec.capacity) {
        return NextResponse.json(
          { error: `${sec.name} has only ${Math.max(0, sec.capacity - roomOccupied)} seat(s) left for the selected period.` },
          { status: 409 }
        );
      }
    } else if (workspaceForCapacity && workspaceForCapacity.totalCapacity > 0) {
      const bookingEnd = directBookingEnd({ bookingDate: bookingStart, durationType: finalDuration, durationDetails: finalDurationDetails });
      const occupied = (await getOccupiedSeats([targetWorkspaceId], bookingStart, bookingEnd)).get(targetWorkspaceId) || 0;
      if (occupied + requestedSeats > workspaceForCapacity.totalCapacity) {
        return NextResponse.json(
          { error: `Not enough availability. Only ${Math.max(0, workspaceForCapacity.totalCapacity - occupied)} seat(s) left for the selected period.` },
          { status: 409 }
        );
      }
    }

    const booking = await prisma.directBooking.create({
      data: {
        userId: effectiveUserId,
        seats: requestedSeats,
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