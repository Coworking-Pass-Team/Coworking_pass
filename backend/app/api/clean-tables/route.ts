import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedStandardWorkspaces } from '@/lib/seed-data';

export async function GET() {
  try {
    // Ensure durationDetails column exists in Neon DB
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "durationDetails" TEXT;'
    ).catch((err: any) => console.warn('Alter table column warning:', err));

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

    const directBookingsCountBefore = await prisma.directBooking.count();
    const paymentsCountBefore = await prisma.payment.count();

    const deletedDirectBookings = await prisma.directBooking.deleteMany({});
    const deletedPayments = await prisma.payment.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'DirectBooking and Payment tables cleaned successfully.',
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
