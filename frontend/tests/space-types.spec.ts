import { test, expect } from '@playwright/test';
import { ALL_SPACE_TYPES, SPACE_TYPE_VALUES, getEffectiveSpacePrice, getSpaceCategory, normalizeSpaceType } from '../types';
import { evaluateReservationCoverage, PLAN_COVERAGE_RULES } from '../lib/plan-coverage';
import { INITIAL_SPACES } from '../data/demo-data';

/**
 * The platform has three workspace types and one pass rule: meeting rooms and theaters are covered by the pass
 * through a single shared hours quota, private offices are always paid directly. These checks need no browser.
 */
const space = (type: string) => ({
  id: `s-${type}`,
  name: `Test ${type}`,
  city: 'Riyadh',
  type,
  pricing: { hourly: 100, daily: 300, monthly: 1500, yearly: 15000 },
}) as any;

const member = (tier: string, remainingHours?: number, role = 'individual') => ({
  id: 'u1', name: 'Member', email: 'm@test.local', role, hasActivePass: true, membershipTier: tier, remainingHours,
}) as any;

const TIERS = ['Day Pass', 'Monthly Pass', 'Yearly Pass', 'Team Pass', 'Business Pass', 'Enterprise Pass'];

test.describe('Workspace types', () => {
  test('there are exactly three, and they are the ones offered in forms and filters', () => {
    expect([...SPACE_TYPE_VALUES].sort()).toEqual(['meeting-room', 'private-office', 'theater']);
    expect(ALL_SPACE_TYPES.map((t) => t.value).sort()).toEqual(['meeting-room', 'private-office', 'theater']);
  });

  test('legacy values are mapped onto one of the three', () => {
    const cases: Record<string, string> = {
      'hot-desk': 'private-office', 'shared-desk': 'private-office', 'dedicated-desk': 'private-office', mixed: 'private-office', 'private-office': 'private-office', '': 'private-office',
      'meeting-room': 'meeting-room', 'meeting-hall': 'meeting-room', 'training-hall': 'meeting-room', 'conference-hall': 'meeting-room',
      'workshop-hall': 'meeting-room', 'event-hall': 'meeting-room', 'event-space': 'meeting-room', 'lecture-hall': 'meeting-room', 'multipurpose-hall': 'meeting-room',
      theater: 'theater', 'performance-theater': 'theater', 'conference-theater': 'theater', auditorium: 'theater',
    };
    for (const [legacy, expected] of Object.entries(cases)) expect(normalizeSpaceType(legacy), legacy).toBe(expected);
  });

  test('each type belongs to one booking category', () => {
    expect(getSpaceCategory('private-office')).toBe('office');
    expect(getSpaceCategory('meeting-room')).toBe('hall');
    expect(getSpaceCategory('theater')).toBe('theater');
    expect(getSpaceCategory('hot-desk')).toBe('office');
    expect(getSpaceCategory('event-hall')).toBe('hall');
  });

  test('the demo spaces only use the three types', () => {
    for (const s of INITIAL_SPACES) expect(SPACE_TYPE_VALUES, s.name).toContain(s.type);
  });
});

test.describe('Private offices are never covered by a pass', () => {
  for (const tier of TIERS) {
    for (const plan of ['daily', 'monthly', 'yearly'] as const) {
      test(`${tier}, ${plan}: full price, not covered`, () => {
        const user = member(tier, 12, tier.startsWith('Team') || tier.startsWith('Business') || tier.startsWith('Enterprise') ? 'organization' : 'individual');
        const office = space('private-office');
        const expected = plan === 'daily' ? 300 : plan === 'monthly' ? 1500 : 15000;

        const a = getEffectiveSpacePrice(user, office, plan);
        expect(a.isCovered).toBe(false);
        expect(a.effectivePrice).toBe(expected);

        const b = evaluateReservationCoverage(user, office, plan);
        expect(b.isCovered).toBe(false);
        expect(b.effectivePrice).toBe(expected);
      });
    }
  }

  test('a legacy desk type is treated as a private office too', () => {
    const r = getEffectiveSpacePrice(member('Yearly Pass', 12), space('hot-desk'), 'daily');
    expect(r.isCovered).toBe(false);
    expect(r.effectivePrice).toBe(300);
  });
});

test.describe('Meeting rooms and theaters share one hours quota', () => {
  test('both draw on the same remaining balance and the excess is charged at the hourly rate', () => {
    const room = space('meeting-room');
    const theater = space('theater');

    // 3 hours left: a 2h theater booking is fully covered
    const first = getEffectiveSpacePrice(member('Monthly Pass', 3), theater, 'hourly', undefined, 2);
    expect(first.isCovered).toBe(true);
    expect(first.effectivePrice).toBe(0);
    expect(first.coveredHours).toBe(2);

    // the pooled balance is now 1 hour: a 2h meeting room booking is 1h covered + 1h charged
    const second = getEffectiveSpacePrice(member('Monthly Pass', 1), room, 'hourly', undefined, 2);
    expect(second.isCovered).toBe(false);
    expect(second.isPartiallyCovered).toBe(true);
    expect(second.coveredHours).toBe(1);
    expect(second.payableHours).toBe(1);
    expect(second.effectivePrice).toBe(100);

    // nothing left: the same room is charged in full, and so is a theater
    for (const s of [room, theater]) {
      const none = getEffectiveSpacePrice(member('Monthly Pass', 0), s, 'hourly', undefined, 2);
      expect(none.isCovered).toBe(false);
      expect(none.coveredHours).toBe(0);
      expect(none.effectivePrice).toBe(200);
    }
  });

  test('a member without a pass pays the normal hourly price', () => {
    const r = getEffectiveSpacePrice(null, space('theater'), 'hourly', undefined, 3);
    expect(r.isCovered).toBe(false);
    expect(r.effectivePrice).toBe(300);
  });

  test('plans: monthly 8h, yearly 12h; every covered type is a meeting room or theater', () => {
    const quota = (key: string) => PLAN_COVERAGE_RULES.find((r) => r.key === key)!.includedMeetingHoursPerMonth;
    expect(quota('monthly')).toBe(8);
    expect(quota('yearly')).toBe(12);
    for (const rule of PLAN_COVERAGE_RULES) {
      for (const type of rule.includedWorkspaceTypes) expect(['meeting-room', 'theater'], `${rule.key}: ${type}`).toContain(type);
    }
  });

  test('both engines agree on a covered booking', () => {
    for (const type of ['meeting-room', 'theater']) {
      const user = member('Yearly Pass', 12);
      const a = getEffectiveSpacePrice(user, space(type), 'hourly', undefined, 2);
      const b = evaluateReservationCoverage(user, space(type), 'hourly', undefined, 2);
      expect(a.isCovered, type).toBe(true);
      expect(b.isCovered, type).toBe(true);
      expect(a.effectivePrice).toBe(b.effectivePrice);
    }
  });
});
