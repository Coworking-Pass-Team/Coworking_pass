import { User, Space, BookingPlan, SpaceType, BookingType, SpaceCategory, getSpaceCategory, normalizeSpaceType } from '@/types/types';

export interface PlanCoverageRule {
  key: string;
  names: string[];
  audience: 'B2C' | 'B2B' | 'ALL';
  allowedBookingPlans: BookingPlan[];
  /** Space types the pass can cover. Private offices are never listed: they are always paid directly. */
  includedWorkspaceTypes: SpaceType[];
  /** One pooled monthly quota, spent on meeting rooms and theaters alike */
  includedMeetingHoursPerMonth: number;
  maxSeatsCoveredPerBooking: number;
  description: string;
}

export const PLAN_COVERAGE_RULES: PlanCoverageRule[] = [
  {
    key: 'day',
    names: ['day pass', 'daily pass', 'basic pass', 'day'],
    audience: 'B2C',
    allowedBookingPlans: ['daily'],
    includedWorkspaceTypes: [],
    includedMeetingHoursPerMonth: 0,
    maxSeatsCoveredPerBooking: 1,
    description: 'Day access. Meeting rooms, theaters and private offices are paid directly.',
  },
  {
    key: 'monthly',
    names: ['monthly pass', 'pro pass', 'all-access pass', 'all-access', 'monthly'],
    audience: 'B2C',
    allowedBookingPlans: ['daily', 'monthly'],
    includedWorkspaceTypes: ['meeting-room', 'theater'],
    includedMeetingHoursPerMonth: 8,
    maxSeatsCoveredPerBooking: 1,
    description: 'Up to 8 hours a month, shared between meeting rooms and theaters. Extra hours are charged at the space rate. Private offices are paid directly.',
  },
  {
    key: 'yearly',
    names: ['yearly pass', 'annual pass', 'yearly', 'annual', 'executive pass'],
    audience: 'B2C',
    allowedBookingPlans: ['daily', 'monthly', 'yearly'],
    includedWorkspaceTypes: ['meeting-room', 'theater'],
    includedMeetingHoursPerMonth: 12,
    maxSeatsCoveredPerBooking: 1,
    description: 'Up to 12 hours a month (renews monthly), shared between meeting rooms and theaters. Extra hours are charged at the space rate. Private offices are paid directly.',
  },
  {
    key: 'team',
    names: ['team pass', 'corporate pass', 'corporate plan', 'team'],
    audience: 'B2B',
    allowedBookingPlans: ['daily', 'monthly'],
    includedWorkspaceTypes: ['meeting-room', 'theater'],
    includedMeetingHoursPerMonth: 10,
    maxSeatsCoveredPerBooking: 20,
    description: 'Up to 10 hours a month for the team, shared between meeting rooms and theaters (up to 20 members). Private offices are paid directly.',
  },
  {
    key: 'business',
    names: ['business pass', 'business'],
    audience: 'B2B',
    allowedBookingPlans: ['daily', 'monthly', 'yearly'],
    includedWorkspaceTypes: ['meeting-room', 'theater'],
    includedMeetingHoursPerMonth: 9999,
    maxSeatsCoveredPerBooking: 50,
    description: 'Unlimited meeting room and theater hours (up to 50 seats). Private offices are paid directly.',
  },
  {
    key: 'enterprise',
    names: ['enterprise pass', 'custom enterprise', 'enterprise'],
    audience: 'B2B',
    allowedBookingPlans: ['daily', 'monthly', 'yearly', 'hourly'],
    includedWorkspaceTypes: ['meeting-room', 'theater'],
    includedMeetingHoursPerMonth: 9999,
    maxSeatsCoveredPerBooking: 9999,
    description: 'Unlimited meeting room and theater hours across the network. Private offices are paid directly.',
  },
];

export interface ReservationCoverageResult {
  isCovered: boolean;
  isPartiallyCovered: boolean;
  effectivePrice: number; // Amount actually payable (0 if fully covered)
  originalPrice: number; // Standard price for this reservation
  displayPriceLabel: string; // "Included in your Plan", "Included in Pass", or "SAR [X]"
  totalPayableLabel: string; // "SAR 0 to Pay", or "SAR [X] to Pay"
  hasDiscount: boolean;
  discountPercentage?: number;
  coveredSeats: number;
  payableSeats: number;
  coveredHours: number;
  payableHours: number;
  coverageNote?: string;
  matchedRule?: PlanCoverageRule;
}

/**
 * Finds the matching PlanCoverageRule for a user's active subscription tier.
 */
export function findMatchingPlanRule(tierName?: string, userRole?: string): PlanCoverageRule | null {
  if (!tierName) {
    const isOrg = userRole === 'organization' || userRole === 'HR_ADMIN';
    return isOrg
      ? PLAN_COVERAGE_RULES.find(r => r.key === 'team') || null
      : PLAN_COVERAGE_RULES.find(r => r.key === 'monthly') || null;
  }

  const clean = tierName.toLowerCase().trim().replace(/[-_]/g, ' ');
  for (const rule of PLAN_COVERAGE_RULES) {
    for (const n of rule.names) {
      if (clean === n || clean.includes(n) || n.includes(clean)) {
        return rule;
      }
    }
  }

  // Fallback based on role
  const isOrg = userRole === 'organization' || userRole === 'HR_ADMIN';
  return isOrg
    ? PLAN_COVERAGE_RULES.find(r => r.key === 'team') || null
    : PLAN_COVERAGE_RULES.find(r => r.key === 'monthly') || null;
}

/**
 * Core engine to evaluate reservation coverage against active subscription.
 */
export function evaluateReservationCoverage(
  user: User | null,
  space: Space,
  planType: BookingPlan = 'daily',
  deskType?: BookingType | SpaceType,
  durationHours: number = 1,
  durationMonths: number = 1,
  seats: number = 1,
  durationDays: number = 1
): ReservationCoverageResult {
  const effectiveSeats = Math.max(1, seats);
  const targetCategory: SpaceCategory = getSpaceCategory(space);
  const targetType = normalizeSpaceType(String(deskType || space?.type || 'private-office'));

  // 1. Calculate standard un-discounted price for 1 seat
  let singleOriginalPrice = 150;
  if (planType === 'hourly') {
    singleOriginalPrice = (space.pricing?.hourly || 150) * Math.max(1, durationHours);
  } else if (planType === 'monthly') {
    singleOriginalPrice = (space.pricing?.monthly || 1800) * Math.max(1, durationMonths);
  } else if (planType === 'yearly') {
    singleOriginalPrice = space.pricing?.yearly ?? ((space.pricing?.monthly ?? 1800) * 10);
  } else {
    singleOriginalPrice = (space.pricing?.daily ?? 150) * Math.max(1, durationDays);
  }

  const fullOriginalTotal = singleOriginalPrice * effectiveSeats;

  // 2. Unsubscribed user -> full price as normal
  if (!user || !user.hasActivePass) {
    return {
      isCovered: false,
      isPartiallyCovered: false,
      effectivePrice: fullOriginalTotal,
      originalPrice: fullOriginalTotal,
      displayPriceLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
      totalPayableLabel: `SAR ${fullOriginalTotal.toLocaleString()}`,
      hasDiscount: false,
      coveredSeats: 0,
      payableSeats: effectiveSeats,
      coveredHours: 0,
      payableHours: durationHours,
    };
  }

  // Private offices are always paid directly: no pass covers them, whatever the plan
  if (targetCategory === 'office') {
    return {
      isCovered: false,
      isPartiallyCovered: false,
      effectivePrice: fullOriginalTotal,
      originalPrice: fullOriginalTotal,
      displayPriceLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
      totalPayableLabel: `SAR ${fullOriginalTotal.toLocaleString()}`,
      hasDiscount: false,
      coveredSeats: 0,
      payableSeats: effectiveSeats,
      coveredHours: 0,
      payableHours: durationHours,
      coverageNote: 'Private offices are paid directly and are not included in the pass',
    };
  }

  // 3. User has active subscription: evaluate against plan rules
  const rule = findMatchingPlanRule(user.membershipTier, user.role);
  if (!rule) {
    return {
      isCovered: false,
      isPartiallyCovered: false,
      effectivePrice: fullOriginalTotal,
      originalPrice: fullOriginalTotal,
      displayPriceLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
      totalPayableLabel: `SAR ${fullOriginalTotal.toLocaleString()}`,
      hasDiscount: false,
      coveredSeats: 0,
      payableSeats: effectiveSeats,
      coveredHours: 0,
      payableHours: durationHours,
    };
  }

  // 4. Meeting rooms and theaters share one hours quota; they are covered when the plan includes hours
  const isTypeIncluded = rule.includedWorkspaceTypes.includes(targetType);
  const isMeetingOrTheater = targetCategory === 'hall' || targetCategory === 'theater';
  const hasIncludedMeetingHours = isMeetingOrTheater && planType === 'hourly' && rule.includedMeetingHoursPerMonth > 0;

  if (!isTypeIncluded && !hasIncludedMeetingHours) {
    // Not covered by this plan
    return {
      isCovered: false,
      isPartiallyCovered: false,
      effectivePrice: fullOriginalTotal,
      originalPrice: fullOriginalTotal,
      displayPriceLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
      totalPayableLabel: `SAR ${fullOriginalTotal.toLocaleString()}`,
      hasDiscount: false,
      coveredSeats: 0,
      payableSeats: effectiveSeats,
      coveredHours: 0,
      payableHours: durationHours,
      coverageNote: `Not included in ${rule.names[0]}`,
      matchedRule: rule,
    };
  }

  // 5. Check duration plan allowance
  const isPlanAllowed = rule.allowedBookingPlans.includes(planType) || rule.allowedBookingPlans.includes('*' as any) || hasIncludedMeetingHours;

  // Hourly Meeting Room / Theater partial/full coverage handling
  if (isMeetingOrTheater && planType === 'hourly') {
    const userRemainingHours = typeof user.remainingHours === 'number'
      ? Math.max(0, user.remainingHours)
      : rule.includedMeetingHoursPerMonth;

    if (userRemainingHours > 0) {
      const coveredHours = Math.min(durationHours, userRemainingHours);
      const payableHours = Math.max(0, durationHours - coveredHours);
      const hourlyRate = space.pricing?.hourly || 150;
      const payablePrice = payableHours * hourlyRate * effectiveSeats;

      if (payableHours === 0) {
        return {
          isCovered: true,
          isPartiallyCovered: false,
          effectivePrice: 0,
          originalPrice: fullOriginalTotal,
          displayPriceLabel: 'Included in your Plan',
          totalPayableLabel: 'SAR 0 to Pay',
          hasDiscount: true,
          discountPercentage: 100,
          coveredSeats: effectiveSeats,
          payableSeats: 0,
          coveredHours,
          payableHours: 0,
          coverageNote: `Covered by ${rule.names[0]} quota (${userRemainingHours}h available)`,
          matchedRule: rule,
        };
      } else {
        return {
          isCovered: false,
          isPartiallyCovered: true,
          effectivePrice: payablePrice,
          originalPrice: fullOriginalTotal,
          displayPriceLabel: `${coveredHours}h Free · SAR ${payablePrice.toLocaleString()}`,
          totalPayableLabel: `SAR ${payablePrice.toLocaleString()} to Pay`,
          hasDiscount: true,
          discountPercentage: Math.round(((fullOriginalTotal - payablePrice) / fullOriginalTotal) * 100),
          coveredSeats: effectiveSeats,
          payableSeats: 0,
          coveredHours,
          payableHours,
          coverageNote: `${coveredHours}h covered by pass, ${payableHours}h at SAR ${hourlyRate}/hr`,
          matchedRule: rule,
        };
      }
    } else {
      // Remaining hours quota exhausted
      const hourlyRate = space.pricing?.hourly || 150;
      const payablePrice = durationHours * hourlyRate * effectiveSeats;
      return {
        isCovered: false,
        isPartiallyCovered: false,
        effectivePrice: payablePrice,
        originalPrice: fullOriginalTotal,
        displayPriceLabel: `SAR ${payablePrice.toLocaleString()}`,
        totalPayableLabel: `SAR ${payablePrice.toLocaleString()} to Pay`,
        hasDiscount: false,
        coveredSeats: 0,
        payableSeats: effectiveSeats,
        coveredHours: 0,
        payableHours: durationHours,
        coverageNote: `Monthly plan hours exhausted (0h remaining). Charged at regular rate.`,
        matchedRule: rule,
      };
    }
  }

  // If plan type itself is not allowed for desks (e.g. booking hourly hot-desk with daily-only Day Pass)
  if (!isPlanAllowed) {
    return {
      isCovered: false,
      isPartiallyCovered: false,
      effectivePrice: fullOriginalTotal,
      originalPrice: fullOriginalTotal,
      displayPriceLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
      totalPayableLabel: `SAR ${fullOriginalTotal.toLocaleString()}`,
      hasDiscount: false,
      coveredSeats: 0,
      payableSeats: effectiveSeats,
      coveredHours: 0,
      payableHours: durationHours,
      coverageNote: `Requires ${planType} booking plan`,
      matchedRule: rule,
    };
  }

  // 6. Evaluate Seat-level Coverage (Full vs Partial)
  const coveredSeats = Math.min(effectiveSeats, rule.maxSeatsCoveredPerBooking);
  const payableSeats = Math.max(0, effectiveSeats - coveredSeats);
  const effectivePrice = payableSeats * singleOriginalPrice;

  if (payableSeats === 0) {
    // 100% Fully Covered
    return {
      isCovered: true,
      isPartiallyCovered: false,
      effectivePrice: 0,
      originalPrice: fullOriginalTotal,
      displayPriceLabel: 'Included in your Plan',
      totalPayableLabel: 'SAR 0 to Pay',
      hasDiscount: true,
      discountPercentage: 100,
      coveredSeats,
      payableSeats: 0,
      coveredHours: durationHours,
      payableHours: 0,
      coverageNote: `100% Covered by ${rule.names[0]}`,
      matchedRule: rule,
    };
  }

  // Partially Covered (e.g. 1 seat covered, 2 extra seats payable)
  const discountPct = Math.round(((fullOriginalTotal - effectivePrice) / fullOriginalTotal) * 100);
  return {
    isCovered: false,
    isPartiallyCovered: true,
    effectivePrice,
    originalPrice: fullOriginalTotal,
    displayPriceLabel: `${coveredSeats} Seat${coveredSeats > 1 ? 's' : ''} Included in Plan · SAR ${effectivePrice.toLocaleString()}`,
    totalPayableLabel: `SAR ${effectivePrice.toLocaleString()}`,
    hasDiscount: true,
    discountPercentage: discountPct,
    coveredSeats,
    payableSeats,
    coveredHours: durationHours,
    payableHours: 0,
    coverageNote: `${coveredSeats} seat included in pass, ${payableSeats} additional seat${payableSeats > 1 ? 's' : ''} payable`,
    matchedRule: rule,
  };
}
