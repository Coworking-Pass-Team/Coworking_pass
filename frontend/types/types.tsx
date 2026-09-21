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
    t === 'meeting-room' ||
    t === 'event-space' ||
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
 * - Halls: ['daily'] (hourly, monthly, and yearly removed per policy)
 * - Theaters: ['daily'] (hourly, monthly, and yearly removed per policy)
 * - Offices: ['daily', 'monthly', 'yearly'] (NO hourly)
 */
export function getAllowedPlansForSpace(spaceOrType?: Space | string): BookingPlan[] {
  const cat = getSpaceCategory(spaceOrType);
  if (cat === 'hall' || cat === 'theater') {
    return ['daily'];
  }
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

/**
 * Calculate the number of days between startDate and endDate (inclusive).
 * If endDate is missing, same as startDate, or earlier, returns 1.
 */
export function calculateDailyDurationDays(startDate: string, endDate?: string): number {
  if (!startDate) return 1;
  if (!endDate || endDate === startDate) return 1;
  const [y1, m1, d1] = startDate.split('-').map(Number);
  const [y2, m2, d2] = endDate.split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 1;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const diffDays = Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? 1 : diffDays + 1;
}

/**
 * Format a human-readable date range with duration label.
 */
export function formatDateRange(startDate: string, endDate?: string): string {
  if (!startDate) return '';
  if (!endDate || endDate === startDate) {
    return `${startDate} (1 day)`;
  }
  const days = calculateDailyDurationDays(startDate, endDate);
  return `${startDate} → ${endDate} (${days} ${days === 1 ? 'day' : 'days'})`;
}

export const ALL_SPACE_TYPES: { value: SpaceType; label: string; group: 'Offices' | 'Halls' | 'Theaters' | 'Desks & Workspaces' }[] = [
  // Offices
  { value: 'private-office', label: 'Private Office', group: 'Offices' },
  
  // Halls
  { value: 'meeting-room', label: 'Meeting Room / Hall', group: 'Halls' },
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
  
  // Desks & Workspaces
  { value: 'hot-desk', label: 'Hot Desk', group: 'Desks & Workspaces' },
  { value: 'shared-desk', label: 'Shared Desk', group: 'Desks & Workspaces' },
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
  hourlyTiers?: HourlyTier[]; // Specific duration pricing, e.g. [{hours: 1, price: 150}, {hours: 2, price: 280}]
  daily: number;
  monthly: number; // Base 1-month rate
  monthlyTiers?: MonthlyTier[]; // Specific multi-month pricing, e.g. [{months: 1, price: 1800}, {months: 2, price: 3400}]
  yearly: number;
}

export interface Space {
  id: string;
  name: string;
  category?: SpaceCategory;
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
  ownerId?: string;
  status?: 'published' | 'draft' | 'hidden';
  latitude?: number;
  longitude?: number;
  coordinates?: { lat: number; lng: number };
}

/**
 * Haversine formula to calculate the great-circle distance between two geographic coordinates in kilometers.
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance with intuitive units:
 * - If < 1 km: formatted in meters (e.g., "350 m", "850 m")
 * - If >= 1 km: formatted in kilometers (e.g., "1.2 km", "4.8 km", "12.5 km")
 */
export function formatDistance(distanceInKm: number | null | undefined): string {
  if (distanceInKm === null || distanceInKm === undefined || isNaN(distanceInKm)) return '';
  if (distanceInKm < 1) {
    const meters = Math.max(1, Math.round(distanceInKm * 1000));
    return `${meters} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
}

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Riyadh: { lat: 24.7136, lng: 46.6753 },
  Jeddah: { lat: 21.5433, lng: 39.1728 },
  Dammam: { lat: 26.4207, lng: 50.0888 },
  Khobar: { lat: 26.2810, lng: 50.2080 },
  Madinah: { lat: 24.4672, lng: 39.6111 },
  Makkah: { lat: 21.3891, lng: 39.8579 },
};

/**
 * Helper to safely extract coordinates from a Space object.
 */
export function getSpaceCoordinates(space?: Space | null): { lat: number; lng: number } | null {
  if (!space) return null;
  if (space.coordinates && typeof space.coordinates.lat === 'number' && typeof space.coordinates.lng === 'number') {
    return space.coordinates;
  }
  if (typeof space.latitude === 'number' && typeof space.longitude === 'number') {
    return { lat: space.latitude, lng: space.longitude };
  }
  if (space.city && CITY_COORDINATES[space.city]) {
    return CITY_COORDINATES[space.city];
  }
  return null;
}

export type CrowdingLevel = 'Quiet' | 'Moderate' | 'Busy';

export interface SpaceCrowdingInfo {
  scannedCount: number;
  totalCapacity: number;
  availableCapacity: number;
  occupiedSeats: number;
  occupancyPercentage: number;
  level: CrowdingLevel;
  badgeClass: string;
  barColor: string;
  textColor: string;
  trackColor: string;
}

/**
 * Calculates live crowding indicators based on total capacity, baseline availability,
 * and real-time QR code check-in scans.
 */
export function calculateSpaceCrowding(
  space: Space,
  scannedCount: number = 0
): SpaceCrowdingInfo {
  const total = space.totalCapacity > 0 ? space.totalCapacity : 30;
  const occupied = Math.min(total, Math.max(0, scannedCount));
  const available = Math.max(0, total - occupied);
  const occupancyPercentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

  let level: CrowdingLevel = 'Quiet';
  let textColor = 'text-[#059669]';
  let barColor = 'bg-[#059669]';
  let badgeClass = 'bg-emerald-100/90 text-emerald-900 border-emerald-200/90';
  let trackColor = 'bg-[#E5EBE7]';

  if (available === 0 || occupancyPercentage >= 80) {
    level = 'Busy';
    textColor = 'text-[#DC2626]';
    barColor = 'bg-[#DC2626]';
    badgeClass = 'bg-rose-100/90 text-rose-800 border-rose-200/90';
  } else if (occupancyPercentage >= 40) {
    level = 'Moderate';
    textColor = 'text-[#D97706]';
    barColor = 'bg-[#D97706]';
    badgeClass = 'bg-amber-100/90 text-amber-900 border-amber-200/90';
  } else {
    level = 'Quiet';
    textColor = 'text-[#059669]';
    barColor = 'bg-[#059669]';
    badgeClass = 'bg-emerald-100/90 text-emerald-900 border-emerald-200/90';
  }

  return {
    scannedCount,
    totalCapacity: total,
    availableCapacity: available,
    occupiedSeats: occupied,
    occupancyPercentage,
    level,
    badgeClass,
    barColor,
    textColor,
    trackColor,
  };
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
  expiry: string;
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
  membershipTier?: 'All-Access Pass' | 'Pro Pass' | 'Basic Pass' | 'Enterprise Pass' | 'Yearly Pass' | 'Monthly Pass' | string;
  loyaltyPoints?: number;
  walletBalance?: number;
  remainingHours?: number;
  totalPlanHours?: number;
  planCycleStart?: string;
  passPurchaseDate?: string;
  passPricePaid?: number;
  passUsed?: boolean;
}

export interface PassRefundEligibility {
  isEligible: boolean;
  isWithin3Days: boolean;
  isUsed: boolean;
  hoursPassed: number;
  daysPassed: number;
  hoursRemainingInWindow: number;
  refundAmount: number;
  usedReasons: string[];
  ineligibleReasons: string[];
}

/**
 * Ensures a user's monthly meeting room & theater hours are initialized and renewed monthly (every 30 days).
 */
export function checkAndRenewPlanHours(user: User): User {
  if (!user || !user.hasActivePass) return user;

  const tier = (user.membershipTier || '').toLowerCase();
  const isYearly = tier.includes('year') || tier.includes('annual');
  const isMonthly = tier.includes('month') || tier.includes('pro') || tier.includes('all-access');
  const isTeam = tier.includes('team');

  const totalMonthlyHours = isYearly ? 12 : isMonthly ? 8 : isTeam ? 10 : 0;
  if (totalMonthlyHours === 0) return user;

  const now = Date.now();
  const cycleStart = user.planCycleStart ? new Date(user.planCycleStart).getTime() : now;
  const daysPassed = (now - cycleStart) / (1000 * 60 * 60 * 24);

  // Auto-renew if 30 days or more have elapsed since current cycle start
  if (daysPassed >= 30) {
    const cyclesElapsed = Math.floor(daysPassed / 30);
    const newCycleStart = new Date(cycleStart + cyclesElapsed * 30 * 24 * 60 * 60 * 1000).toISOString();
    return {
      ...user,
      remainingHours: totalMonthlyHours,
      totalPlanHours: totalMonthlyHours,
      planCycleStart: newCycleStart,
    };
  }

  // Initialize remainingHours if undefined
  if (typeof user.remainingHours !== 'number') {
    return {
      ...user,
      remainingHours: totalMonthlyHours,
      totalPlanHours: totalMonthlyHours,
      planCycleStart: user.planCycleStart || new Date().toISOString(),
    };
  }

  return user;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAW' | 'REFUND';
  description?: string | null;
  referenceId?: string | null;
  balanceAfter: number;
  createdAt: string;
}

export function parseBookingDateTime(startDate?: string, startTime?: string): Date | null {
  if (!startDate) return null;

  let hours = 8;
  let minutes = 0;

  if (startTime) {
    const isPM = /PM/i.test(startTime);
    const isAM = /AM/i.test(startTime);
    const cleanTime = startTime.replace(/(AM|PM|\s)/gi, '').trim();
    const parts = cleanTime.split(':');
    if (parts.length >= 1) {
      let h = parseInt(parts[0], 10);
      if (!isNaN(h)) {
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        hours = h;
      }
    }
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      if (!isNaN(m)) minutes = m;
    }
  }

  const dateParts = startDate.split('-').map((p) => parseInt(p, 10));
  if (dateParts.length === 3 && !dateParts.some(isNaN)) {
    return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, minutes, 0);
  }

  const d = new Date(startDate);
  if (!isNaN(d.getTime())) {
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  return null;
}

/**
 * Check if a booking is eligible for a full refund upon cancellation.
 * Individual (B2C) members must cancel 6+ hours in advance.
 * Organization (B2B) members must cancel 24+ hours in advance.
 */
export function isCancellationRefundEligible(
  startDate?: string,
  startTime?: string,
  role: UserRole = 'individual'
): { eligible: boolean; hoursRemaining: number; requiredHours: number } {
  const requiredHours = role === 'organization' ? 24 : 6;
  if (!startDate) return { eligible: true, hoursRemaining: 999, requiredHours };

  const bookingDate = parseBookingDateTime(startDate, startTime);
  if (!bookingDate) return { eligible: false, hoursRemaining: 0, requiredHours };

  const bookingTime = bookingDate.getTime();
  const now = new Date().getTime();

  const hoursRemaining = (bookingTime - now) / (1000 * 60 * 60);
  const eligible = hoursRemaining >= requiredHours;

  return { eligible, hoursRemaining: Math.max(0, hoursRemaining), requiredHours };
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
  isPartiallyCovered?: boolean;
  effectivePrice: number;
  originalPrice: number;
  badgeLabel: string;
  displayPriceLabel?: string;
  totalPayableLabel?: string;
  hasDiscount: boolean;
  discountPercentage?: number;
  coveredSeats?: number;
  payableSeats?: number;
  coveredHours?: number;
  payableHours?: number;
  coverageNote?: string;
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
 * Standard Available Time Slots for Hourly Bookings (7:00 AM – 11:00 PM)
 */
export const START_TIMES = [
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
];

export const END_TIMES = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
  '11:00 PM',
];

/**
 * Converts a time string (e.g. "09:00 AM", "9:00 AM", "14:30") to minutes from midnight.
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
 * Calculates the exact duration in hours from start time and end time strings.
 * Example: Start 9:00 AM, End 5:00 PM -> returns 8.
 */
export function calculateDurationHours(startTimeStr: string, endTimeStr: string): number {
  if (!startTimeStr || !endTimeStr) return 1;
  const startMin = timeStringToMinutes(startTimeStr);
  const endMin = timeStringToMinutes(endTimeStr);
  if (endMin <= startMin) return 1;
  const diffHours = (endMin - startMin) / 60;
  const hours = Math.max(1, Math.round(diffHours * 10) / 10);
  return Math.min(4, hours);
}

/**
 * Returns available end times that are strictly after the selected start time,
 * capped at a maximum of 4 hours daily.
 */
export function getAvailableEndTimes(startTimeStr: string): string[] {
  const startMin = timeStringToMinutes(startTimeStr || '09:00 AM');
  const filtered = END_TIMES.filter((t) => {
    const min = timeStringToMinutes(t);
    return min > startMin && min <= startMin + 4 * 60;
  });
  return filtered.length > 0 ? filtered : [END_TIMES[END_TIMES.length - 1]];
}

/**
 * Formats an hourly time range consistently across all views (e.g., "9:00 AM – 5:00 PM (8 hours)").
 */
export function formatHourlyTimeRange(startTime?: string, endTime?: string, durationHours?: number): string {
  const start = startTime || '09:00 AM';
  const end = endTime || calculateEndTime(start, durationHours || 1);
  const duration = durationHours || calculateDurationHours(start, end);
  return `${start} – ${end} (${duration} ${duration === 1 ? 'hour' : 'hours'})`;
}

/**
 * Formats a booking duration string for cards, modals, and tables.
 */
export function formatBookingTimeDisplay(booking: {
  plan?: BookingPlan | string;
  startTime?: string;
  endTime?: string;
  durationHours?: number;
  durationMonths?: number;
  durationDays?: number;
  startDate?: string;
  endDate?: string;
}): string {
  if (booking.plan === 'hourly') {
    return formatHourlyTimeRange(booking.startTime, booking.endTime, booking.durationHours);
  }
  const timeWindow = booking.startTime && booking.endTime ? ` (${booking.startTime} – ${booking.endTime})` : '';
  if (booking.plan === 'monthly') {
    const m = booking.durationMonths || 1;
    return `${m} ${m === 1 ? 'Month' : 'Months'}${timeWindow}`;
  }
  if (booking.plan === 'yearly') {
    return `1 Year${timeWindow}`;
  }
  const d = booking.durationDays || (booking.startDate && booking.endDate ? calculateDailyDurationDays(booking.startDate, booking.endDate) : 1);
  return `${d} ${d === 1 ? 'Day' : 'Days'}${timeWindow}`;
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

export interface OperatingHoursRange {
  openMinutes: number;
  closeMinutes: number;
  openDisplay: string;
  closeDisplay: string;
  is24_7: boolean;
}

/**
 * Extracts numeric open & close minutes from midnight and display strings from openHours.
 */
export function getOperatingHoursRange(openHoursStr?: string, dateStr?: string): OperatingHoursRange {
  let openMin = 420;  // 7:00 AM default
  let closeMin = 1380; // 11:00 PM default

  if (!openHoursStr) {
    return {
      openMinutes: openMin,
      closeMinutes: closeMin,
      openDisplay: '07:00 AM',
      closeDisplay: '11:00 PM',
      is24_7: false,
    };
  }

  const lower = openHoursStr.toLowerCase();
  if (lower.includes('24/7') || lower.includes('24 hours')) {
    return {
      openMinutes: 0,
      closeMinutes: 1440,
      openDisplay: '12:00 AM',
      closeDisplay: '11:59 PM',
      is24_7: true,
    };
  }

  if (dateStr) {
    const dayOfWeek = new Date(dateStr).getDay();
    if ((dayOfWeek === 5 || dayOfWeek === 6) && (lower.includes('fri') || lower.includes('sat'))) {
      if (lower.includes('2pm') || lower.includes('14:00')) openMin = 14 * 60;
      else if (lower.includes('10am')) openMin = 10 * 60;
      else if (lower.includes('9am')) openMin = 9 * 60;
    }
  }

  if (openMin === 420) {
    if (lower.includes('6am')) openMin = 6 * 60;
    else if (lower.includes('7am')) openMin = 7 * 60;
    else if (lower.includes('8am')) openMin = 8 * 60;
    else if (lower.includes('9am')) openMin = 9 * 60;
    else if (lower.includes('10am')) openMin = 10 * 60;
  }

  if (lower.includes('11pm')) closeMin = 23 * 60;
  else if (lower.includes('10pm')) closeMin = 22 * 60;
  else if (lower.includes('9pm')) closeMin = 21 * 60;
  else if (lower.includes('8pm')) closeMin = 20 * 60;
  else if (lower.includes('6pm')) closeMin = 18 * 60;

  const formatMin = (mins: number) => {
    const h24 = Math.floor(mins / 60) % 24;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const m = mins % 60;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  return {
    openMinutes: openMin,
    closeMinutes: closeMin,
    openDisplay: formatMin(openMin),
    closeDisplay: formatMin(closeMin),
    is24_7: false,
  };
}

/**
 * Returns available start times filtered strictly to the workspace's open hours.
 * Ensures that start time + durationHours does not exceed the venue's closing time.
 */
export function getFilteredStartTimes(openHoursStr?: string, dateStr?: string, durationHours: number = 1): string[] {
  const range = getOperatingHoursRange(openHoursStr, dateStr);
  if (range.is24_7) return START_TIMES;

  const neededMinutes = Math.max(1, durationHours) * 60;
  const filtered = START_TIMES.filter((t) => {
    const min = timeStringToMinutes(t);
    return min >= range.openMinutes && min + neededMinutes <= range.closeMinutes;
  });

  return filtered.length > 0 ? filtered : START_TIMES;
}

/**
 * Returns available end times strictly after startTime and within the workspace's open hours.
 */
export function getFilteredEndTimes(startTimeStr: string, openHoursStr?: string, dateStr?: string): string[] {
  const startMin = timeStringToMinutes(startTimeStr || '09:00 AM');
  const range = getOperatingHoursRange(openHoursStr, dateStr);

  const filtered = END_TIMES.filter((t) => {
    const min = timeStringToMinutes(t);
    return min > startMin && min <= startMin + 4 * 60 && (range.is24_7 || min <= range.closeMinutes);
  });

  if (filtered.length > 0) return filtered;
  return getAvailableEndTimes(startTimeStr);
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

  const range = getOperatingHoursRange(openHoursStr, dateStr);
  if (range.is24_7) return { valid: true };

  if (startMin < range.openMinutes) {
    return {
      valid: false,
      reason: `Space opens at ${range.openDisplay}. Please select a start time within operating hours.`,
    };
  }

  if (endMin > range.closeMinutes) {
    return {
      valid: false,
      reason: `Space closes at ${range.closeDisplay}. Selected reservation duration exceeds operating hours.`,
    };
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
  durationHours: number = 1,
  durationMonths: number = 1,
  seats: number = 1,
  durationDays: number = 1
): PlanPricingResult {
  if (!space) {
    return {
      isCovered: false,
      effectivePrice: 150,
      originalPrice: 150,
      badgeLabel: 'SAR 150',
      displayPriceLabel: 'SAR 150',
      totalPayableLabel: 'SAR 150',
      hasDiscount: false,
    };
  }

  const effectiveSeats = Math.max(1, seats);
  const targetCategory = getSpaceCategory(space);
  const targetType = String(deskType || space.type || 'hot-desk').toLowerCase().trim();

  // 1. Calculate standard price for a single seat
  let singleOriginalPrice = 150;
  if (planType === 'hourly') {
    singleOriginalPrice = getHourlyPriceForDuration(space, durationHours);
  } else if (planType === 'monthly') {
    singleOriginalPrice = getMonthlyPriceForDuration(space, durationMonths);
  } else if (planType === 'yearly') {
    singleOriginalPrice = space.pricing?.yearly ?? ((space.pricing?.monthly ?? 1800) * 10);
  } else {
    const dailyRate = space.pricing?.daily ?? 150;
    singleOriginalPrice = dailyRate * Math.max(1, durationDays);
  }

  const fullOriginalTotal = singleOriginalPrice * effectiveSeats;

  // 2. Unsubscribed user -> full price as normal
  if (!user || !user.hasActivePass) {
    return {
      isCovered: false,
      isPartiallyCovered: false,
      effectivePrice: fullOriginalTotal,
      originalPrice: fullOriginalTotal,
      badgeLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
      displayPriceLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
      totalPayableLabel: `SAR ${fullOriginalTotal.toLocaleString()}`,
      hasDiscount: false,
      coveredSeats: 0,
      payableSeats: effectiveSeats,
      coveredHours: 0,
      payableHours: durationHours,
    };
  }

  // 3. Subscribed user: determine plan tier
  const tierStr = (user.membershipTier || '').toLowerCase().trim();
  const isOrg = user.role === 'organization' || user.role === 'HR_ADMIN';

  const isEnterprisePass = tierStr.includes('enterprise') || tierStr.includes('custom enterprise');
  const isBusinessPass = tierStr.includes('business');
  const isTeamPass = tierStr.includes('team') || tierStr.includes('corporate') || (isOrg && !isBusinessPass && !isEnterprisePass);
  const isAnnualPass = tierStr.includes('annual') || tierStr.includes('yearly') || tierStr.includes('executive');
  const isMonthlyPass = tierStr.includes('monthly') || tierStr.includes('pro') || tierStr.includes('all-access') || (!isOrg && !isAnnualPass && !tierStr.includes('day'));
  const isDayPass = tierStr.includes('day') || tierStr.includes('daily') || tierStr.includes('basic');

  // 4. Coverage by Plan Tier & Workspace Type
  let isTypeIncluded = false;
  let isPlanDurationAllowed = false;
  let includedMeetingHours = 0;
  let maxCoveredSeats = 1;
  let planDisplayName = 'Your Plan';

  if (isEnterprisePass) {
    planDisplayName = 'Enterprise Pass';
    isTypeIncluded = true; // All space types covered
    isPlanDurationAllowed = true; // All durations covered
    includedMeetingHours = 9999;
    maxCoveredSeats = 9999;
  } else if (isBusinessPass) {
    planDisplayName = 'Business Pass';
    isTypeIncluded = targetCategory !== 'theater' && !targetType.includes('theater');
    isPlanDurationAllowed = planType === 'daily' || planType === 'monthly' || planType === 'yearly' || planType === 'hourly';
    includedMeetingHours = 9999;
    maxCoveredSeats = 50;
  } else if (isTeamPass) {
    planDisplayName = 'Team Pass';
    isTypeIncluded = (targetType.includes('desk') || targetType === 'meeting-room' || targetCategory === 'office') && targetCategory !== 'theater';
    isPlanDurationAllowed = planType === 'daily' || planType === 'monthly' || (planType === 'hourly' && targetType.includes('meeting'));
    includedMeetingHours = 10;
    maxCoveredSeats = 20;
  } else if (isAnnualPass) {
    planDisplayName = 'Yearly Pass';
    isTypeIncluded = targetCategory === 'office' || targetType.includes('desk') || targetType === 'private-office' || targetType === 'meeting-room';
    isPlanDurationAllowed = planType === 'daily' || planType === 'monthly' || planType === 'yearly' || (planType === 'hourly' && (targetType.includes('meeting') || targetCategory === 'hall' || targetCategory === 'theater'));
    includedMeetingHours = 12;
    maxCoveredSeats = 1;
  } else if (isMonthlyPass) {
    planDisplayName = 'Monthly Pass';
    isTypeIncluded = (targetCategory === 'office' || targetType.includes('desk') || targetType === 'meeting-room') && targetType !== 'private-office';
    isPlanDurationAllowed = planType === 'daily' || planType === 'monthly' || (planType === 'hourly' && (targetType.includes('meeting') || targetCategory === 'hall' || targetCategory === 'theater'));
    includedMeetingHours = 8;
    maxCoveredSeats = 1;
  } else if (isDayPass) {
    planDisplayName = 'Day Pass';
    isTypeIncluded = targetType.includes('desk') || (targetCategory === 'office' && targetType !== 'private-office' && targetType !== 'meeting-room');
    isPlanDurationAllowed = planType === 'daily';
    includedMeetingHours = 0;
    maxCoveredSeats = 1;
  }

  // Check meeting room, hall, and theater hourly coverage
  const isMeetingOrTheater =
    targetCategory === 'hall' ||
    targetCategory === 'theater' ||
    targetType.includes('meeting') ||
    targetType.includes('hall') ||
    targetType.includes('theater') ||
    targetType.includes('auditorium');

  const isHallOrTheaterDaily = (targetCategory === 'hall' || targetCategory === 'theater') && planType === 'daily';

  if (isMeetingOrTheater && (planType === 'hourly' || isHallOrTheaterDaily)) {
    const effectiveBookingHours = isHallOrTheaterDaily ? 2 : durationHours;
    if (includedMeetingHours > 0) {
      const userRemainingHours = typeof user.remainingHours === 'number'
        ? Math.max(0, user.remainingHours)
        : includedMeetingHours;

      if (userRemainingHours > 0) {
        const coveredHours = Math.min(effectiveBookingHours, userRemainingHours);
        const payableHours = Math.max(0, effectiveBookingHours - coveredHours);
        const hourlyRate = space.pricing?.hourly || Math.round((space.pricing?.daily || 300) / 2);
        const payablePrice = isHallOrTheaterDaily
          ? (payableHours === 0 ? 0 : Math.round((payableHours / 2) * (space.pricing?.daily || 150) * effectiveSeats))
          : payableHours * hourlyRate * effectiveSeats;

        if (payableHours === 0) {
          return {
            isCovered: true,
            isPartiallyCovered: false,
            effectivePrice: 0,
            originalPrice: fullOriginalTotal,
            badgeLabel: 'Included in your Pass Quota',
            displayPriceLabel: 'Included in your Pass Quota',
            totalPayableLabel: 'SAR 0 to Pay',
            hasDiscount: true,
            discountPercentage: 100,
            coveredSeats: effectiveSeats,
            payableSeats: 0,
            coveredHours,
            payableHours: 0,
            coverageNote: `Covered by ${planDisplayName} quota (${userRemainingHours}h available)`,
          };
        } else {
          return {
            isCovered: false,
            isPartiallyCovered: true,
            effectivePrice: payablePrice,
            originalPrice: fullOriginalTotal,
            badgeLabel: `${coveredHours}h Free · SAR ${payablePrice.toLocaleString()} to Pay`,
            displayPriceLabel: `${coveredHours}h Free · SAR ${payablePrice.toLocaleString()}`,
            totalPayableLabel: `SAR ${payablePrice.toLocaleString()} to Pay`,
            hasDiscount: true,
            discountPercentage: Math.round(((fullOriginalTotal - payablePrice) / fullOriginalTotal) * 100),
            coveredSeats: effectiveSeats,
            payableSeats: 0,
            coveredHours,
            payableHours,
            coverageNote: `${coveredHours}h covered by pass, ${payableHours} extra hour(s) charged`,
          };
        }
      } else {
        // Remaining hours quota is 0: extra hours charged at regular rate
        const hourlyRate = space.pricing?.hourly || Math.round((space.pricing?.daily || 300) / 2);
        const payablePrice = isHallOrTheaterDaily
          ? fullOriginalTotal
          : durationHours * hourlyRate * effectiveSeats;
        return {
          isCovered: false,
          isPartiallyCovered: false,
          effectivePrice: payablePrice,
          originalPrice: fullOriginalTotal,
          badgeLabel: `SAR ${payablePrice.toLocaleString()}`,
          displayPriceLabel: `SAR ${payablePrice.toLocaleString()}`,
          totalPayableLabel: `SAR ${payablePrice.toLocaleString()} to Pay`,
          hasDiscount: false,
          coveredSeats: 0,
          payableSeats: effectiveSeats,
          coveredHours: 0,
          payableHours: effectiveBookingHours,
          coverageNote: `Monthly plan hours exhausted (0h remaining). Standard rate applies.`,
        };
      }
    } else {
      // Meeting room / theater not included in this plan
      return {
        isCovered: false,
        isPartiallyCovered: false,
        effectivePrice: fullOriginalTotal,
        originalPrice: fullOriginalTotal,
        badgeLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
        displayPriceLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
        totalPayableLabel: `SAR ${fullOriginalTotal.toLocaleString()}`,
        hasDiscount: false,
        coveredSeats: 0,
        payableSeats: effectiveSeats,
        coveredHours: 0,
        payableHours: durationHours,
        coverageNote: `Meeting rooms & theaters not included in ${planDisplayName}`,
      };
    }
  }

  // Not included workspace type or plan duration
  if (!isTypeIncluded || !isPlanDurationAllowed) {
    return {
      isCovered: false,
      isPartiallyCovered: false,
      effectivePrice: fullOriginalTotal,
      originalPrice: fullOriginalTotal,
      badgeLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
      displayPriceLabel: `SAR ${singleOriginalPrice.toLocaleString()}`,
      totalPayableLabel: `SAR ${fullOriginalTotal.toLocaleString()}`,
      hasDiscount: false,
      coveredSeats: 0,
      payableSeats: effectiveSeats,
      coveredHours: 0,
      payableHours: durationHours,
      coverageNote: `Not included in ${planDisplayName}`,
    };
  }

  // Special case: Single-day Day Pass booking multiple daily days
  if (isDayPass && planType === 'daily' && durationDays > 1) {
    const dailyRate = space.pricing?.daily ?? 150;
    const coveredAmount = dailyRate * 1; // 1 day covered for 1 seat
    const payablePrice = Math.max(0, fullOriginalTotal - coveredAmount);
    const payableDays = durationDays - 1;
    return {
      isCovered: false,
      isPartiallyCovered: true,
      effectivePrice: payablePrice,
      originalPrice: fullOriginalTotal,
      badgeLabel: `1 Day Included in Pass · SAR ${payablePrice.toLocaleString()} to Pay`,
      displayPriceLabel: `1 Day Included in Pass`,
      totalPayableLabel: `SAR ${payablePrice.toLocaleString()} to Pay`,
      hasDiscount: true,
      discountPercentage: Math.round(((fullOriginalTotal - payablePrice) / fullOriginalTotal) * 100),
      coveredSeats: Math.min(1, effectiveSeats),
      payableSeats: Math.max(0, effectiveSeats - 1),
      coveredHours: durationHours,
      payableHours: 0,
      coverageNote: `1 day included in Day Pass, ${payableDays} day${payableDays > 1 ? 's' : ''} payable`,
    };
  }

  // Evaluate seat coverage
  const coveredSeats = Math.min(effectiveSeats, maxCoveredSeats);
  const payableSeats = Math.max(0, effectiveSeats - coveredSeats);
  const effectivePrice = payableSeats * singleOriginalPrice;

  if (payableSeats === 0) {
    // 100% Fully Covered
    return {
      isCovered: true,
      isPartiallyCovered: false,
      effectivePrice: 0,
      originalPrice: fullOriginalTotal,
      badgeLabel: 'Included in your Plan',
      displayPriceLabel: 'Included in your Plan',
      totalPayableLabel: 'SAR 0 to Pay',
      hasDiscount: true,
      discountPercentage: 100,
      coveredSeats,
      payableSeats: 0,
      coveredHours: durationHours,
      payableHours: 0,
      coverageNote: `Covered by ${planDisplayName}`,
    };
  }

  // Partially Covered (e.g. 1 seat covered by individual pass, 2 extra seats payable)
  return {
    isCovered: false,
    isPartiallyCovered: true,
    effectivePrice,
    originalPrice: fullOriginalTotal,
    badgeLabel: `${coveredSeats} Seat${coveredSeats > 1 ? 's' : ''} Included in Plan · SAR ${effectivePrice.toLocaleString()} to Pay`,
    displayPriceLabel: `${coveredSeats} Seat${coveredSeats > 1 ? 's' : ''} Included in Plan`,
    totalPayableLabel: `SAR ${effectivePrice.toLocaleString()} to Pay`,
    hasDiscount: true,
    discountPercentage: Math.round(((fullOriginalTotal - effectivePrice) / fullOriginalTotal) * 100),
    coveredSeats,
    payableSeats,
    coveredHours: durationHours,
    payableHours: 0,
    coverageNote: `${coveredSeats} seat included in pass, ${payableSeats} seat${payableSeats > 1 ? 's' : ''} payable`,
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
  category?: SpaceCategory;
  type: BookingType;
  plan: BookingPlan;

  // Time & Duration for Hourly Reservations (Halls & Theaters only)
  startTime?: string;
  endTime?: string;
  durationHours?: number;

  // Duration for Monthly Reservations (Multi-month: 1, 2, 3, 6, 12)
  durationMonths?: number;

  // Duration for Daily Reservations (in days: Start Date to End Date)
  durationDays?: number;
  durationDetails?: string;

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
  paidWithPass?: boolean;
  coveredHours?: number;
  payableHours?: number;
}

export type AmenityRequestStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface AmenityRequest {
  id: string;
  amenityName: string;
  providerId: string;
  providerName: string;
  spaceId?: string;
  spaceName?: string;
  status: AmenityRequestStatus;
  createdAt: string;
  rejectionReason?: string;
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
  durationDays?: number;
  startDate: string;
  endDate: string;
  seats: number;
  employees?: string[];
  pricePerSeat: number;
  itemTotal: number;
  notes?: string;
}

export function getBookingPrice(b: Booking, spaces: Space[] = []): number {
  const space = spaces.find(s => s.id === b.spaceId || (s.name && b.spaceName && s.name.toLowerCase() === b.spaceName.toLowerCase()));
  const seats = b.seats || 1;

  if (typeof b.totalPrice === 'number' && !isNaN(b.totalPrice)) {
    if (b.totalPrice === 0 || b.paidWithPass) {
      return 0;
    }
    const dailyRate = space?.pricing?.daily || 140;
    // Guard against monthly bookings having an erroneous daily rate (e.g. <= 300 SAR)
    if (b.plan === 'monthly' && b.totalPrice <= Math.max(dailyRate, 300)) {
      const months = b.durationMonths || 1;
      const mPrice = space ? getMonthlyPriceForDuration(space, months) : 1700 * months;
      return mPrice * seats;
    }
    // Guard against yearly bookings having an erroneous daily or monthly rate
    if (b.plan === 'yearly' && b.totalPrice <= Math.max(dailyRate * 5, 2000)) {
      const yPrice = space?.pricing?.yearly || (space?.pricing?.monthly ? space.pricing.monthly * 10 : 17000);
      return yPrice * seats;
    }
    return b.totalPrice;
  }

  if (!space) {
    if (b.plan === 'monthly') return 1700 * (b.durationMonths || 1) * seats;
    if (b.plan === 'yearly') return 17000 * seats;
    if (b.plan === 'hourly') return 45 * (b.durationHours || 1) * seats;
    const days = b.durationDays || calculateDailyDurationDays(b.startDate, b.endDate);
    return 140 * seats * days;
  }

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
  const days = b.durationDays || calculateDailyDurationDays(b.startDate, b.endDate);
  return (space.pricing?.daily || 140) * seats * days;
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
  | 'otp-verify'
  | 'reset-password'
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
  | 'admin-plans'
  | 'admin-subscriptions'
  | 'admin-payments'
  | 'admin-payouts'
  | 'admin-hourly-bookings'
  | 'admin-reports'
  | 'admin-settings'
  | 'admin-loyalty-proposals'
  | 'admin-support'
  | 'provider-dashboard'
  | 'provider-spaces'
  | 'provider-bookings'
  | 'provider-loyalty-proposals'
  | 'provider-profile'
  | 'provider-settings'
  | 'notifications'
  | 'cart'
  | 'loyalty'
  | 'privacy-policy'
  | 'terms-of-service'
  | 'legal';

export type TicketCategory = 'general' | 'complaint' | 'refund';
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userName: string;
  userEmail: string;
  userId?: string;
  category: TicketCategory;
  subject: string;
  message: string;
  attachedImage?: string;
  attachedFileName?: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
  adminReply?: string;
  bookingId?: string;
}

export interface OtpSession {
  user: User;
  targetEmailOrPhone: string;
  mode: 'login' | 'signup' | 'forgot-password';
  role?: UserRole;
  extraData?: Partial<User>;
  destinationScreen?: Screen;
  destinationParams?: Record<string, any>;
  userId?: string;
  token?: string;
  backendSynced?: boolean;
  devOtp?: string;
}

export interface NavState {
  screen: Screen;
  params: Record<string, any>;
}

export interface Partner {
  id: string;
  brandName: string;
  contactEmail: string;
  taxNumber: string;
  revenueSharePercentage: number;
  workspaces?: any[];
  payouts?: any[];
  createdAt?: string;
}

export interface WorkspaceApi {
  id: string;
  partnerId: string;
  name: string;
  city: string;
  locationMapUrl?: string;
  dailyRate?: number;
  monthlyRate?: number;
  yearlyRate?: number;
  passVisitValue: number;
  totalCapacity: number;
  images?: string[];
  amenities?: string[];
  createdAt?: string;
  updatedAt?: string;
  partner?: Partner;
  sections?: any[];
}
export interface HourlyBookingApi {
  id: string;
  userId: string;
  sectionId: string;
  workspaceId?: string;
  packageId: string;
  startDate: string;
  endDate: string;
  hoursUsed: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  user?: { name: string; email: string };
  workspace?: WorkspaceApi;
  section?: any;
  package?: any;
}

export interface PayoutApi {
  id: string;
  partnerId: string;
  billingMonth: string;
  totalVisitsReceived: number;
  amountDue: number;
  status: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
  partner?: Partner;
}

export interface MembershipPlanApi {
  id: string;
  planName: string;
  type: string;
  totalVisitsAllowed: number;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionApi {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: string;
  visitsUsed?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: { name: string; email: string };
  plan?: MembershipPlanApi;
}

export interface DirectBookingApi {
  id: string;
  userId: string;
  workspaceId: string;
  sectionId: string;
  durationType: string;
  durationDetails?: string;
  bookingDate: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  user?: { name: string; email: string };
  workspace?: WorkspaceApi;
  section?: any;
}

export interface PaymentApi {
  id: string;
  userId: string;
  workspaceId?: string;
  amount: number;
  method: string;
  paymentFor: string;
  referenceId?: string;
  status: string;
  gatewayTransactionId?: string;
  createdAt?: string;
  user?: { name: string; email: string };
  workspace?: { id: string; name: string; city: string };
}

export type LoyaltyRuleType = 'EARNING' | 'REDEMPTION';
export type ApprovalStatus = 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export interface LoyaltyRule {
  id: string;
  ruleName: string;
  ruleType: LoyaltyRuleType;
  pointsValue: number;
  monetaryValue: number;
  description?: string;
  status: ApprovalStatus;
  proposedBy: string;
  proposerName?: string;
  proposerEmail?: string;
  approvedBy?: string;
  approverName?: string;
  isActive: boolean;
  workspaceId?: string;
  workspaceName?: string;
  bonusMultiplier?: number;
  adminFeedback?: string;
  createdAt: string;
  updatedAt?: string;
  proposer?: { name: string; email: string };
  approver?: { name: string; email: string };
}

export interface LoyaltyProposalForm {
  ruleName: string;
  ruleType: LoyaltyRuleType;
  pointsValue: number;
  monetaryValue: number;
  description: string;
  workspaceId?: string;
  bonusMultiplier?: number;
}

/**
 * Validates a Saudi Commercial Registration (CR) number.
 * Must be exactly 10 digits starting with standard Saudi chamber/city codes (e.g., 1010 for Riyadh, 4030 for Jeddah, etc.).
 */
export function isValidSaudiCrNumber(cr: string): boolean {
  if (!cr) return false;
  const clean = cr.trim();
  return /^(1010|1011|2050|2051|2052|2053|2055|2251|2252|3350|3351|3400|3450|3452|3550|4030|4031|4032|4650|4700|5850|5851|5900|5950|[1-5]\d{3})\d{6}$/.test(clean);
}
