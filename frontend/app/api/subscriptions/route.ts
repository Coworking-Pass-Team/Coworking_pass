import { NextResponse } from 'next/server';

export interface SubscriptionItem {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  visitsUsed: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  plan?: {
    id: string;
    planName: string;
    type: 'B2C' | 'B2B';
    totalVisitsAllowed: number;
    price: number;
  };
}

const DEFAULT_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: 'sub_001',
    userId: 'usr_b2c',
    planId: 'plan_b2c_monthly',
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-03-31T23:59:59.000Z',
    visitsUsed: 4,
    status: 'ACTIVE',
    user: {
      id: 'usr_b2c',
      name: 'Sarah Al-Otaibi',
      email: 'sarah@example.com',
      role: 'B2C',
    },
    plan: {
      id: 'plan_b2c_monthly',
      planName: 'Monthly Pass',
      type: 'B2C',
      totalVisitsAllowed: 30,
      price: 1500,
    },
  },
  {
    id: 'sub_002',
    userId: 'usr_org',
    planId: 'plan_b2b_team',
    startDate: '2026-02-15T00:00:00.000Z',
    endDate: '2026-03-15T23:59:59.000Z',
    visitsUsed: 42,
    status: 'ACTIVE',
    user: {
      id: 'usr_org',
      name: 'Mohammad Al-Zahrani',
      email: 'hr@aramco.com',
      role: 'HR_ADMIN',
    },
    plan: {
      id: 'plan_b2b_team',
      planName: 'Team Pass',
      type: 'B2B',
      totalVisitsAllowed: 150,
      price: 7500,
    },
  },
];

const globalSubs = global as unknown as {
  __cp_subscriptions?: SubscriptionItem[];
};

if (!globalSubs.__cp_subscriptions) {
  globalSubs.__cp_subscriptions = [...DEFAULT_SUBSCRIPTIONS];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let list = globalSubs.__cp_subscriptions || [];
    if (userId) {
      list = list.filter(s => s.userId === userId);
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('[Subscriptions GET Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, planId, startDate, endDate, status = 'ACTIVE' } = body;

    if (!userId || !planId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'All fields (userId, planId, startDate, endDate) are required.' },
        { status: 400 }
      );
    }

    const newSub: SubscriptionItem = {
      id: `sub_${Date.now()}`,
      userId,
      planId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      visitsUsed: 0,
      status: status === 'ACTIVE' || status === 'EXPIRED' || status === 'CANCELLED' ? status : 'ACTIVE',
      user: {
        id: userId,
        name: body.userName || 'Member User',
        email: body.userEmail || 'user@example.com',
        role: body.userRole || 'B2C',
      },
      plan: {
        id: planId,
        planName: body.planName || 'Monthly Pass',
        type: body.planType || 'B2C',
        totalVisitsAllowed: Number(body.totalVisitsAllowed || 30),
        price: Number(body.price || 1500),
      },
    };

    globalSubs.__cp_subscriptions!.unshift(newSub);

    return NextResponse.json(newSub, { status: 201 });
  } catch (error) {
    console.error('[Subscriptions POST Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
