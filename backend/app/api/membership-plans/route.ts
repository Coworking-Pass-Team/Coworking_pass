import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

const DEFAULT_PLANS = [
  {
    planName: 'Day Pass',
    type: 'B2C' as const,
    totalVisitsAllowed: 1,
    price: 120,
  },
  {
    planName: 'Monthly Pass',
    type: 'B2C' as const,
    totalVisitsAllowed: 30,
    price: 1500,
  },
  {
    planName: 'Annual Pass',
    type: 'B2C' as const,
    totalVisitsAllowed: 365,
    price: 15000,
  },
  {
    planName: 'Team Pass',
    type: 'B2B' as const,
    totalVisitsAllowed: 150,
    price: 7500,
  },
  {
    planName: 'Business Pass',
    type: 'B2B' as const,
    totalVisitsAllowed: 500,
    price: 18000,
  },
];

export async function GET(request: Request) {
  try {
    let plans = await prisma.membershipPlan.findMany();

    // Auto-seed default plans if table is currently empty
    if (plans.length === 0) {
      for (const p of DEFAULT_PLANS) {
        try {
          await prisma.membershipPlan.create({ data: p });
        } catch {
          // ignore duplicate race condition
        }
      }
      plans = await prisma.membershipPlan.findMany();
    }

    return NextResponse.json(plans);
  } catch (error) {
    console.error('❌ Error fetching plans:', error);
    // Return default plans array if DB is not reachable during local dev
    return NextResponse.json(
      DEFAULT_PLANS.map((p, idx) => ({ id: `plan-${idx + 1}`, ...p }))
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
    const { planName, type, totalVisitsAllowed, price } = body;

    if (!planName || !type || totalVisitsAllowed === undefined || price === undefined) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة: planName, type (B2C | B2B), totalVisitsAllowed, price' },
        { status: 400 }
      );
    }

    const plan = await prisma.membershipPlan.create({
      data: { 
        planName: planName.trim(),        
        type: type === 'B2B' ? 'B2B' : 'B2C', 
        totalVisitsAllowed: Number(totalVisitsAllowed), 
        price: Number(price),
      }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating plan:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الخطة' },
      { status: 500 }
    );
  }
}