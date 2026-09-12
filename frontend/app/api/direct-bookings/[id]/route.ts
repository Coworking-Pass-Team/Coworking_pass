import { NextRequest, NextResponse } from 'next/server';
import { FrontendDirectBooking } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = (globalThis.__mockDirectBookings || []).find((b) => b.id === id);

  if (!booking) {
    return NextResponse.json({ error: 'Direct booking not found' }, { status: 404 });
  }

  return NextResponse.json(booking);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const index = (globalThis.__mockDirectBookings || []).findIndex((b) => b.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Direct booking not found' }, { status: 404 });
  }

  const existing = (globalThis.__mockDirectBookings || [])[index];
  const updated: FrontendDirectBooking = {
    ...existing,
    ...body,
    ...(body.durationType ? { durationType: body.durationType.toUpperCase() } : {}),
    ...(body.bookingDate ? { bookingDate: new Date(body.bookingDate).toISOString() } : {}),
  };

  if (globalThis.__mockDirectBookings) {
    globalThis.__mockDirectBookings[index] = updated;
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const index = (globalThis.__mockDirectBookings || []).findIndex((b) => b.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Direct booking not found' }, { status: 404 });
  }

  const existing = (globalThis.__mockDirectBookings || [])[index];
  const updated: FrontendDirectBooking = {
    ...existing,
    status: 'CANCELLED',
  };

  if (globalThis.__mockDirectBookings) {
    globalThis.__mockDirectBookings[index] = updated;
  }

  return NextResponse.json({ message: 'Direct booking cancelled successfully', booking: updated });
}
