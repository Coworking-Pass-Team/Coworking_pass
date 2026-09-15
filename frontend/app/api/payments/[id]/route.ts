import { NextRequest, NextResponse } from 'next/server';
import { FrontendPayment } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payment = (globalThis.__mockPayments || []).find((p) => p.id === id);

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  return NextResponse.json(payment);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const index = (globalThis.__mockPayments || []).findIndex((p) => p.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  const existing = (globalThis.__mockPayments || [])[index];
  const updated: FrontendPayment = {
    ...existing,
    ...body,
    ...(body.amount !== undefined ? { amount: Number(body.amount) } : {}),
    ...(body.method ? { method: body.method.toUpperCase() } : {}),
    ...(body.paymentFor ? { paymentFor: body.paymentFor.toUpperCase() } : {}),
  };

  if (globalThis.__mockPayments) {
    globalThis.__mockPayments[index] = updated;
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const index = (globalThis.__mockPayments || []).findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  if (globalThis.__mockPayments) {
    globalThis.__mockPayments.splice(index, 1);
  }

  return NextResponse.json({ message: 'Payment deleted successfully' });
}
