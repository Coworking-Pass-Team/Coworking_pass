import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
