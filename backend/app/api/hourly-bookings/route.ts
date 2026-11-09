import { settleCheckout } from "@/lib/security/checkout";
import { idempotent } from "@/lib/security/idempotency";
import { money, positiveInteger, inputResponse, InputError } from "@/lib/security/input";
import { NextRequest, NextResponse } from 'next/server'
import { resolveAttendeeIds, notifyAttendees } from '@/lib/company/team';
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse, suspendedResponse } from "@/lib/auth/verify-token";
import { getKsaNow, parseDateAndTimeToKsaDate } from '@/lib/time-utils';
import { hourlyBookingEffectiveStatus } from '@/lib/booking/lifecycle';
import { effectiveCapacity, getOccupiedSeats } from '@/lib/booking/capacity';
import { checkFairUse, sessionParticipants } from '@/lib/booking/fair-use';
import { hiddenWorkspaceError } from '@/lib/workspaces/visibility';
import { getOwnedWorkspaceIds } from '@/lib/ownership';
import { validateHourlyWindow, isFixedSlotSection } from '@/lib/workspaces/operating-hours';
import type { Prisma } from "@prisma/client";
import { errorMessage } from '@/lib/errors';


export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    // Scope the listing: super admins see everything, partners their own workspaces (plus their own bookings),
    // HR admins their team's bookings, everyone else only their own
    let where: Prisma.HourlyBookingWhereInput = { OR: [{ userId: user.userId }, { attendeeIds: { has: user.userId } }] };
    if (user.role === 'SUPER_ADMIN') {
      where = {};
    } else if (user.role === 'PARTNER_ADMIN') {
      const owned = await getOwnedWorkspaceIds(user.userId);
      where = { OR: [{ workspaceId: { in: owned } }, { section: { workspaceId: { in: owned } } }, { userId: user.userId }, { attendeeIds: { has: user.userId } }] };
    } else if (user.role === 'HR_ADMIN') {
      const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { companyId: true, hrAdminOf: { select: { id: true } } } });
      const companyId = me?.hrAdminOf?.id ?? me?.companyId;
      where = companyId
        ? { OR: [{ userId: user.userId }, { user: { companyId } }, { attendeeIds: { has: user.userId } }] }
        : { OR: [{ userId: user.userId }, { attendeeIds: { has: user.userId } }] };
    }

    const bookings = await prisma.hourlyBooking.findMany({
      where,
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
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
    // Attach what was actually paid for each booking (successful payments referencing it), so clients
    // show the real amount instead of the package list price
    const ids = bookings.map((b) => b.id);
    const payments = ids.length
      ? await prisma.payment.findMany({
          where: { referenceId: { in: ids }, paymentFor: 'HOURLY_BOOKING', status: 'SUCCESS' },
          select: { referenceId: true, amount: true },
        })
      : [];
    const paidByBooking = new Map<string, number>();
    for (const p of payments) {
      if (p.referenceId) paidByBooking.set(p.referenceId, (paidByBooking.get(p.referenceId) || 0) + p.amount);
    }

    return NextResponse.json(bookings.map((b) => ({ ...b, paidAmount: paidByBooking.get(b.id) ?? null, effectiveStatus: hourlyBookingEffectiveStatus(b) })));
  } catch (error) {
    console.error('❌ Error fetching hourly bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hourly bookings.' },
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
export const POST = idempotent("hourly-bookings", async (request, db) => {
  try {
    const user = await getTokenFromRequest(request);

    const body = await request.json();
    const {
      userId,
      workspaceId,
      sectionId,
      packageId,
      startDate,
      endDate,

      durationHours,
      startTime,
      endTime
    } = body;

    //  BE-05: منع الحجز الساعي للمكاتب الفردية
    if (sectionId) {
      const requestedSection = await db.workspaceSection.findUnique({
        where: { id: sectionId },
        select: { type: true }
      });

      if (requestedSection && requestedSection.type === 'DESK') {
        return NextResponse.json(
          { error: 'Hourly booking is not available for private offices. Please choose a meeting room or a hall.' },
          { status: 400 }
        );
      }
    }

    // تطبيع status
    const normalizedStatus = 'ACTIVE';

    const effectiveUserId = (user && user.role === 'SUPER_ADMIN' && userId) ? userId : (user ? user.userId : null);

    if (!effectiveUserId) {
      return unauthorizedResponse(request);
    }
    const existingUser = await db.user.findUnique({ where: { id: effectiveUserId }, select: { id: true, isBanned: true } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (existingUser.isBanned) {
      return suspendedResponse();
    }

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'Please log in or provide a valid user ID.' },
        { status: 401 }
      );
    }

    // تحديد نوع القسم المطلوب
    const ws = await db.workspace.findUnique({ where: { id: workspaceId || "" }, include: { sections: true } });
    if (!ws) throw new InputError("Select an existing workspace.");

    let computedHours = durationHours ? Number(durationHours) : 0;
    if (computedHours > 4) computedHours = 4;
    if (computedHours < 1) computedHours = 1;

    const startObj = parseDateAndTimeToKsaDate(startDate, startTime, 9);
    let endObj: Date;
    if (endTime) {
      endObj = parseDateAndTimeToKsaDate(endDate || startDate, endTime, 9 + computedHours);
    } else if (endDate && !String(endDate).endsWith('00:00:00.000Z') && endDate !== startDate) {
      endObj = parseDateAndTimeToKsaDate(endDate, null, 9 + computedHours);
    } else {
      endObj = new Date(startObj.getTime() + computedHours * 3600000);
    }

    if (!durationHours) {
      const diffMs = endObj.getTime() - startObj.getTime();
      const diffHrs = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      computedHours = diffHrs > 0 ? Math.min(4, Math.round(diffHrs)) : 1;
    }

    if (computedHours > 4) {
      computedHours = 4;
      endObj = new Date(startObj.getTime() + computedHours * 3600000);
    }
    if (computedHours < 1) {
      computedHours = 1;
    }



    // التحقق من وجود القسم
    let targetSectionId = sectionId;
    let targetPackageId = packageId;

    const sec = targetSectionId ? await db.workspaceSection.findUnique({
      where: { id: targetSectionId },
      include: { hourlyPackages: true, workspace: true }
    }) : null;

    if (!sec || sec.workspaceId !== ws.id) throw new InputError("Section does not belong to the selected workspace.");

    targetSectionId = sec.id;

    // Hidden workspaces cannot be booked by the public
    const hiddenError = await hiddenWorkspaceError(ws.id, user);
    if (hiddenError) {
      return NextResponse.json({ error: hiddenError }, { status: 403 });
    }

    // Reject windows outside the venue's operating hours and, for halls/theaters, anything but a fixed 2-hour session
    const windowError = validateHourlyWindow({ workspace: ws, sectionType: sec.type, start: startObj, end: endObj });
    if (windowError) {
      return NextResponse.json({ error: windowError }, { status: 400 });
    }

    // A session that has already ended cannot be booked (timestamps hold KSA wall-clock time)
    if (normalizedStatus === 'ACTIVE' && endObj.getTime() <= getKsaNow().getTime()) {
      return NextResponse.json({ error: 'This session has already ended. Please choose a later time.' }, { status: 400 });
    }

    // Capacity check for the requested time window
    const requestedSeats = positiveInteger(body.seats, 1, 1000);
    if (isFixedSlotSection(sec.type)) {
      // Halls and theaters are booked one session at a time: the selected unit must be free and seat the group
      if (requestedSeats > sec.capacity) {
        return NextResponse.json(
          { error: `${sec.name} seats at most ${sec.capacity}. Please choose a larger hall or reduce the number of seats.` },
          { status: 400 }
        );
      }
      const clash = await db.hourlyBooking.findFirst({
        where: { sectionId: sec.id, status: 'ACTIVE', startDate: { lt: endObj }, endDate: { gt: startObj } },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json(
          { error: `${sec.name} is already booked for the selected time. Please choose another session or hall.` },
          { status: 409 }
        );
      }
    } else {
      const seatLimit = effectiveCapacity(ws);
      const occupied = (await getOccupiedSeats([ws.id], startObj, endObj)).get(ws.id) || 0;
      if (occupied + requestedSeats > seatLimit) {
        return NextResponse.json(
          { error: `Not enough availability. Only ${Math.max(0, seatLimit - occupied)} seat(s) left for the selected time.` },
          { status: 409 }
        );
      }
    }

    // التأكد من وجود باقة
    const actualHours = (endObj.getTime() - startObj.getTime()) / 3_600_000;
    if (!Number.isFinite(actualHours) || actualHours <= 0 || actualHours > 4) throw new InputError("Invalid booking duration.");
    computedHours = actualHours;
    const computedDetails = `${actualHours} Hours`;
    const pkg = sec.hourlyPackages.find(p => p.id === packageId);
    if (!pkg) throw new InputError("Select an existing package for this section.");
    if (sec.hourlyRate == null && actualHours !== pkg.hoursAmount) throw new InputError("Booking duration must match the package.");
    const payableAmount = money(sec.hourlyRate != null ? money(sec.hourlyRate) * actualHours : pkg.price);
    targetPackageId = pkg.id;

    // Team members this company booking is for (only an HR admin's own team members are kept)
    const attendeeIds = await resolveAttendeeIds(effectiveUserId, body.attendeeIds);

    // Serialize bookings per workspace and re-check availability under the lock, so two simultaneous
    // requests for the same unit / session / last seats can never both succeed (no overbooking).
    const wsId = ws.id;
    const secId = sec.id;
    const secName = sec.name;
    const isFixedSlot = isFixedSlotSection(sec.type);
    const totalCapacity = effectiveCapacity(ws);
    const txResult = await (async (tx: typeof db) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'hourly-slot:' + wsId}))`;

      if (isFixedSlot) {
        const taken = await tx.hourlyBooking.findFirst({
          where: { sectionId: secId, status: 'ACTIVE', startDate: { lt: endObj }, endDate: { gt: startObj } },
          select: { id: true },
        });
        if (taken) {
          return { error: `${secName} is already booked for the selected time. Please choose another session or hall.` };
        }
      } else {
        const occupied = (await getOccupiedSeats([wsId], startObj, endObj)).get(wsId) || 0;
        if (occupied + requestedSeats > totalCapacity) {
          return { error: `Not enough availability. Only ${Math.max(0, totalCapacity - occupied)} seat(s) left for the selected time.` };
        }
      }

      // "Unlimited*" plans: at most five sessions per person per week
      if (normalizedStatus === 'ACTIVE') {
        const fairUse = await checkFairUse(tx, {
          bookerId: effectiveUserId,
          participantIds: sessionParticipants({ userId: effectiveUserId, attendeeIds }),
          start: startObj,
        });
        if (!fairUse.ok) return { error: fairUse.error, code: fairUse.code };
      }

      // إنشاء الحجز
      const created = await tx.hourlyBooking.create({
      data: {
        userId: effectiveUserId,
        workspaceId: ws.id,
        sectionId: targetSectionId,
        packageId: targetPackageId,
        payableAmount,
        startDate: startObj,
        endDate: endObj,
        durationDetails: computedDetails,
        seats: requestedSeats,
        attendeeIds,
        status: 'ACTIVE',
        hoursUsed: computedHours,
        createdAt: getKsaNow(),
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
      await settleCheckout(tx, effectiveUserId, created.id, "HOURLY_BOOKING", payableAmount, ws.id);
      return { booking: created };
    })(db);

    if ('error' in txResult) {
      return NextResponse.json({ error: txResult.error, ...('code' in txResult ? { code: txResult.code } : {}) }, { status: 409 });
    }

    // Tell the guest their session is confirmed (a failure here must never undo the booking)
    await db.notification.create({
      data: {
        userId: txResult.booking.userId,
        type: 'MEETING_BOOKED',
        title: 'Session Booked',
        message: `Your session at ${txResult.booking.workspace?.name || ws.name} (${secName}) has been confirmed.`,
        channel: 'IN_APP',
        isRead: false,
        sentAt: new Date(),
      },
    }).catch((err) => console.error('Hourly booking notification failed:', err));

    const startIso = txResult.booking.startDate.toISOString();
    await notifyAttendees(
      attendeeIds,
      txResult.booking.workspace?.name || ws.name,
      secName,
      `${startIso.slice(0, 10)} ${startIso.slice(11, 16)}-${txResult.booking.endDate.toISOString().slice(11, 16)}`
    );

    return NextResponse.json(txResult.booking, { status: 201 });
  } catch (error) {
    const invalid = inputResponse(error);
    if (invalid) return invalid;
    console.error('❌ Error creating hourly booking:', error);
    return NextResponse.json(
      { error: errorMessage(error, 'Failed to create hourly booking.') },
      { status: 500 }
    );
  }
});
