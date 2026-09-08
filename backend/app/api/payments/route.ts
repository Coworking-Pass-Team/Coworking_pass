import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, unauthorizedResponse } from '@/lib/auth/verify-token';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const paymentFor = searchParams.get('paymentFor');
    const method = searchParams.get('method');

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    } else if (user && user.role !== 'SUPER_ADMIN') {
      whereClause.userId = user.userId;
    }

    if (status) whereClause.status = status;
    if (paymentFor) whereClause.paymentFor = paymentFor;
    if (method) whereClause.method = method;

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المدفوعات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { userId, amount, method, paymentFor, referenceId, status = 'SUCCESS', gatewayTransactionId } = body;

    const effectiveUserId = userId || (user ? user.userId : null);

    if (!effectiveUserId || amount === undefined || !method || !paymentFor) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة: userId (أو token), amount, method, paymentFor' },
        { status: 400 }
      );
    }

    const validMethods = ['MADA', 'VISA', 'APPLE_PAY', 'SAMSUNG_PAY'];
    const normalizedMethod = (method || '').toUpperCase();
    if (!validMethods.includes(normalizedMethod)) {
      return NextResponse.json(
        { error: `method يجب أن يكون أحد القيم: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    const validPaymentFor = ['DIRECT_BOOKING', 'HOURLY_BOOKING', 'SUBSCRIPTION', 'POINTS_REDEMPTION'];
    const normalizedPaymentFor = (paymentFor || '').toUpperCase();
    if (!validPaymentFor.includes(normalizedPaymentFor)) {
      return NextResponse.json(
        { error: `paymentFor يجب أن يكون أحد القيم: ${validPaymentFor.join(', ')}` },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        userId: effectiveUserId,
        amount: Number(amount),
        method: normalizedMethod as any,
        paymentFor: normalizedPaymentFor as any,
        referenceId: referenceId || null,
        status: status === 'FAILED' ? 'FAILED' : 'SUCCESS',
        gatewayTransactionId: gatewayTransactionId || `TX-${Date.now()}`,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating payment:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الدفع' },
      { status: 500 }
    );
  }
}