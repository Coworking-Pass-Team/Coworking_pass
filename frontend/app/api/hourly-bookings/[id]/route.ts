import { NextResponse } from 'next/server';
import { HourlyBookingItem } from '../route';

const globalHourlyBookings = global as unknown as {
  __cp_hourly_bookings?: HourlyBookingItem[];
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const list = globalHourlyBookings.__cp_hourly_bookings || [];
  const booking = list.find(b => b.id === id);

  if (!booking) {
    return NextResponse.json({ error: 'Hourly booking not found' }, { status: 404 });
  }

  return NextResponse.json(booking);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const list = globalHourlyBookings.__cp_hourly_bookings || [];
    const index = list.findIndex(b => b.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Hourly booking not found' }, { status: 404 });
    }

    const existing = list[index];
    const updated: HourlyBookingItem = {
      ...existing,
      ...body,
      id: existing.id,
    };

    list[index] = updated;

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[Hourly Booking PUT Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const list = globalHourlyBookings.__cp_hourly_bookings || [];
    const index = list.findIndex(b => b.id === id);

    if (index !== -1) {
      list.splice(index, 1);
    }

    return NextResponse.json({ message: 'Hourly booking deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[Hourly Booking DELETE Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
