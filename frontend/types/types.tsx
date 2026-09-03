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

export type BookingPlan = 'hourly' | 'daily' | 'monthly' | 'yearly';

export type SpaceCategory = 'office' | 'hall' | 'theater';

export type SpaceType =
  | 'hot-desk'
  | 'shared-desk'
  | 'private-office'
  | 'meeting-room'
  | 'meeting-hall'
  | 'training-hall'
  | 'conference-hall'
  | 'workshop-hall'
  | 'event-hall'
  | 'lecture-hall'
  | 'multipurpose-hall'
  | 'theater'
  | 'performance-theater'
  | 'conference-theater'
  | 'mixed';

export type BookingType = SpaceType;

export type BookingMode = 'subscription' | 'hourly';

/**
 * Derives or retrieves the main space category ('office' | 'hall' | 'theater').
 */
export function getSpaceCategory(spaceOrType?: Space | SpaceType | string): SpaceCategory {
  if (!spaceOrType) return 'office';
  if (typeof spaceOrType === 'object') {
    if (spaceOrType.category) return spaceOrType.category;
    return getSpaceCategory(spaceOrType.type);
  }
  const t = String(spaceOrType).toLowerCase().trim();
  if (t === 'theater' || t === 'performance-theater' || t === 'conference-theater' || t.includes('theater')) {
    return 'theater';
  }
  if (
    t === 'meeting-hall' ||
    t === 'training-hall' ||
    t === 'conference-hall' ||
    t === 'workshop-hall' ||
    t === 'event-hall' ||
    t === 'lecture-hall' ||
    t === 'multipurpose-hall' ||
    t.includes('hall')
  ) {
    return 'hall';
  }
  return 'office';
}

/**
 * Checks if hourly bookings are permitted (only for Halls and Theaters).
 */
export function isHourlyAllowed(spaceOrType?: Space | SpaceType | string): boolean {
  const cat = getSpaceCategory(spaceOrType);
  return cat === 'hall' || cat === 'theater';
}

/**
 * Helper to check if a space is a Hall or Theater that supports hourly duration booking.
 */
export function isHourlyOnlySpace(spaceType?: string): boolean {
  return isHourlyAllowed(spaceType);
}

/**
 * Checks if a space type is an Office (which does NOT support hourly booking).
 */
export function isOfficeSpace(spaceType?: string): boolean {
  return getSpaceCategory(spaceType) === 'office';
}

/**
 * Returns allowed booking plans based on space type:
 * - Halls: ['hourly', 'daily', 'monthly', 'yearly']
 * - Theaters: ['hourly', 'daily', 'monthly', 'yearly']
 * - Offices: ['daily', 'monthly', 'yearly'] (NO hourly)
 */
export function getAllowedPlansForSpace(spaceOrType?: Space | string): BookingPlan[] {
  const cat = getSpaceCategory(spaceOrType);
  if (cat === 'hall' || cat === 'theater') {
    return ['hourly', 'daily', 'monthly', 'yearly'];
  }
  // Offices: Daily, Monthly, Yearly only
  return ['daily', 'monthly', 'yearly'];
}

/**
 * Calculate the end date string given start date, plan, and month duration.
 */
export function calculateEndDate(
  startDate: string,
  plan: BookingPlan,
  durationMonths: number = 1
): string {
  if (!startDate) return '';
  if (plan === 'hourly' || plan === 'daily') return startDate;
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return startDate;
  if (plan === 'monthly') {
    const months = Math.max(1, durationMonths);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  }
  if (plan === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  }
  return startDate;
}

export const ALL_SPACE_TYPES: { value: SpaceType; label: string; group: 'Offices' | 'Halls' | 'Theaters' | 'Desks & Workspaces' }[] = [
  // Offices
  { value: 'private-office', label: 'Private Office', group: 'Offices' },
  
  // Halls
  { value: 'meeting-hall', label: 'Meeting Hall', group: 'Halls' },
  { value: 'training-hall', label: 'Training Hall', group: 'Halls' },
  { value: 'conference-hall', label: 'Conference Hall', group: 'Halls' },
  { value: 'workshop-hall', label: 'Workshop Hall', group: 'Halls' },
  { value: 'event-hall', label: 'Event Hall', group: 'Halls' },
  { value: 'lecture-hall', label: 'Lecture Hall', group: 'Halls' },
  { value: 'multipurpose-hall', label: 'Multi-purpose Hall', group: 'Halls' },
  
  // Theaters
  { value: 'theater', label: 'Theater', group: 'Theaters' },
  { value: 'performance-theater', label: 'Performance Theater', group: 'Theaters' },
  { value: 'conference-theater', label: 'Conference & Event Theater', group: 'Theaters' },
  
  // Desks & Workspaces (under Offices / Workspaces)
  { value: 'hot-desk', label: 'Hot Desk', group: 'Desks & Workspaces' },
  { value: 'shared-desk', label: 'Shared Desk', group: 'Desks & Workspaces' },
  { value: 'meeting-room', label: 'Meeting Room', group: 'Desks & Workspaces' },
  { value: 'mixed', label: 'Mixed Workspace', group: 'Desks & Workspaces' },
];

export function getSpaceTypeLabel(type?: string): string {
  if (!type) return 'Workspace';
  const found = ALL_SPACE_TYPES.find(t => t.value === type);
  if (found) return found.label;
  return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

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

export interface HourlyTier {
  hours: number;
  price: number;
}

export interface MonthlyTier {
  months: number;
  price: number;
}

export interface SpacePricing {
  hourly?: number; // Base 1-hour rate
  hourlyTiers?: HourlyTier[]; // Specific duration pricing, e.g. [{hours: 1, price: 150}, {hours: 2, price: 280}, ...]
  daily: number;
  monthly: number; // Base 1-month rate
  monthlyTiers?: MonthlyTier[]; // Specific multi-month pricing, e.g. [{months: 1, price: 1800}, {months: 2, price: 3400}, ...]
  yearly: number;
}

export interface Space {
  id: string;
  name: string;
  category?: SpaceCategory; // 'office' | 'hall' | 'theater'
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

  // باقات الحجز بالساعات (من كودهم)
  bookingMode?: BookingMode;
  bookingPackages?: SpaceBookingPackage[];

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

/**
 * Calculate the price for a specific duration in hours for a space.
 * Checks for exact provider configured duration tier, otherwise computes based on base hourly rate.
 */
export function getHourlyPriceForDuration(space: Space, durationHours: number = 1): number {
  if (!space || !space.pricing) return 50 * durationHours;
  const hours = Math.max(1, Math.round(durationHours));

  // 1. Check if an exact provider configured tier exists
  if (space.pricing.hourlyTiers && space.pricing.hourlyTiers.length > 0) {
    const tier = space.pricing.hourlyTiers.find(t => t.hours === hours);
    if (tier && typeof tier.price === 'number' && tier.price > 0) {
      return tier.price;
    }
  }

  // 2. Base hourly rate fallback
  const baseHourly = space.pricing.hourly || 150;
  return baseHourly * hours;
}

/**
 * Calculate the price for a specific duration in months for a space.
 * Checks for exact provider configured monthly duration tier (e.g. 1, 2, 3, 6, 12 months),
 * otherwise computes based on base monthly rate or yearly rate.
 */
export function getMonthlyPriceForDuration(space: Space, durationMonths: number = 1): number {
  if (!space || !space.pricing) return 1800 * durationMonths;
  const months = Math.max(1, Math.round(durationMonths));

  // 1. Check if an exact provider configured monthly tier exists
  if (space.pricing.monthlyTiers && space.pricing.monthlyTiers.length > 0) {
    const tier = space.pricing.monthlyTiers.find(t => t.months === months);
    if (tier && typeof tier.price === 'number' && tier.price > 0) {
      return tier.price;
    }
  }

  // 2. Check 12-month yearly rate if configured
  if (months === 12 && space.pricing.yearly && space.pricing.yearly > 0) {
    return space.pricing.yearly;
  }

  // 3. Base monthly rate * months
  const baseMonthly = space.pricing.monthly || 1800;
  return baseMonthly * months;
}

/**
 * Automatically calculate the end time string (e.g. "12:00 PM") given a start time and duration hours.
 */
export function calculateEndTime(startTimeStr: string, durationHours: number = 1): string {
  if (!startTimeStr) return '';
  // Parse format like "09:00", "09:00 AM", "14:30"
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
 * Converts a time string (e.g. "09:00 AM", "14:30") to minutes from midnight for arithmetic comparisons.
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

  // Default operating window: 07:00 AM (420m) to 11:00 PM (1380m)
  let openMin = 420;  // 7:00 AM
  let closeMin = 1380; // 11:00 PM

  if (openHoursStr) {
    const lower = openHoursStr.toLowerCase();
    if (lower.includes('24/7') || lower.includes('24 hours')) {
      return { valid: true };
    }
    // Check if weekend / Friday specific hours exist
    if (dateStr) {
      const dayOfWeek = new Date(dateStr).getDay(); // 5 is Friday, 6 is Saturday
      if ((dayOfWeek === 5 || dayOfWeek === 6) && lower.includes('fri')) {
        // e.g. "Fri: 2pm-10pm" or "Fri-Sat: 9am-6pm"
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
 * Check if the requested booking overlaps with existing active bookings for the same space and exceeds capacity.
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

    // Check date overlap
    const bStart = b.startDate || '';
    const bEnd = b.endDate || b.startDate || '';
    if (date < bStart || date > bEnd) return false;

    // Check time interval overlap if both have start/end times
    if (b.startTime && b.endTime && startTime && endTime) {
      const bStartMin = timeStringToMinutes(b.startTime);
      const bEndMin = timeStringToMinutes(b.endTime);
      // Overlap condition: startMin < bEndMin && endMin > bStartMin
      return startMin < bEndMin && endMin > bStartMin;
    }

    return true; // daily/monthly bookings span the whole day
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
  durationHours: number = 1,
  durationMonths: number = 1
): PlanPricingResult {
  if (!space) {
    return {
      isCovered: false,
      effectivePrice: 150,
      originalPrice: 150,
      badgeLabel: 'SAR 150',
      hasDiscount: false,
    };
  }

  let originalPrice = 150;
  if (planType === 'hourly') {
    originalPrice = getHourlyPriceForDuration(space, durationHours);
  } else if (planType === 'monthly') {
    originalPrice = getMonthlyPriceForDuration(space, durationMonths);
  } else if (planType === 'yearly') {
    originalPrice = space.pricing?.yearly ?? ((space.pricing?.monthly ?? 1800) * 10);
  } else {
    // daily
    originalPrice = space.pricing?.daily ?? 150;
  }

  // Hourly duration bookings are on-demand per-hour reservations
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

  // Strict 1-to-1 Plan Matching:
  // 1. Yearly Pass Member -> ONLY Yearly plan reservations are Included in Pass (SAR 0)
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

  // 2. Monthly Pass Member -> ONLY Monthly plan reservations are Included in Pass (SAR 0)
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

  // 3. Daily Pass Member -> ONLY Daily plan reservations are Included in Pass (SAR 0)
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

  // Non-matching plan types are charged full original price
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
  category?: SpaceCategory; // 'office' | 'hall' | 'theater'
  type: BookingType;
  plan: BookingPlan; // 'hourly' | 'daily' | 'monthly' | 'yearly'

  // Time & Duration for Hourly Reservations (Halls & Theaters only)
  startTime?: string; // e.g. '09:00 AM'
  endTime?: string;   // e.g. '11:00 AM'
  durationHours?: number; // e.g. 1, 2, 3, 4, 6, 8

  // Duration for Monthly Reservations (Multi-month: 1, 2, 3, 6, 12)
  durationMonths?: number;

  // Package reference if any
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
  durationMonths?: number;
  startDate: string;
  endDate: string;
  seats: number;
  employees?: string[];
  pricePerSeat: number;
  itemTotal: number;
  notes?: string;
}

export function getBookingPrice(b: Booking, spaces: Space[] = []): number {
  if (typeof b.totalPrice === 'number' && !isNaN(b.totalPrice) && b.totalPrice >= 0) {
    return b.totalPrice;
  }
  const space = spaces.find(s => s.id === b.spaceId || s.name.toLowerCase() === b.spaceName.toLowerCase());
  const seats = b.seats || 1;
  if (!space) return 150 * seats;
  if (b.plan === 'hourly') {
    const hours = b.durationHours || 1;
    return getHourlyPriceForDuration(space, hours) * seats;
  }
  if (b.plan === 'monthly') {
    const months = b.durationMonths || 1;
    return getMonthlyPriceForDuration(space, months) * seats;
  }
  if (b.plan === 'yearly') {
    return (space.pricing?.yearly || ((space.pricing?.monthly || 1800) * 10)) * seats;
  }
  return (space.pricing?.daily || 150) * seats;
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
  | 'notifications';

export interface NavState {
  screen: Screen;
  params: Record<string, any>;
}
