import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { serializeJsonLd } from '../../frontend/lib/json-ld';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), seed: vi.fn(),
  db: {
    subscription: { findUnique: vi.fn(), update: vi.fn() },
    workspace: { findUnique: vi.fn(), findMany: vi.fn() },
    loyaltyRule: { findMany: vi.fn(), create: vi.fn() },
    user: { create: vi.fn(), findUnique: vi.fn() },
  },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.db }));
vi.mock('@/lib/auth/verify-token', () => ({
  getTokenFromRequest: mocks.auth,
  unauthorizedResponse: () => Response.json({ error: 'Unauthorized' }, { status: 401 }),
}));
vi.mock('@/app/api/refund/route', () => ({ POST: vi.fn() }));
vi.mock('@/lib/db/seed-data', () => ({ seedLoyaltyRules: mocks.seed, seedStandardWorkspaces: mocks.seed }));
vi.mock('@/lib/booking/capacity', () => ({
  getOccupiedSeatsToday: async () => new Map(), effectiveCapacity: () => 10,
}));
import { GET as subscriptionGet, PUT as subscriptionPut } from '@/app/api/subscriptions/[id]/route';
import { GET as workspaceGet } from '@/app/api/workspaces/[id]/route';
import { GET as workspacesGet } from '@/app/api/workspaces/route';
import { GET as loyaltyGet } from '@/app/api/loyalty-rules/route';

const context = () => ({ params: Promise.resolve({ id: 'victim-subscription' }) });
const request = () => new NextRequest('http://test/api/subscriptions/victim-subscription');
const workspace = {
  id: 'space', name: 'Space', city: 'Riyadh', isVisible: true, images: [], amenities: [], sections: [],
  partner: { id: 'partner', brandName: 'Brand', taxId: 'private', taxNumber: 'private',
    crNumber: 'private', contactEmail: 'private@example.com', phone: 'private' },
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: 'attacker', role: 'B2C' });
  mocks.db.subscription.findUnique.mockResolvedValue({ id: 'victim-subscription', userId: 'victim' });
  mocks.db.workspace.findUnique.mockResolvedValue(workspace);
  mocks.db.workspace.findMany.mockResolvedValue([workspace]);
  mocks.db.loyaltyRule.findMany.mockResolvedValue([]);
});

describe('F-07 subscription ownership', () => {
  for (const [method, handler] of [['GET', subscriptionGet], ['PUT', subscriptionPut]] as const) {
    it(`${method} rejects unrelated users before any mutation`, async () => {
      expect((await handler(request(), context())).status).toBe(403);
      expect(mocks.db.subscription.update).not.toHaveBeenCalled();
    });
    it(`${method} requires authentication`, async () => {
      mocks.auth.mockResolvedValue(null);
      expect((await handler(request(), context())).status).toBe(401);
      expect(mocks.db.subscription.findUnique).not.toHaveBeenCalled();
    });
  }
  for (const user of [{ userId: 'victim', role: 'B2C' }, { userId: 'admin', role: 'SUPER_ADMIN' }]) {
    it(`allows authorized reads for ${user.role}`, async () => {
      mocks.auth.mockResolvedValue(user);
      expect((await subscriptionGet(request(), context())).status).toBe(200);
    });
    it(`preserves purchased entitlement immutability for ${user.role}`, async () => {
      mocks.auth.mockResolvedValue(user);
      expect((await subscriptionPut(request(), context())).status).toBe(405);
      expect(mocks.db.subscription.update).not.toHaveBeenCalled();
    });
  }
});

describe('F-08 JSON-LD output encoding', () => {
  for (const payload of ['</script><script>alert(1)</script>', '</ScRiPt><img src=x onerror=alert(1)>', '<!-- <script>', 'مُتَّكَأ & > \u2028\u2029']) {
    it(`keeps stored data literal: ${payload}`, () => {
      const value = { hasPart: [{ name: payload, description: payload }] };
      const encoded = serializeJsonLd(value);
      expect(encoded).not.toMatch(/[<>&\u2028\u2029]/);
      expect(JSON.parse(encoded)).toEqual(value);
    });
  }
});

describe('F-09 public partner confidentiality', () => {
  it('detail returns only public partner fields', async () => {
    mocks.auth.mockResolvedValue(null);
    const response = await workspaceGet(request(), context());
    expect(response.status).toBe(200);
    expect((await response.json()).partner).toEqual({ id: 'partner', brandName: 'Brand' });
  });
  it('list also returns only public partner fields', async () => {
    mocks.auth.mockResolvedValue(null);
    const response = await workspacesGet(request());
    expect(response.status).toBe(200);
    expect((await response.json())[0].partner).toEqual({ id: 'partner', brandName: 'Brand' });
  });
  it('still hides unpublished spaces from anonymous callers', async () => {
    mocks.auth.mockResolvedValue(null);
    mocks.db.workspace.findUnique.mockResolvedValue({ ...workspace, isVisible: false });
    expect((await workspaceGet(request(), context())).status).toBe(404);
  });
});

describe('F-10 public reads have no seed side effects', () => {
  it('empty loyalty data returns an empty list without provisioning', async () => {
    expect(await (await loyaltyGet()).json()).toEqual([]);
    expect(mocks.seed).not.toHaveBeenCalled();
    expect(mocks.db.user.create).not.toHaveBeenCalled();
    expect(mocks.db.loyaltyRule.create).not.toHaveBeenCalled();
  });
  it('loyalty query excludes identity relations and account identifiers', async () => {
    await loyaltyGet();
    const query = mocks.db.loyaltyRule.findMany.mock.calls[0][0];
    expect(query.include).toBeUndefined();
    expect(Object.keys(query.select).sort()).toEqual(['id', 'ruleName', 'ruleType', 'pointsValue', 'monetaryValue', 'description', 'status', 'isActive', 'createdAt'].sort());
  });
  it('empty workspace reads cannot indirectly seed administrators', async () => {
    mocks.db.workspace.findMany.mockResolvedValue([]);
    expect(await (await workspacesGet(request())).json()).toEqual([]);
    expect(mocks.seed).not.toHaveBeenCalled();
    expect(mocks.db.user.create).not.toHaveBeenCalled();
  });
});
