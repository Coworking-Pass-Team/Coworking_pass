import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { POST as refund } from "@/app/api/refund/route";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const user = await getTokenFromRequest(request);
  if (!user) return unauthorizedResponse(request);
  const { id } = await params;
  const subscription = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
  if (!subscription) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  if (user.role !== "SUPER_ADMIN" && subscription.userId !== user.userId) {
    return NextResponse.json({ error: "You can only view your own subscription." }, { status: 403 });
  }
  return NextResponse.json(subscription);
}

/** Purchased price, plan, dates and usage cannot be overwritten by a checkout client. */
export async function PUT(request: NextRequest, { params }: Context) {
  const user = await getTokenFromRequest(request);
  if (!user) return unauthorizedResponse(request);
  const { id } = await params;
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  if (user.role !== "SUPER_ADMIN" && subscription.userId !== user.userId) {
    return NextResponse.json({ error: "You can only manage your own subscription." }, { status: 403 });
  }
  return NextResponse.json({ error: "Purchased subscriptions cannot be edited. Cancel through the refund endpoint or purchase a replacement." }, { status: 405 });
}

/** Reuse the authorized, atomic cancellation path so DELETE cannot create a second refund. */
export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return refund(new NextRequest(new URL("/api/refund", request.url), {
    method: "POST",
    headers: { Authorization: request.headers.get("Authorization") ?? "", "Content-Type": "application/json" },
    body: JSON.stringify({ subscriptionId: id }),
  }));
}
