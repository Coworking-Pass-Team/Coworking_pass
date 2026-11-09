import { financialBody, money, inputResponse } from "@/lib/security/input";
import { NextRequest, NextResponse } from 'next/server';
import { canManageWorkspace } from '@/lib/ownership';
import { requireRoles } from '@/lib/ownership';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, unauthorizedResponse } from '@/lib/auth/verify-token';
import type { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return unauthorizedResponse(request);
    }
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }

    const mayView =
      payment.userId === user.userId ||
      user.role === 'SUPER_ADMIN' ||
      (payment.workspaceId ? await canManageWorkspace(user, payment.workspaceId) : false);
    if (!mayView) {
      return NextResponse.json({ error: 'You are not allowed to view this payment.' }, { status: 403 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    const invalid = inputResponse(error);
    if (invalid) return invalid;
    console.error('❌ Error fetching payment:', error);
    return NextResponse.json({ error: 'Failed to fetch payment details.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return unauthorizedResponse(request);
    }
    const roleDenied = requireRoles(user, ['SUPER_ADMIN']);
    if (roleDenied) return roleDenied;

    const { id } = await params;
    const body = await financialBody(request);

    const updateData: Prisma.PaymentUncheckedUpdateInput = {};
    if (body.status !== undefined) {
      updateData.status = body.status === 'FAILED' ? 'FAILED' : 'SUCCESS';
    }
    if (body.amount !== undefined) {
      updateData.amount = money(body.amount);
    }
    if (body.method !== undefined) {
      updateData.method = String(body.method).toUpperCase() as Prisma.PaymentUncheckedUpdateInput["method"];
    }
    if (body.paymentFor !== undefined) {
      updateData.paymentFor = String(body.paymentFor).toUpperCase() as Prisma.PaymentUncheckedUpdateInput["paymentFor"];
    }
    if (body.referenceId !== undefined) {
      updateData.referenceId = String(body.referenceId);
    }
    if (body.gatewayTransactionId !== undefined) {
      updateData.gatewayTransactionId = String(body.gatewayTransactionId);
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
    const invalid = inputResponse(error);
    if (invalid) return invalid;
    console.error('❌ Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return unauthorizedResponse(request);
    }
    const roleDenied = requireRoles(user, ['SUPER_ADMIN']);
    if (roleDenied) return roleDenied;

    const { id } = await params;

    await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Payment deleted successfully.' });
  } catch (error) {
    const invalid = inputResponse(error);
    if (invalid) return invalid;
    console.error('❌ Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment.' }, { status: 500 });
  }
}
