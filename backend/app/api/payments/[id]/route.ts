import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, unauthorizedResponse } from '@/lib/auth/verify-token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'الدفعة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('❌ Error fetching payment:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب تفاصيل الدفع' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.status !== undefined) {
      updateData.status = body.status === 'FAILED' ? 'FAILED' : 'SUCCESS';
    }
    if (body.amount !== undefined) {
      updateData.amount = Number(body.amount);
    }
    if (body.method !== undefined) {
      updateData.method = body.method.toUpperCase();
    }
    if (body.paymentFor !== undefined) {
      updateData.paymentFor = body.paymentFor.toUpperCase();
    }
    if (body.referenceId !== undefined) {
      updateData.referenceId = body.referenceId;
    }
    if (body.gatewayTransactionId !== undefined) {
      updateData.gatewayTransactionId = body.gatewayTransactionId;
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('❌ Error updating payment:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحديث الدفعة' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }
    const { id } = await params;

    await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'تم حذف الدفعة بنجاح' });
  } catch (error) {
    console.error('❌ Error deleting payment:', error);
    return NextResponse.json({ error: 'حدث خطأ في حذف الدفعة' }, { status: 500 });
  }
}
