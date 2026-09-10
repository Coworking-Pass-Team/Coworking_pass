import { NextRequest, NextResponse } from 'next/server';

export interface FrontendPayment {
  id: string;
  userId: string;
  amount: number;
  method: 'MADA' | 'VISA' | 'APPLE_PAY' | 'SAMSUNG_PAY';
  gatewayTransactionId?: string;
  paymentFor: 'DIRECT_BOOKING' | 'HOURLY_BOOKING' | 'SUBSCRIPTION' | 'POINTS_REDEMPTION';
  referenceId?: string;
  status: 'SUCCESS' | 'FAILED';
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __mockPayments: FrontendPayment[] | undefined;
}

if (!globalThis.__mockPayments) {
  globalThis.__mockPayments = [
    {
      id: 'pay-001',
      userId: 'usr-1',
      amount: 450,
      method: 'APPLE_PAY',
      gatewayTransactionId: 'TX-178891001',
      paymentFor: 'SUBSCRIPTION',
      referenceId: 'sub-001',
      status: 'SUCCESS',
      user: {
        id: 'usr-1',
        name: 'Sara Al-Ahmad',
        email: 'sara@example.com',
        role: 'B2C',
      },
    },
    {
      id: 'pay-002',
      userId: 'usr-2',
      amount: 3500,
      method: 'MADA',
      gatewayTransactionId: 'TX-178891002',
      paymentFor: 'DIRECT_BOOKING',
      referenceId: 'db-002',
      status: 'SUCCESS',
      user: {
        id: 'usr-2',
        name: 'Acme Corp Admin',
        email: 'hr@acme.sa',
        role: 'HR_ADMIN',
      },
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const paymentFor = searchParams.get('paymentFor');
    const method = searchParams.get('method');

    let list = [...(globalThis.__mockPayments || [])];

    if (userId) list = list.filter((p) => p.userId === userId);
    if (status) list = list.filter((p) => p.status === status);
    if (paymentFor) list = list.filter((p) => p.paymentFor === paymentFor);
    if (method) list = list.filter((p) => p.method === method);

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error in payments fallback route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, method, paymentFor, referenceId, status = 'SUCCESS' } = body;

    if (!userId || amount === undefined || !method || !paymentFor) {
      return NextResponse.json(
        { error: 'All fields are required: userId, amount, method, paymentFor' },
        { status: 400 }
      );
    }

    const newPayment: FrontendPayment = {
      id: `pay-${Date.now()}`,
      userId,
      amount: Number(amount),
      method: method.toUpperCase(),
      gatewayTransactionId: `TX-${Date.now()}`,
      paymentFor: paymentFor.toUpperCase(),
      referenceId: referenceId || undefined,
      status: status || 'SUCCESS',
      user: {
        id: userId,
        name: 'Member User',
        email: 'user@example.com',
        role: 'B2C',
      },
    };

    globalThis.__mockPayments = [newPayment, ...(globalThis.__mockPayments || [])];

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment fallback:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
