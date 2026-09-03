export type UserRole =
  | 'individual'
  | 'organization'
  | 'provider'
  | 'admin'
  | 'B2C'
  | 'HR_ADMIN'
  | 'PARTNER_ADMIN'
  | 'SUPER_ADMIN';

export type BookingStatus = 'active' | 'previous' | 'cancelled';

export type BookingType = 'hot-desk' | 'private-office' | 'meeting-room';

export type BookingPlan = 'hourly' | 'daily' | 'monthly' | 'yearly';

export type SpaceType =
  | 'hot-desk'
  | 'shared-desk'
  | 'private-office'
  | 'meeting-room'
  | 'theater'
  | 'mixed';

export type BookingMode = 'subscription' | 'hourly';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'cancelled' | 'reminder' | 'info' | 'payment' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface SpaceBookingPackage {
  id: string;
  name: string;
  period: 'day' | 'month';
  hours: number;
  price: number;
}

export interface SpacePricing {
  hourly?: number; // Base 1-hour rate
  hourlyTiers?: { hours: number; price: number }[]; // Specific duration pricing, e.g. [{hours: 1, price: 50}, {hours: 2, price: 90}]
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

  // باقات الحجز بالساعات ونقاط الولاء
  bookingMode?: BookingMode;
  bookingPackages?: SpaceBookingPackage[];
  loyaltyPointsMultiplier?: number;

  rating: number;
  reviewCount: number;
  isVisible: boolean;
  isFeatured: boolean;
  openHours: string;
  phone: string;
  email: string;
  ownerId?: string; // id of the provider who owns/manages this space
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
  companyId?: string;
  orgName?: string;
  orgSize?: number;
  employees?: Employee[];
  orgDescription?: string;
  website?: string;
  industry?: string;
  savedCards?: PaymentCard[];
  businessName?: string;
  crNumber?: string;
  city?: string;
  businessDescription?: string;
  revenueShare?: number;
  hasActivePass?: boolean;
  membershipTier?: 'All-Access Pass' | 'Pro Pass' | 'Basic Pass' | 'Enterprise Pass' | string;
  loyaltyPoints?: number;
}

export function isUserPassHolder(user: User | null): boolean {
  if (!user) return false;
  if (user.hasActivePass !== undefined) return user.hasActivePass;
  return (
    user.role === 'individual' ||
    user.role === 'organization' ||
    user.role === 'B2C' ||
    user.role === 'HR_ADMIN'
  );
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

/**
 * Calculate the price for a specific duration in hours for a space.
 */
export function getHourlyPriceForDuration(space: Space, durationHours: number = 1): number {
  if (!space || !space.pricing) return 50 * durationHours;
  const hours = Math.max(1, Math.round(durationHours));

  // 1. Check if an exact tier exists
  if (space.pricing.hourlyTiers && space.pricing.hourlyTiers.length > 0) {
    const tier = space.pricing.hourlyTiers.find(t => t.hours === hours);
    if (tier && tier.price > 0) {
      return tier.price;
    }
  }

  // 2. Base hourly rate fallback
  const baseHourly = space.pricing.hourly || Math.max(25, Math.round((space.pricing.daily || 150) / 4));

  if (hours === 1) return baseHourly;

  // Progressive volume discount for multi-hour reservations
  const discountMultiplier =
    hours === 2 ? 1.8
    : hours === 3 ? 2.5
    : hours === 4 ? 3.1
    : hours === 5 ? 3.8
    : hours === 6 ? 4.4
    : hours === 7 ? 5.0
    : hours >= 8 ? Math.min(space.pricing.daily || 150, Math.round(baseHourly * (hours * 0.7)))
    : hours;

  return typeof discountMultiplier === 'number' && hours < 8
    ? Math.round(baseHourly * discountMultiplier)
    : Math.round(baseHourly * hours);
}

/**
 * Automatically calculate the end time string (e.g. "12:00 PM") given a start time and duration hours.
 */
export function calculateEndTime(startTimeStr: string, durationHours: number = 1): string {
  if (!startTimeStr) return '';
  let hours = 9;
  let minutes = 0;

  const cleanStr = startTimeStr.trim().toUpperCase();
  const isPM = cleanStr.includes('PM');
  const isAM = cleanStr.includes('AM');
  const timeOnly = cleanStr.replace(/[^\d:]/g, '');
  const parts = timeOnly.split(':');

  if (parts.length >= 1) {
    hours = parseInt(parts[0], 10) || 9;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  }
  if (parts.length >= 2) {
    minutes = parseInt(parts[1], 10) || 0;
  }

  const totalEndMinutes = (hours * 60 + minutes) + Math.round(durationHours * 60);
  const endHours24 = Math.floor(totalEndMinutes / 60) % 24;
  const endMinutes = totalEndMinutes % 60;

  const period = endHours24 >= 12 ? 'PM' : 'AM';
  const displayHours = endHours24 % 12 === 0 ? 12 : endHours24 % 12;
  const displayMinutes = String(endMinutes).padStart(2, '0');

  return `${String(displayHours).padStart(2, '0')}:${displayMinutes} ${period}`;
}

/**
 * Converts a time string (e.g. "09:00 AM", "14:30") to minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleanStr = timeStr.trim().toUpperCase();
  const isPM = cleanStr.includes('PM');
  const isAM = cleanStr.includes('AM');
  const timeOnly = cleanStr.replace(/[^\d:]/g, '');
  const parts = timeOnly.split(':');
  let h = parseInt(parts[0], 10) || 0;
  const m = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + m;
}

/**
 * Validate whether the booking time falls inside the space's operating hours.
 */
export function isTimeWithinOpenHours(
  dateStr: string,
  startTime: string,
  endTime: string,
  openHoursStr?: string
): { valid: boolean; reason?: string } {
  if (!startTime || !endTime) return { valid: true };

  const startMin = timeStringToMinutes(startTime);
  const endMin = timeStringToMinutes(endTime);

  if (endMin <= startMin) {
    return { valid: false, reason: 'End time must be after start time.' };
  }

  let openMin = 420;  // 7:00 AM
  let closeMin = 1380; // 11:00 PM

  if (openHoursStr) {
    const lower = openHoursStr.toLowerCase();
    if (lower.includes('24/7') || lower.includes('24 hours')) {
      return { valid: true };
    }
    if (dateStr) {
      const dayOfWeek = new Date(dateStr).getDay();
      if ((dayOfWeek === 5 || dayOfWeek === 6) && lower.includes('fri')) {
        if (lower.includes('2pm') || lower.includes('14:00')) openMin = 14 * 60;
        else if (lower.includes('9am')) openMin = 9 * 60;
        else if (lower.includes('10am')) openMin = 10 * 60;
      }
    }
    if (lower.includes('8am')) openMin = 8 * 60;
    else if (lower.includes('7am')) openMin = 7 * 60;
    else if (lower.includes('6am')) openMin = 6 * 60;
    else if (lower.includes('9am')) openMin = 9 * 60;

    if (lower.includes('11pm')) closeMin = 23 * 60;
    else if (lower.includes('10pm')) closeMin = 22 * 60;
    else if (lower.includes('9pm')) closeMin = 21 * 60;
    else if (lower.includes('8pm')) closeMin = 20 * 60;
    else if (lower.includes('6pm')) closeMin = 18 * 60;
  }

  if (startMin < openMin) {
    const openH = Math.floor(openMin / 60);
    const openPeriod = openH >= 12 ? 'PM' : 'AM';
    const displayH = openH % 12 === 0 ? 12 : openH % 12;
    return { valid: false, reason: `Space opens at ${displayH}:00 ${openPeriod}. Please select a later start time.` };
  }

  if (endMin > closeMin) {
    const closeH = Math.floor(closeMin / 60);
    const closePeriod = closeH >= 12 ? 'PM' : 'AM';
    const displayH = closeH % 12 === 0 ? 12 : closeH % 12;
    return { valid: false, reason: `Space closes at ${displayH}:00 ${closePeriod}. Reservation duration exceeds operating hours.` };
  }

  return { valid: true };
}

/**
 * Check if the requested booking overlaps with existing active bookings for the same space.
 */
export function checkSpaceOverlap(
  bookings: Booking[],
  spaceId: string,
  date: string,
  startTime?: string,
  endTime?: string,
  totalCapacity: number = 20,
  excludeBookingId?: string
): { available: boolean; conflictCount: number; maxCapacity: number } {
  if (!bookings || !spaceId || !date) return { available: true, conflictCount: 0, maxCapacity: totalCapacity };

  const startMin = startTime ? timeStringToMinutes(startTime) : 0;
  const endMin = endTime ? timeStringToMinutes(endTime) : 1440;

  const conflictingBookings = bookings.filter(b => {
    if (b.spaceId !== spaceId) return false;
    if (b.status !== 'active') return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;

    const bStart = b.startDate || '';
    const bEnd = b.endDate || b.startDate || '';
    if (date < bStart || date > bEnd) return false;

    if (b.startTime && b.endTime && startTime && endTime) {
      const bStartMin = timeStringToMinutes(b.startTime);
      const bEndMin = timeStringToMinutes(b.endTime);
      return startMin < bEndMin && endMin > bStartMin;
    }

    return true;
  });

  const bookedSeats = conflictingBookings.reduce((sum, b) => sum + (b.seats || 1), 0);
  const isAvailable = (totalCapacity - bookedSeats) > 0;

  return {
    available: isAvailable,
    conflictCount: bookedSeats,
    maxCapacity: totalCapacity,
  };
}

export function getEffectiveSpacePrice(
  user: User | null,
  space: Space,
  planType: BookingPlan = 'daily',
  deskType?: BookingType | SpaceType,
  durationHours: number = 1
): PlanPricingResult {
  let originalPrice = 100;
  if (planType === 'hourly') {
    originalPrice = getHourlyPriceForDuration(space, durationHours);
  } else {
    originalPrice = space?.pricing?.[planType] ?? 100;
  }

  if (planType === 'hourly') {
    return {
      isCovered: false,
      effectivePrice: originalPrice,
      originalPrice,
      badgeLabel: `SAR ${originalPrice.toLocaleString()}`,
      hasDiscount: false,
    };
  }

  if (!user || user.hasActivePass === false) {
    return {
      isCovered: false,
      effectivePrice: originalPrice,
      originalPrice,
      badgeLabel: `SAR ${originalPrice.toLocaleString()}`,
      hasDiscount: false,
    };
  }

  const tierStr = (user.membershipTier || '').toLowerCase();

  const isYearlyPass = tierStr.includes('yearly') || tierStr.includes('enterprise') || tierStr.includes('all-access');
  const isMonthlyPass = tierStr.includes('monthly') || tierStr.includes('pro');
  const isDailyPass = tierStr.includes('daily') || tierStr.includes('basic');

  if (isYearlyPass && planType === 'yearly') {
    return {
      isCovered: true,
      effectivePrice: 0,
      originalPrice,
      badgeLabel: 'Included in Pass',
      hasDiscount: true,
      discountPercentage: 100,
    };
  }

  if (isMonthlyPass && planType === 'monthly') {
    return {
      isCovered: true,
      effectivePrice: 0,
      originalPrice,
      badgeLabel: 'Included in Pass',
      hasDiscount: true,
      discountPercentage: 100,
    };
  }

  if (isDailyPass && planType === 'daily') {
    return {
      isCovered: true,
      effectivePrice: 0,
      originalPrice,
      badgeLabel: 'Included in Pass',
      hasDiscount: true,
      discountPercentage: 100,
    };
  }

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

  startTime?: string;
  endTime?: string;
  durationHours?: number;

  bookingPackageId?: string;
  bookingHours?: number;

  startDate: string;
  endDate: string;
  seats: number;
  employees: string[];
  totalPrice: number;
  status: BookingStatus;
  createdAt?: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  spaceId: string;
  spaceName: string;
  spaceCity: string;
  spaceAddress: string;
  spaceImage: string;
  type: BookingType | SpaceType;
  plan: BookingPlan;
  startTime?: string;
  endTime?: string;
  durationHours?: number;
  startDate: string;
  endDate: string;
  seats: number;
  employees?: string[];
  pricePerSeat: number;
  itemTotal: number;
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
  | 'forgot-password'
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
  | 'provider-settings'
  | 'notifications'
  | 'cart'
  | 'loyalty';

export interface NavState {
  screen: Screen;
  params: Record<string, any>;
}
