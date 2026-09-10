import { NextResponse } from 'next/server';
import { MembershipPlanItem } from '../route';

const globalPlans = global as unknown as {
  __cp_plans?: MembershipPlanItem[];
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const plans = globalPlans.__cp_plans || [];
  const plan = plans.find(p => p.id === id);

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  return NextResponse.json(plan);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const plans = globalPlans.__cp_plans || [];
    const index = plans.findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const existing = plans[index];
    const updated: MembershipPlanItem = {
      ...existing,
      planName: body.planName !== undefined ? body.planName.trim() : existing.planName,
      type: body.type !== undefined ? (body.type === 'B2B' ? 'B2B' : 'B2C') : existing.type,
      totalVisitsAllowed: body.totalVisitsAllowed !== undefined ? Number(body.totalVisitsAllowed) : existing.totalVisitsAllowed,
      price: body.price !== undefined ? Number(body.price) : existing.price,
    };

    plans[index] = updated;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Membership Plan PUT Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plans = globalPlans.__cp_plans || [];
    const index = plans.findIndex(p => p.id === id);

    if (index !== -1) {
      plans.splice(index, 1);
    }

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('[Membership Plan DELETE Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
