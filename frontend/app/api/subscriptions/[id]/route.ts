import { NextResponse } from 'next/server';
import { SubscriptionItem } from '../route';

const globalSubs = global as unknown as {
  __cp_subscriptions?: SubscriptionItem[];
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const subs = globalSubs.__cp_subscriptions || [];
  const sub = subs.find(s => s.id === id);

  if (!sub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  return NextResponse.json(sub);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const subs = globalSubs.__cp_subscriptions || [];
    const index = subs.findIndex(s => s.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const existing = subs[index];
    const updated: SubscriptionItem = {
      ...existing,
      ...body,
      id: existing.id,
    };

    subs[index] = updated;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Subscription PUT Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subs = globalSubs.__cp_subscriptions || [];
    const index = subs.findIndex(s => s.id === id);

    if (index !== -1) {
      subs.splice(index, 1);
    }

    return NextResponse.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('[Subscription DELETE Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
