import { NextResponse } from 'next/server';

export interface MembershipPlanItem {
  id: string;
  planName: string;
  type: 'B2C' | 'B2B';
  totalVisitsAllowed: number;
  price: number;
}

const DEFAULT_MEMBERSHIP_PLANS: MembershipPlanItem[] = [
  {
    id: 'plan_b2c_day',
    planName: 'Day Pass',
    type: 'B2C',
    totalVisitsAllowed: 1,
    price: 120,
  },
  {
    id: 'plan_b2c_monthly',
    planName: 'Monthly Pass',
    type: 'B2C',
    totalVisitsAllowed: 30,
    price: 1500,
  },
  {
    id: 'plan_b2c_annual',
    planName: 'Annual Pass',
    type: 'B2C',
    totalVisitsAllowed: 365,
    price: 15000,
  },
  {
    id: 'plan_b2b_team',
    planName: 'Team Pass',
    type: 'B2B',
    totalVisitsAllowed: 150,
    price: 7500,
  },
  {
    id: 'plan_b2b_business',
    planName: 'Business Pass',
    type: 'B2B',
    totalVisitsAllowed: 500,
    price: 18000,
  },
];

const globalPlans = global as unknown as {
  __cp_plans?: MembershipPlanItem[];
};

if (!globalPlans.__cp_plans) {
  globalPlans.__cp_plans = [...DEFAULT_MEMBERSHIP_PLANS];
}

export async function GET() {
  return NextResponse.json(globalPlans.__cp_plans);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planName, type, totalVisitsAllowed, price } = body;

    if (!planName || !type || totalVisitsAllowed === undefined || price === undefined) {
      return NextResponse.json({ error: 'All fields (planName, type, totalVisitsAllowed, price) are required.' }, { status: 400 });
    }

    const newPlan: MembershipPlanItem = {
      id: `plan_${Date.now()}`,
      planName: planName.trim(),
      type: type === 'B2B' ? 'B2B' : 'B2C',
      totalVisitsAllowed: Number(totalVisitsAllowed),
      price: Number(price),
    };

    globalPlans.__cp_plans!.push(newPlan);

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('[Membership Plans Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
