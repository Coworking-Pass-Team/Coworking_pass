export type BookingStatus = 'active' | 'previous' | 'cancelled';
export type BookingType = 'hot-desk' | 'private-office' | 'meeting-room';
export type BookingPlan = 'daily' | 'monthly' | 'yearly';
export type SpaceType = 'hot-desk' | 'private-office' | 'meeting-room' | 'mixed';

export interface SpacePricing {
  daily: number;
  monthly: number;
  yearly: number;
}

export interface Space {
  id: string;
  name: string;
  city: string;
  region?: string;
  district?: string;
  address: string;
  description: string;
  type: SpaceType;
  images: string[];
  amenities: string[];
  totalCapacity: number;
  availableCapacity: number;
  pricing: SpacePricing;
  rating: number;
  reviewCount: number;
  isVisible: boolean;
  isFeatured: boolean;
  openHours: string;
  phone: string;
  email: string;
  ownerId?: string; // id of the provider (User with role 'provider') who owns/manages this space
  status?: 'published' | 'draft' | 'hidden';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface PaymentCard {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'Mada';
  last4: string;
  holderName: string;
  expiry: string; // MM/YY
}

export type UserRole = 'individual' | 'organization' | 'provider' | 'admin' | 'B2C' | 'HR_ADMIN' | 'PARTNER_ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  erdRole?: 'B2C' | 'HR_ADMIN' | 'PARTNER_ADMIN' | 'SUPER_ADMIN';
  phone: string;
  avatar: string;
  isBlocked: boolean;
  joinDate: string;
  username?: string;
  university?: string;
  bio?: string;
  companyId?: string; // FK to COMPANIES for B2B employees
  orgName?: string; // COMPANIES.name
  orgSize?: number; // total_passes_purchased
  employees?: Employee[];
  orgDescription?: string;
  website?: string;
  industry?: string;
  savedCards?: PaymentCard[];
  businessName?: string; // PARTNERS.brand_name
  crNumber?: string;
  city?: string;
  businessDescription?: string;
  revenueShare?: number; // PARTNERS.revenue_share_percentage
  hasActivePass?: boolean; // All-Access Pass membership status
  membershipTier?: 'All-Access Pass' | 'Pro Pass' | 'Basic Pass' | 'Enterprise Pass' | string;
}

export function isUserPassHolder(user: User | null): boolean {
  if (!user) return false;
  if (user.hasActivePass !== undefined) return user.hasActivePass;
  return user.role === 'individual' || user.role === 'organization' || user.role === 'B2C' || user.role === 'HR_ADMIN';
}

export type MembershipTier = 'all-access' | 'pro' | 'basic' | 'enterprise' | 'none';

export interface PlanPricingResult {
  isCovered: boolean;
  effectivePrice: number;
  originalPrice: number;
  badgeLabel: string;
  hasDiscount: boolean;
  discountPercentage?: number;
}

export function getEffectiveSpacePrice(
  user: User | null,
  space: Space,
  planType: 'daily' | 'monthly' | 'yearly' = 'daily',
  deskType?: BookingType | SpaceType
): PlanPricingResult {
  const originalPrice = space?.pricing?.[planType] ?? 100;
  
  if (!user) {
    return {
      isCovered: false,
      effectivePrice: originalPrice,
      originalPrice,
      badgeLabel: `SAR ${originalPrice.toLocaleString()}`,
      hasDiscount: false,
    };
  }

  // Determine user's active membership tier
  const tier: MembershipTier = user.membershipTier
    ? (user.membershipTier.toLowerCase().includes('enterprise') ? 'enterprise'
        : user.membershipTier.toLowerCase().includes('all-access') ? 'all-access'
        : user.membershipTier.toLowerCase().includes('pro') ? 'pro'
        : user.membershipTier.toLowerCase().includes('basic') ? 'basic' : 'none')
    : (user.role === 'organization' || user.role === 'HR_ADMIN' ? 'enterprise'
        : user.hasActivePass !== false ? 'all-access' : 'none');

  const targetType = deskType || space.type;

  // 1. Enterprise / B2B Corporate Pass: All spaces & desk types 100% included
  if (tier === 'enterprise') {
    return {
      isCovered: true,
      effectivePrice: 0,
      originalPrice,
      badgeLabel: 'Included in Pass',
      hasDiscount: true,
      discountPercentage: 100,
    };
  }

  // 2. All-Access Pass: Hot desks, meeting rooms, mixed covered 100%. Private offices 70% discount / 30% upgrade price.
  if (tier === 'all-access') {
    if (targetType === 'private-office') {
      const effectivePrice = Math.round(originalPrice * 0.3); // 70% off
      return {
        isCovered: false,
        effectivePrice,
        originalPrice,
        badgeLabel: `SAR ${effectivePrice} (70% Off Upgrade)`,
        hasDiscount: true,
        discountPercentage: 70,
      };
    }
    return {
      isCovered: true,
      effectivePrice: 0,
      originalPrice,
      badgeLabel: 'Included in Pass',
      hasDiscount: true,
      discountPercentage: 100,
    };
  }

  // 3. Pro Pass: Hot desk & mixed covered 100% for daily & monthly. Meeting rooms & private offices get 50% discount.
  if (tier === 'pro') {
    if (targetType === 'hot-desk' || targetType === 'mixed') {
      if (planType === 'daily' || planType === 'monthly') {
        return {
          isCovered: true,
          effectivePrice: 0,
          originalPrice,
          badgeLabel: 'Included in Pass',
          hasDiscount: true,
          discountPercentage: 100,
        };
      }
    }
    const effectivePrice = Math.round(originalPrice * 0.5); // 50% off
    return {
      isCovered: false,
      effectivePrice,
      originalPrice,
      badgeLabel: `SAR ${effectivePrice} (50% Off)`,
      hasDiscount: true,
      discountPercentage: 50,
    };
  }

  // 4. Basic Pass: Hot desk daily covered 100%.
  if (tier === 'basic') {
    if (targetType === 'hot-desk' && planType === 'daily') {
      return {
        isCovered: true,
        effectivePrice: 0,
        originalPrice,
        badgeLabel: 'Included in Pass',
        hasDiscount: true,
        discountPercentage: 100,
      };
    }
  }

  // 5. Default / No Pass
  return {
    isCovered: false,
    effectivePrice: originalPrice,
    originalPrice,
    badgeLabel: `SAR ${originalPrice.toLocaleString()}`,
    hasDiscount: false,
  };
}

export interface Booking {
  id: string;
  userId: string;
  spaceId: string;
  spaceName: string;
  spaceCity: string;
  spaceAddress: string;
  spaceImage: string;
  type: BookingType;
  plan: BookingPlan;
  startDate: string;
  endDate: string;
  seats: number;
  employees: string[];
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  notes?: string;
}

export type Screen =
  | 'landing'
  | 'browse'
  | 'space-details'
  | 'pricing'
  | 'contact' 
  | 'login'
  | 'signup'
  | 'choose-type'
  | 'ind-dashboard'
  | 'booking-flow'
  | 'booking-confirm'
  | 'my-bookings'
  | 'booking-details'
  | 'ind-profile'
  | 'ind-settings'
  | 'org-dashboard'
  | 'team-booking'
  | 'team-bookings'
  | 'org-profile'
  | 'org-settings'
  | 'company-workspaces'
  | 'company-add-workspace'
  | 'company-bookings'
  | 'company-team'
  | 'company-workspace-details'
  | 'company-reports'
  | 'admin-dashboard'
  | 'admin-spaces'
  | 'admin-users'
  | 'admin-bookings'
  | 'admin-reports'
  | 'admin-settings'
  | 'provider-dashboard'
  | 'provider-spaces'
  | 'provider-bookings'
  | 'provider-profile'
  | 'provider-settings';

export interface NavState {
  screen: Screen;
  params: Record<string, any>;
}