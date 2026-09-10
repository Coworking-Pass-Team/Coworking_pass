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
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid JSON body. Required fields: userId, planId, startDate, endDate' },
        { status: 400 }
      );
    }

    const userId = body.userId || body.user_id;
    const planId = body.planId || body.plan_id;
    const startDate = body.startDate || body.start_date;
    const endDate = body.endDate || body.end_date;
    const status = body.status || 'ACTIVE';

    if (!userId || !planId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'All fields (userId, planId, startDate, endDate) are required.' },
        { status: 400 }
      );
    }

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startDate or endDate format. Please use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    if (!globalSubs.__cp_subscriptions || !Array.isArray(globalSubs.__cp_subscriptions)) {
      globalSubs.__cp_subscriptions = [...DEFAULT_SUBSCRIPTIONS];
    }

    const newSub: SubscriptionItem = {
      id: `sub_${Date.now()}`,
      userId: String(userId),
      planId: String(planId),
      startDate: startObj.toISOString(),
      endDate: endObj.toISOString(),
      visitsUsed: 0,
      status: status === 'ACTIVE' || status === 'EXPIRED' || status === 'CANCELLED' ? status : 'ACTIVE',
      user: {
        id: String(userId),
        name: body.userName || 'Member User',
        email: body.userEmail || 'user@example.com',
        role: body.userRole || 'B2C',
      },
      plan: {
        id: String(planId),
        planName: body.planName || 'Monthly Pass',
        type: body.planType || 'B2C',
        totalVisitsAllowed: Number(body.totalVisitsAllowed || 30),
        price: Number(body.price || 1500),
      },
    };

    globalSubs.__cp_subscriptions.unshift(newSub);

    return NextResponse.json(newSub, { status: 201 });
  } catch (error: any) {
    console.error('[Subscriptions POST Error]:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create subscription' }, { status: 400 });
  }
}
