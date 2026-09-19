import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedStandardWorkspaces } from '@/lib/seed-data';

export async function GET() {
  try {
    // Ensure durationDetails column exists in Neon DB
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "durationDetails" TEXT;'
    ).catch((err: any) => console.warn('Alter table column warning:', err));

    // Ensure workspaceId and durationDetails columns exist in HourlyBooking on Neon DB
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;'
    ).catch((err: any) => console.warn('Alter table HourlyBooking workspaceId warning:', err));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "durationDetails" TEXT;'
    ).catch((err: any) => console.warn('Alter table HourlyBooking durationDetails warning:', err));

    // Drop redundant durationHours column if it exists
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "HourlyBooking" DROP COLUMN IF EXISTS "durationHours";'
    ).catch((err: any) => console.warn('Drop table HourlyBooking durationHours warning:', err));

    // Fix workspace cities for Khobar spaces
    await prisma.workspace.updateMany({
      where: { name: { contains: 'Oasis Coworking', mode: 'insensitive' } },
      data: { city: 'Al Khobar' }
    });
    await prisma.workspace.updateMany({
      where: { name: { contains: 'Al Khobar Multi-Purpose Event Hall', mode: 'insensitive' } },
      data: { city: 'Al Khobar' }
    });

    // Seed / sync all standard spaces into Neon DB (including Madinah Tech Hub)
    await seedStandardWorkspaces();

    // Cap any Daily packages in Neon DB at 4 hours max, and Monthly at 12 hours max
    await prisma.hourlyPackage.updateMany({
      where: {
        periodType: 'PER_DAY',
        hoursAmount: { gt: 4 },
      },
      data: {
        hoursAmount: 4,
        packageName: '4 Hours Full-Day Theater',
      },
    });

    await prisma.hourlyPackage.updateMany({
      where: {
        periodType: 'PER_MONTH',
        hoursAmount: { gt: 12 },
      },
      data: {
        hoursAmount: 12,
      },
    });

    const directBookingsCountBefore = await prisma.directBooking.count();
    const hourlyBookingsCountBefore = await prisma.hourlyBooking.count();
    const paymentsCountBefore = await prisma.payment.count();

    const deletedDirectBookings = await prisma.directBooking.deleteMany({});
    const deletedHourlyBookings = await prisma.hourlyBooking.deleteMany({});
    const deletedPayments = await prisma.payment.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'HourlyBooking, DirectBooking, and Payment tables cleaned and updated successfully.',
      hourlyBookings: {
        deleted: deletedHourlyBookings.count,
        before: hourlyBookingsCountBefore,
        remaining: 0,
      },
      directBookings: {
        deleted: deletedDirectBookings.count,
        before: directBookingsCountBefore,
        remaining: 0,
      },
      payments: {
        deleted: deletedPayments.count,
        before: paymentsCountBefore,
        remaining: 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
