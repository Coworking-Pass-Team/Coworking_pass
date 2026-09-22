'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Space,
  SpaceType,
  Booking,
  Screen,
  NavState,
  UserRole,
  BookingType,
  PaymentCard,
  Notification,
  CartItem,
  AmenityRequest,
  AmenityRequestStatus,
  calculateEndDate,
  calculateDailyDurationDays,
  isCancellationRefundEligible,
  getBookingPrice,
  getEffectiveSpacePrice,
  checkAndRenewPlanHours,
  OtpSession,
  SupportTicket,
  TicketStatus,
  Partner,
  WorkspaceApi,
  HourlyBookingApi,
  PayoutApi,
  MembershipPlanApi,
  SubscriptionApi,
  DirectBookingApi,
  PaymentApi,
  WalletTransaction,
  LoyaltyRule,
  LoyaltyRuleType,
  ApprovalStatus,
  CrowdingLevel,
  SpaceCrowdingInfo,
  calculateSpaceCrowding,
  PassRefundEligibility
} from '@/types/types';
import { INITIAL_SPACES, INITIAL_USERS, INITIAL_BOOKINGS, INITIAL_NOTIFICATIONS, INITIAL_SUPPORT_TICKETS } from '@/data/data';
import {
  registerUserApi,
  verifyEmailApi,
  loginUserApi,
  verifyLoginApi,
  mapRoleToFrontend,
  createCompanyApi,
  createPointsTransactionApi,
  getLoyaltyRulesApi,
  createLoyaltyRuleApi,
  updateLoyaltyRuleApi,
  deleteLoyaltyRuleApi,
  getLoyaltyPointsApi,
  getQrCheckInsApi,
  createQrCheckInApi,
  getCompaniesApi,
  getCompanyApi,
  depositCompanyWalletApi,
  updateCompanyApi,
  createTicketApi,
  createTicketReplyApi,
  getTicketsApi,
  updateTicketStatusApi
} from '@/services/authApi';

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    const cleaned = envUrl.replace(/\/$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }
  return 'https://coworking-pass-k49w.onrender.com/api';
}

export const API_BASE_URL = getApiBaseUrl();

export function mapFrontendTypeToDbSectionType(type: string): 'DESK' | 'MEETING_ROOM' | 'THEATER' {
  const t = (type || '').toLowerCase();
  if (t === 'theater' || t.includes('theater') || t.includes('auditorium')) {
    return 'THEATER';
  }
  if (
    t.includes('hall') ||
    t.includes('meeting') ||
    t.includes('room') ||
    t.includes('majlis') ||
    t.includes('conference') ||
    t.includes('training') ||
    t.includes('workshop') ||
    t.includes('event') ||
    t.includes('lecture')
  ) {
    return 'MEETING_ROOM';
  }
  return 'DESK';
}

export function getStoredToken(): string | undefined {
  return (
    (typeof window !== 'undefined' && (
      localStorage.getItem('cp_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt')
    )) || undefined
  );
}

async function fetchPartnersFromApi(token?: string): Promise<Partner[]> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const storedToken = token || getStoredToken();
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
    const response = await fetch(`${getApiBaseUrl()}/partners`, { method: 'GET', headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as Partner[]) : [];
  } catch (error: any) {
    return [];
  }
}

async function fetchUsersFromApi(token?: string): Promise<any[]> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const storedToken = token || getStoredToken();
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
    const response = await fetch(`${getApiBaseUrl()}/users`, { method: 'GET', headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    return [];
  }
}

async function fetchWorkspacesFromApi(token?: string): Promise<WorkspaceApi[]> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const storedToken = token || getStoredToken();
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
    const response = await fetch(`${getApiBaseUrl()}/workspaces`, { method: 'GET', headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as WorkspaceApi[]) : [];
  } catch (error: any) {
    return [];
  }
}

async function fetchHourlyBookingsFromApi(token?: string): Promise<HourlyBookingApi[]> {
  try {
    const storedToken = token || getStoredToken();
    if (!storedToken) return [];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storedToken}`,
    };
    const response = await fetch(`${getApiBaseUrl()}/hourly-bookings`, { method: 'GET', headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as HourlyBookingApi[]) : [];
  } catch (error: any) {
    return [];
  }
}

async function fetchPayoutsFromApi(token?: string): Promise<PayoutApi[]> {
  try {
    const storedToken = token || getStoredToken();
    if (!storedToken) return [];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storedToken}`,
    };
    const response = await fetch(`${getApiBaseUrl()}/payouts`, { method: 'GET', headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as PayoutApi[]) : [];
  } catch (error: any) {
    return [];
  }
}

async function fetchMembershipPlansFromApi(token?: string): Promise<MembershipPlanApi[]> {
  try {
    const storedToken = token || getStoredToken();
    if (!storedToken) return [];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storedToken}`,
    };
    const response = await fetch(`${getApiBaseUrl()}/membership-plans`, { method: 'GET', headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as MembershipPlanApi[]) : [];
  } catch (error: any) {
    return [];
  }
}

async function fetchSubscriptionsFromApi(token?: string): Promise<SubscriptionApi[]> {
  try {
    const storedToken = token || getStoredToken();
    if (!storedToken) return [];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storedToken}`,
    };
    const response = await fetch(`${getApiBaseUrl()}/subscriptions`, { method: 'GET', headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as SubscriptionApi[]) : [];
  } catch (error: any) {
    return [];
  }
}

async function fetchDirectBookingsFromApi(token?: string): Promise<DirectBookingApi[]> {
  try {
    const storedToken = token || getStoredToken();
    if (!storedToken) return [];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storedToken}`,
    };
    const response = await fetch(`${getApiBaseUrl()}/direct-bookings`, { method: 'GET', headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as DirectBookingApi[]) : [];
  } catch (error: any) {
    return [];
  }
}

async function fetchPaymentsFromApi(token?: string): Promise<PaymentApi[]> {
  try {
    const storedToken = token || getStoredToken();
    if (!storedToken) return [];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storedToken}`,
    };
    const response = await fetch(`${getApiBaseUrl()}/payments`, { method: 'GET', headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as PaymentApi[]) : [];
  } catch (error: any) {
    return [];
  }
}

interface AppContextType {
  nav: NavState;
  navigate: (screen: Screen, params?: Record<string, any>) => void;
  goBack: () => void;

  partners: Partner[];
  fetchPartners: () => Promise<Partner[]>;
  createPartner: (partnerData: {
    brandName: string;
    contactEmail: string;
    taxNumber: string;
    revenueSharePercentage: number;
  }) => Promise<{ success: boolean; partner?: Partner; error?: string }>;
  updatePartner: (
    partnerId: string,
    updates: Partial<{
      brandName: string;
      contactEmail: string;
      taxNumber: string;
      revenueSharePercentage: number;
      status: ApprovalStatus;
      rejectionReason?: string;
    }>
  ) => Promise<{ success: boolean; partner?: Partner; error?: string }>;
  deletePartner: (partnerId: string) => Promise<{ success: boolean; error?: string }>;
  approvePartner: (partnerId: string) => Promise<{ success: boolean; error?: string }>;
  rejectPartner: (partnerId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;

  workspacesApi: WorkspaceApi[];
  fetchWorkspaces: () => Promise<WorkspaceApi[]>;
  createWorkspace: (workspaceData: {
    partnerId: string;
    name: string;
    city: string;
    locationMapUrl?: string;
    dailyRate?: number;
    monthlyRate?: number;
    yearlyRate?: number;
    passVisitValue: number;
    totalCapacity: number;
    amenities?: string[];
    images?: string[];
  }) => Promise<{ success: boolean; workspace?: WorkspaceApi; error?: string }>;
  updateWorkspace: (
    workspaceId: string,
    updates: Partial<{
      partnerId: string;
      name: string;
      city: string;
      locationMapUrl: string;
      dailyRate: number;
      monthlyRate: number;
      yearlyRate: number;
      passVisitValue: number;
      totalCapacity: number;
      amenities: string[];
      images: string[];
    }>
  ) => Promise<{ success: boolean; workspace?: WorkspaceApi; error?: string }>;
  deleteWorkspace: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;

  hourlyBookingsApi: HourlyBookingApi[];
  fetchHourlyBookings: () => Promise<HourlyBookingApi[]>;
  createHourlyBooking: (bookingData: {
    userId: string;
    sectionId: string;
    packageId: string;
    startDate: string;
    endDate: string;
    status?: string;
  }) => Promise<{ success: boolean; booking?: HourlyBookingApi; error?: string }>;
  updateHourlyBooking: (
    bookingId: string,
    updates: Partial<{
      userId: string;
      sectionId: string;
      packageId: string;
      startDate: string;
      endDate: string;
      hoursUsed: number;
      status: string;
    }>
  ) => Promise<{ success: boolean; booking?: HourlyBookingApi; error?: string }>;
  deleteHourlyBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;

  payoutsApi: PayoutApi[];
  fetchPayouts: () => Promise<PayoutApi[]>;
  createPayout: (payoutData: {
    partnerId: string;
    billingMonth: string;
    totalVisitsReceived: number;
    amountDue: number;
    status?: string;
  }) => Promise<{ success: boolean; payout?: PayoutApi; error?: string }>;
  updatePayout: (
    payoutId: string,
    updates: Partial<{
      partnerId: string;
      billingMonth: string;
      totalVisitsReceived: number;
      amountDue: number;
      status: string;
      paidAt: string;
    }>
  ) => Promise<{ success: boolean; payout?: PayoutApi; error?: string }>;
  deletePayout: (payoutId: string) => Promise<{ success: boolean; error?: string }>;

  membershipPlansApi: MembershipPlanApi[];
  fetchMembershipPlans: () => Promise<MembershipPlanApi[]>;
  createMembershipPlan: (planData: {
    planName: string;
    type: string;
    totalVisitsAllowed: number;
    price: number;
  }) => Promise<{ success: boolean; plan?: MembershipPlanApi; error?: string }>;
  updateMembershipPlan: (
    planId: string,
    updates: Partial<{ planName: string; type: string; totalVisitsAllowed: number; price: number }>
  ) => Promise<{ success: boolean; plan?: MembershipPlanApi; error?: string }>;
  deleteMembershipPlan: (planId: string) => Promise<{ success: boolean; error?: string }>;

  subscriptionsApi: SubscriptionApi[];
  fetchSubscriptions: () => Promise<SubscriptionApi[]>;
  createSubscription: (subData: {
    userId: string;
    planId: string;
    startDate: string;
    endDate: string;
    status?: string;
  }) => Promise<{ success: boolean; subscription?: SubscriptionApi; error?: string }>;
  updateSubscription: (
    subscriptionId: string,
    updates: Partial<{ status: string }>
  ) => Promise<{ success: boolean; subscription?: SubscriptionApi; error?: string }>;
  deleteSubscription: (subscriptionId: string) => Promise<{ success: boolean; error?: string }>;
  getPassRefundEligibility: (targetUser?: User) => PassRefundEligibility;
  cancelSubscriptionPass: (targetUser?: User) => Promise<{
    success: boolean;
    refunded: boolean;
    refundAmount: number;
    message: string;
    reasons?: string[];
  }>;

  directBookingsApi: DirectBookingApi[];
  fetchDirectBookings: () => Promise<DirectBookingApi[]>;
  createDirectBooking: (bookingData: {
    userId: string;
    workspaceId: string;
    sectionId: string;
    durationType: string;
    bookingDate: string;
    status?: string;
  }) => Promise<{ success: boolean; booking?: DirectBookingApi; error?: string }>;
  updateDirectBooking: (
    bookingId: string,
    updates: Partial<{ status: string }>
  ) => Promise<{ success: boolean; booking?: DirectBookingApi; error?: string }>;
  deleteDirectBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;

  paymentsApi: PaymentApi[];
  fetchPayments: () => Promise<PaymentApi[]>;
  createPayment: (paymentData: {
    userId: string;
    amount: number;
    method: string;
    paymentFor: string;
    referenceId?: string;
    status?: string;
  }) => Promise<{ success: boolean; payment?: PaymentApi; error?: string }>;
  updatePayment: (
    paymentId: string,
    updates: Partial<{ status: string }>
  ) => Promise<{ success: boolean; payment?: PaymentApi; error?: string }>;
  deletePayment: (paymentId: string) => Promise<{ success: boolean; error?: string }>;

  supportTickets: SupportTicket[];
  fetchTickets: () => Promise<SupportTicket[]>;
  addSupportTicket: (ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'status' | 'priority'> & { status?: TicketStatus; priority?: SupportTicket['priority'] }) => SupportTicket;
  updateTicketStatus: (id: string, status: TicketStatus, notes?: string) => void;
  replyToTicket: (id: string, reply: string, newStatus?: TicketStatus) => void;

  currentUser: User | null;
  otpSession: OtpSession | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requireOtp?: boolean }>;
  signup: (name: string, email: string, password: string, phone: string, role?: UserRole) => User;
  requestSignupOtp: (newUser: User, role: UserRole, extraData?: Partial<User>) => Promise<{ success: boolean; error?: string; message?: string }>;
  requestForgotPasswordOtp: (email: string) => { success: boolean; error?: string };
  resetPassword: (newPassword: string) => { success: boolean; error?: string };
  completeSignup: (role: UserRole, extraData?: Partial<User>) => void;
  verifyOtp: (code: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  resendOtp: () => Promise<void>;
  cancelOtp: () => void;
  startOtpVerification: (session: OtpSession) => void;
  logout: () => void;
  setPendingUser: (user: Partial<User>) => void;
  pendingUser: Partial<User> | null;
  pendingResetUser: User | null;
  updateCurrentUser: (updates: Partial<User>) => void;

  userLocation: { lat: number; lng: number } | null;
  locationStatus: 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable' | 'unsupported';
  locationErrorMessage: string | null;
  requestUserLocation: (force?: boolean) => Promise<{ lat: number; lng: number } | null>;

  spaces: Space[];
  favorites: string[];
  toggleFavorite: (spaceId: string) => void;
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (id: string, updates: Partial<Space>) => void;
  toggleSpaceVisibility: (id: string) => void;
  deleteSpace: (id: string) => void;

  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  cancelBooking: (id: string, refundMethod?: 'wallet' | 'card') => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  deleteBooking: (bookingId: string) => void;

  amenityRequests: AmenityRequest[];
  approvedCustomAmenities: string[];
  requestCustomAmenity: (amenityName: string, spaceId?: string, spaceName?: string) => { success: boolean; message: string; request?: AmenityRequest };
  approveAmenityRequest: (requestId: string) => void;
  rejectAmenityRequest: (requestId: string, reason?: string) => void;
  deleteAmenityRequest: (requestId: string) => void;
  getApprovedAmenities: () => string[];

  notifications: Notification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  toggleNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'read'> & { read?: boolean }) => Notification;
  generateFakeNotification: (presetType?: string, customTitle?: string, customMessage?: string) => Notification;

  users: User[];
  fetchUsers: () => Promise<User[]>;
  blockUser: (id: string) => void;
  unblockUser: (id: string) => void;
  changeUserRole: (id: string, role: UserRole) => void;

  waitlist: Record<string, boolean>;
  autobooking: Record<string, boolean>;
  autobookingCard: Record<string, string>;
  joinWaitlist: (spaceId: string) => void;
  leaveWaitlist: (spaceId: string) => void;
  enableAutoBooking: (spaceId: string, cardId: string) => void;
  disableAutoBooking: (spaceId: string) => void;

  addPaymentCard: (card: Omit<PaymentCard, 'id'>) => PaymentCard;

  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemSeats: (cartItemId: string, seats: number) => void;
  updateCartItem: (cartItemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  checkoutCart: (pointsToUse?: number) => Booking[];

  applyLoyaltyDiscount: (pointsToUse: number) => { discount: number; safePoints: number };

  walletTransactions: WalletTransaction[];
  fetchWallet: (userId?: string) => Promise<{ balance: number; transactions: WalletTransaction[] } | null>;
  depositToWallet: (amount: number, description?: string) => Promise<{ success: boolean; message: string; balance?: number }>;
  withdrawFromWallet: (amount: number, description?: string) => Promise<{ success: boolean; message: string; balance?: number }>;

  companyWalletBalance: number;
  companyData: any | null;
  fetchCompanyWallet: (companyId?: string) => Promise<{ balance: number; company?: any } | null>;
  depositToCompanyWallet: (amount: number, companyId?: string) => Promise<{ success: boolean; message: string; balance?: number }>;

  loyaltyRules: LoyaltyRule[];
  fetchLoyaltyRules: () => Promise<LoyaltyRule[]>;
  createLoyaltyProposal: (proposalData: {
    ruleName: string;
    ruleType: LoyaltyRuleType;
    pointsValue: number;
    monetaryValue: number;
    description?: string;
    workspaceId?: string;
    bonusMultiplier?: number;
  }) => Promise<{ success: boolean; rule?: LoyaltyRule; error?: string }>;
  updateLoyaltyRuleStatus: (
    ruleId: string,
    status: ApprovalStatus,
    notes?: string
  ) => Promise<{ success: boolean; rule?: LoyaltyRule; error?: string }>;
  deleteLoyaltyRule: (ruleId: string) => Promise<{ success: boolean; error?: string }>;

  qrScans: Record<string, number>;
  fetchQrCheckIns: () => Promise<Record<string, number>>;
  recordQrScan: (spaceId: string) => Promise<void>;
  getSpaceCrowding: (space: Space) => SpaceCrowdingInfo;

  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<NavState>({ screen: 'landing', params: {} });
  const [history, setHistory] = useState<NavState[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<Partial<User> | null>(null);
  const [pendingResetUser, setPendingResetUser] = useState<User | null>(null);
  const [otpSession, setOtpSession] = useState<OtpSession | null>(null);
  const [spaces, setSpaces] = useState<Space[]>(() => {
    let customSpaces: Space[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('cp_custom_spaces');
        if (raw) customSpaces = JSON.parse(raw);
      } catch (_) { }
    }
    const seen = new Set<string>();
    const initial: Space[] = [];
    for (const s of [...customSpaces, ...INITIAL_SPACES]) {
      const key = (s.name || '').trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        initial.push(s);
      }
    }
    return initial;
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unavailable' | 'unsupported'>('idle');
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [favorites, setFavorites] = useState<string[]>(['space-1', 'space-3']);
  const [waitlist, setWaitlist] = useState<Record<string, boolean>>({});
  const [autobooking, setAutobooking] = useState<Record<string, boolean>>({});
  const [autobookingCard, setAutobookingCard] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<AppContextType['toast']>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [companyWalletBalance, setCompanyWalletBalance] = useState<number>(0);
  const [companyData, setCompanyData] = useState<any | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [amenityRequests, setAmenityRequests] = useState<AmenityRequest[]>([
    {
      id: 'req-1',
      amenityName: '3D Printing Studio',
      providerId: 'user-p1',
      providerName: 'DeskFlow Workspace Co.',
      spaceId: 'space-1',
      spaceName: 'HubSpot Innovation Center',
      status: 'PENDING_APPROVAL',
      createdAt: '2026-09-06T10:00:00Z',
    },
    {
      id: 'req-2',
      amenityName: 'Podcast Recording Studio',
      providerId: 'user-p1',
      providerName: 'DeskFlow Workspace Co.',
      spaceId: 'space-2',
      spaceName: 'Creative Hive Riyadh',
      status: 'APPROVED',
      createdAt: '2026-09-05T14:30:00Z',
    },
  ]);
  const [approvedCustomAmenities, setApprovedCustomAmenities] = useState<string[]>(['Podcast Recording Studio']);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [partners, setPartners] = useState<Partner[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cp_partners');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (_) { }
      }
    }
    return [];
  });
  const [workspacesApi, setWorkspacesApi] = useState<WorkspaceApi[]>([]);
  const [hourlyBookingsApi, setHourlyBookingsApi] = useState<HourlyBookingApi[]>([]);
  const [payoutsApi, setPayoutsApi] = useState<PayoutApi[]>([]);
  const [membershipPlansApi, setMembershipPlansApi] = useState<MembershipPlanApi[]>([]);
  const [subscriptionsApi, setSubscriptionsApi] = useState<SubscriptionApi[]>([]);
  const [directBookingsApi, setDirectBookingsApi] = useState<DirectBookingApi[]>([]);
  const [paymentsApi, setPaymentsApi] = useState<PaymentApi[]>([]);
  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRule[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cp_loyaltyRules');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        } catch (_) { }
      }
    }
    return [];
  });

  const saveLoyaltyRulesToStorage = (rules: LoyaltyRule[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_loyaltyRules', JSON.stringify(rules));
    }
  };

  useEffect(() => {
    saveLoyaltyRulesToStorage(loyaltyRules);
  }, [loyaltyRules]);

  // QR Code check-in scans tracked per workspace (purely driven by real-time database scans)
  const [qrScans, setQrScans] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cp_qr_scans');
        if (stored) return JSON.parse(stored);
      } catch (_) { }
    }
    return {};
  });

  const fetchQrCheckIns = async (): Promise<Record<string, number>> => {
    try {
      const res = await getQrCheckInsApi();
      if (res.success && Array.isArray(res.data)) {
        const dbCounts: Record<string, number> = {};
        for (const checkIn of res.data) {
          const wId = checkIn.workspaceId || checkIn.workspace?.id;
          if (wId) {
            dbCounts[wId] = (dbCounts[wId] || 0) + 1;
          }
        }
        setQrScans(dbCounts);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('cp_qr_scans', JSON.stringify(dbCounts));
          } catch (_) { }
        }
        return dbCounts;
      }
      return qrScans;
    } catch (err) {
      console.warn('Failed to fetch QR check-ins from database:', err);
      return qrScans;
    }
  };

  useEffect(() => {
    fetchQrCheckIns();
    const interval = setInterval(() => {
      fetchQrCheckIns();
    }, 4000);

    const onFocus = () => fetchQrCheckIns();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, []);

  const recordQrScan = async (spaceId: string) => {
    setQrScans(prev => {
      const next = { ...prev, [spaceId]: (prev[spaceId] || 0) + 1 };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cp_qr_scans', JSON.stringify(next));
        } catch (_) { }
      }
      return next;
    });

    try {
      await createQrCheckInApi({
        userId: currentUser?.id || 'guest',
        workspaceId: spaceId,
        sectionId: `sec-${spaceId}`,
        status: 'VALID',
      });
      fetchQrCheckIns();
    } catch (err) {
      console.warn('Could not persist QR check-in to database:', err);
    }
  };

  const getSpaceCrowding = (space: Space): SpaceCrowdingInfo => {
    const scanned = qrScans[space.id] || 0;
    return calculateSpaceCrowding(space, scanned);
  };

  const fetchLoyaltyRules = async (): Promise<LoyaltyRule[]> => {
    try {
      const res = await getLoyaltyRulesApi();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: LoyaltyRule[] = res.data.map((r: any) => ({
          id: r.id,
          ruleName: r.ruleName,
          ruleType: r.ruleType,
          pointsValue: r.pointsValue,
          monetaryValue: r.monetaryValue,
          description: r.description,
          status: r.status,
          proposedBy: r.proposedBy,
          proposerName: r.proposer?.name || 'Space Partner',
          proposerEmail: r.proposer?.email,
          approvedBy: r.approvedBy,
          approverName: r.approver?.name,
          isActive: r.isActive,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        }));
        setLoyaltyRules(mapped);
        return mapped;
      }
      return loyaltyRules;
    } catch (err) {
      console.error('Failed to fetch loyalty rules:', err);
      return loyaltyRules;
    }
  };

  const createLoyaltyProposal = async (proposalData: {
    ruleName: string;
    ruleType: LoyaltyRuleType;
    pointsValue: number;
    monetaryValue: number;
    description?: string;
    workspaceId?: string;
    bonusMultiplier?: number;
  }): Promise<{ success: boolean; rule?: LoyaltyRule; error?: string }> => {
    try {
      const proposerId = currentUser?.id || 'user-p1';
      const tempId = `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newRule: LoyaltyRule = {
        id: tempId,
        ruleName: proposalData.ruleName.trim(),
        ruleType: proposalData.ruleType,
        pointsValue: Number(proposalData.pointsValue),
        monetaryValue: Number(proposalData.monetaryValue),
        description: proposalData.description?.trim(),
        status: 'PENDING_APPROVAL',
        proposedBy: proposerId,
        proposerName: currentUser?.businessName || currentUser?.name || 'Space Partner',
        proposerEmail: currentUser?.email,
        isActive: false,
        workspaceId: proposalData.workspaceId,
        bonusMultiplier: proposalData.bonusMultiplier,
        createdAt: new Date().toISOString(),
      };

      setLoyaltyRules((prev) => [newRule, ...prev]);

      const apiRes = await createLoyaltyRuleApi({
        ruleName: newRule.ruleName,
        ruleType: newRule.ruleType,
        pointsValue: newRule.pointsValue,
        monetaryValue: newRule.monetaryValue,
        description: newRule.description,
        proposedBy: proposerId,
        status: 'PENDING_APPROVAL',
      });

      if (apiRes.success && apiRes.data?.id) {
        const savedRule: LoyaltyRule = {
          ...newRule,
          id: apiRes.data.id,
          proposedBy: apiRes.data.proposedBy || proposerId,
          proposerName: apiRes.data.proposer?.name || newRule.proposerName,
          proposerEmail: apiRes.data.proposer?.email || newRule.proposerEmail,
          status: apiRes.data.status || 'PENDING_APPROVAL',
          createdAt: apiRes.data.createdAt ? new Date(apiRes.data.createdAt).toISOString() : newRule.createdAt,
        };
        setLoyaltyRules((prev) => [savedRule, ...prev.filter((r) => r.id !== tempId && r.id !== savedRule.id)]);
        showToast('Loyalty proposal submitted for Admin review!', 'success');
        return { success: true, rule: savedRule };
      }

      showToast('Loyalty proposal submitted for Admin review!', 'success');
      return { success: true, rule: newRule };
    } catch (err: any) {
      console.error('Error creating loyalty proposal:', err);
      showToast(err.message || 'Failed to submit proposal', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateLoyaltyRuleStatus = async (
    ruleId: string,
    status: ApprovalStatus,
    notes?: string
  ): Promise<{ success: boolean; rule?: LoyaltyRule; error?: string }> => {
    try {
      const approverId = currentUser?.id || 'admin-1';
      const approverName = currentUser?.name || 'Super Admin';

      setLoyaltyRules((prev) =>
        prev.map((r) =>
          r.id === ruleId
            ? {
              ...r,
              status,
              approvedBy: approverId,
              approverName,
              isActive: status === 'APPROVED',
              adminFeedback: notes || r.adminFeedback,
            }
            : r
        )
      );

      const apiRes = await updateLoyaltyRuleApi(ruleId, {
        status,
        approvedBy: approverId,
        isActive: status === 'APPROVED',
        adminFeedback: notes,
      });

      if (apiRes.success && apiRes.data) {
        const updated = apiRes.data;
        setLoyaltyRules((prev) =>
          prev.map((r) =>
            r.id === ruleId
              ? {
                ...r,
                status: updated.status || status,
                approvedBy: updated.approvedBy || approverId,
                approverName: updated.approver?.name || approverName,
                isActive: updated.isActive !== undefined ? updated.isActive : (status === 'APPROVED'),
                adminFeedback: notes || r.adminFeedback,
              }
              : r
          )
        );
      }

      showToast(`Loyalty rule ${status === 'APPROVED' ? 'approved & activated' : 'rejected'}`, status === 'APPROVED' ? 'success' : 'info');
      return { success: true };
    } catch (err: any) {
      console.error('Error updating loyalty rule status:', err);
      showToast(err.message || 'Failed to update rule status', 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteLoyaltyRule = async (ruleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoyaltyRules((prev) => prev.filter((r) => r.id !== ruleId));
      await deleteLoyaltyRuleApi(ruleId);
      showToast('Loyalty proposal removed', 'info');
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting loyalty rule:', err);
      return { success: false, error: err.message };
    }
  };

  const fetchMembershipPlans = async (): Promise<MembershipPlanApi[]> => {
    try {
      const data = await fetchMembershipPlansFromApi();
      if (Array.isArray(data)) setMembershipPlansApi(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch membership plans:', err);
      return membershipPlansApi;
    }
  };

  const createMembershipPlan = async (planData: {
    planName: string;
    type: string;
    totalVisitsAllowed: number;
    price: number;
  }): Promise<{ success: boolean; plan?: MembershipPlanApi; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/membership-plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(planData),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to create membership plan');
      const newPlan: MembershipPlanApi = resData;
      setMembershipPlansApi((prev) => [newPlan, ...prev]);
      showToast('Membership plan created successfully', 'success');
      return { success: true, plan: newPlan };
    } catch (err: any) {
      showToast(err.message || 'Failed to create membership plan', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateMembershipPlan = async (
    planId: string,
    updates: Partial<{ planName: string; type: string; totalVisitsAllowed: number; price: number }>
  ): Promise<{ success: boolean; plan?: MembershipPlanApi; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/membership-plans/${planId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to update membership plan');
      const updatedPlan: MembershipPlanApi = resData;
      setMembershipPlansApi((prev) => prev.map((p) => (p.id === planId ? updatedPlan : p)));
      showToast('Membership plan updated successfully', 'success');
      return { success: true, plan: updatedPlan };
    } catch (err: any) {
      showToast(err.message || 'Failed to update membership plan', 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteMembershipPlan = async (planId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/membership-plans/${planId}`, {
        method: 'DELETE',
        headers,
      });
      const resData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resData.error || 'Failed to delete membership plan');
      setMembershipPlansApi((prev) => prev.filter((p) => p.id !== planId));
      showToast('Membership plan deleted successfully', 'success');
      return { success: true };
    } catch (err: any) {
      showToast(err.message || 'Failed to delete membership plan', 'error');
      return { success: false, error: err.message };
    }
  };

  const fetchSubscriptions = async (): Promise<SubscriptionApi[]> => {
    try {
      const data = await fetchSubscriptionsFromApi();
      if (Array.isArray(data)) setSubscriptionsApi(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      return subscriptionsApi;
    }
  };

  const createSubscription = async (subData: {
    userId: string;
    planId: string;
    startDate: string;
    endDate: string;
    status?: string;
  }): Promise<{ success: boolean; subscription?: SubscriptionApi; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/subscriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(subData),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to create subscription');
      const newSub: SubscriptionApi = resData;
      setSubscriptionsApi((prev) => [newSub, ...prev]);
      showToast('Subscription created successfully', 'success');
      return { success: true, subscription: newSub };
    } catch (err: any) {
      showToast(err.message || 'Failed to create subscription', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateSubscription = async (
    subscriptionId: string,
    updates: Partial<{ status: string }>
  ): Promise<{ success: boolean; subscription?: SubscriptionApi; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to update subscription');
      const updatedSub: SubscriptionApi = resData;
      setSubscriptionsApi((prev) => prev.map((s) => (s.id === subscriptionId ? updatedSub : s)));
      showToast('Subscription updated successfully', 'success');
      return { success: true, subscription: updatedSub };
    } catch (err: any) {
      showToast(err.message || 'Failed to update subscription', 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteSubscription = async (subscriptionId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers,
      });
      const resData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resData.error || 'Failed to delete subscription');
      setSubscriptionsApi((prev) => prev.filter((s) => s.id !== subscriptionId));
      showToast('Subscription deleted successfully', 'success');
      return { success: true };
    } catch (err: any) {
      showToast(err.message || 'Failed to delete subscription', 'error');
      return { success: false, error: err.message };
    }
  };

  const getPassRefundEligibility = (targetUser?: User): PassRefundEligibility => {
    const u = targetUser || currentUser;
    if (!u || !u.hasActivePass) {
      return {
        isEligible: false,
        isWithin3Days: false,
        isUsed: false,
        hoursPassed: 0,
        daysPassed: 0,
        hoursRemainingInWindow: 0,
        refundAmount: 0,
        usedReasons: ['No active subscription pass found.'],
        ineligibleReasons: ['No active subscription pass found.'],
      };
    }

    // 1. Purchase Date & 3-Day Window Check
    const storedUserId = typeof window !== 'undefined' ? (localStorage.getItem('cp_userId') || u.id) : u.id;
    const activeSub = subscriptionsApi.find(s => (s.userId === u.id || s.userId === storedUserId) && s.status === 'ACTIVE');
    const purchaseDateStr = u.passPurchaseDate || u.planCycleStart || activeSub?.startDate || activeSub?.createdAt;

    let isWithin3Days = true;
    let hoursPassed = 0;
    let daysPassed = 0;
    let hoursRemainingInWindow = 72;

    if (purchaseDateStr) {
      const purchaseTime = new Date(purchaseDateStr).getTime();
      if (!isNaN(purchaseTime)) {
        const diffMs = Math.max(0, Date.now() - purchaseTime);
        hoursPassed = Math.floor(diffMs / (1000 * 60 * 60));
        daysPassed = parseFloat((diffMs / (1000 * 60 * 60 * 24)).toFixed(1));
        hoursRemainingInWindow = Math.max(0, 72 - hoursPassed);
        // Strict 3 calendar days / 72 hours from purchase
        isWithin3Days = diffMs <= 3 * 24 * 60 * 60 * 1000;
      }
    }

    // 2. Pass Usage Check
    const usedReasons: string[] = [];

    // Check explicit flag
    if (u.passUsed) {
      usedReasons.push('Pass is marked as used for workspace bookings.');
    }

    // Check if remaining hours were deducted from total plan hours
    if (
      typeof u.totalPlanHours === 'number' &&
      u.totalPlanHours > 0 &&
      typeof u.remainingHours === 'number' &&
      u.remainingHours < u.totalPlanHours
    ) {
      const hoursConsumed = u.totalPlanHours - u.remainingHours;
      usedReasons.push(`${hoursConsumed} hour${hoursConsumed > 1 ? 's' : ''} consumed from pass quota (${u.remainingHours}/${u.totalPlanHours} hrs remaining).`);
    }

    // Check backend subscription visitsUsed
    if (activeSub && typeof activeSub.visitsUsed === 'number' && activeSub.visitsUsed > 0) {
      usedReasons.push(`${activeSub.visitsUsed} workspace visit${activeSub.visitsUsed > 1 ? 's' : ''} registered.`);
    }

    // Check user bookings
    const purchaseTimeForBookings = purchaseDateStr ? new Date(purchaseDateStr).getTime() : 0;
    const userActiveBookings = bookings.filter(b => b.userId === u.id && b.status !== 'cancelled');
    const passBookings = userActiveBookings.filter(b => {
      if (b.paidWithPass) return true;
      if (typeof b.coveredHours === 'number' && b.coveredHours > 0) return true;
      const bTime = new Date(b.createdAt || b.startDate).getTime();
      const isPostPurchase = !purchaseTimeForBookings || isNaN(purchaseTimeForBookings) || bTime >= purchaseTimeForBookings - 60000;
      if (isPostPurchase && (b.plan === 'daily' || b.plan === 'monthly' || b.plan === 'yearly')) return true;
      if (isPostPurchase && b.totalPrice === 0) return true;
      return false;
    });

    if (passBookings.length > 0) {
      usedReasons.push(`${passBookings.length} workspace reservation${passBookings.length > 1 ? 's' : ''} booked using this pass.`);
    }

    const isUsed = usedReasons.length > 0;

    // 3. Ineligibility reasons
    const ineligibleReasons: string[] = [];
    if (!isWithin3Days) {
      ineligibleReasons.push(`Cancellation is outside the 3-day refund window (${daysPassed} days / ${hoursPassed} hours elapsed).`);
    }
    if (isUsed) {
      ineligibleReasons.push(`Pass has already been used for workspace services (${usedReasons.join(' · ')}).`);
    }

    const isEligible = isWithin3Days && !isUsed;

    // 4. Calculate refund amount
    let refundAmount = 0;
    if (isEligible) {
      if (typeof u.passPricePaid === 'number' && u.passPricePaid > 0) {
        refundAmount = u.passPricePaid;
      } else {
        const tier = (u.membershipTier || '').toLowerCase();
        if (tier.includes('year') || tier.includes('annual')) {
          refundAmount = 17000;
        } else if (tier.includes('month') || tier.includes('pro') || tier.includes('all-access')) {
          refundAmount = 1700;
        } else if (tier.includes('day') || tier.includes('daily')) {
          refundAmount = 150;
        } else if (tier.includes('team') || tier.includes('corp')) {
          refundAmount = 4500;
        } else {
          refundAmount = 1700;
        }
      }
    }

    return {
      isEligible,
      isWithin3Days,
      isUsed,
      hoursPassed,
      daysPassed,
      hoursRemainingInWindow,
      refundAmount,
      usedReasons,
      ineligibleReasons,
    };
  };

  const cancelSubscriptionPass = async (targetUser?: User): Promise<{
    success: boolean;
    refunded: boolean;
    refundAmount: number;
    message: string;
    reasons?: string[];
  }> => {
    const u = targetUser || currentUser;
    if (!u) {
      return { success: false, refunded: false, refundAmount: 0, message: 'User is not logged in' };
    }

    // 1. Run strict refund eligibility check
    const eligibility = getPassRefundEligibility(u);

    // 2. Update backend subscription status to CANCELLED
    try {
      const storedToken = getStoredToken();
      const storedUserId = typeof window !== 'undefined' ? (localStorage.getItem('cp_userId') || u.id) : u.id;

      let subIdToCancel: string | null = null;
      const subInState = subscriptionsApi.find(s => (s.userId === u.id || s.userId === storedUserId) && s.status === 'ACTIVE');
      if (subInState) {
        subIdToCancel = subInState.id;
      } else {
        const activeSubs = await fetchSubscriptionsFromApi(storedToken);
        const match = activeSubs.find(s => (s.userId === u.id || s.userId === storedUserId) && s.status === 'ACTIVE');
        if (match) subIdToCancel = match.id;
      }

      if (subIdToCancel) {
        await updateSubscription(subIdToCancel, { status: 'CANCELLED' });
      }
    } catch (dbErr) {
      console.warn('[DB Subscription Cancellation Notice]', dbErr);
    }

    // 3. Process refund to wallet if strictly eligible
    const currentWallet = u.walletBalance || 0;
    let newWalletBalance = currentWallet;

    if (eligibility.isEligible && eligibility.refundAmount > 0) {
      newWalletBalance = currentWallet + eligibility.refundAmount;

      // Sync refund to backend wallet endpoint
      try {
        const storedToken = getStoredToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

        const walletRes = await fetch(`${getApiBaseUrl()}/wallet`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userId: u.id,
            amount: eligibility.refundAmount,
            type: 'REFUND',
            description: `Pass Subscription Cancellation Refund (${u.membershipTier || 'Pass'})`,
          }),
        });
        if (walletRes.ok) {
          const wData = await walletRes.json();
          if (typeof wData.balance === 'number') {
            newWalletBalance = wData.balance;
          }
        }
      } catch (wErr) {
        console.warn('[Wallet Refund Sync Notice]', wErr);
      }

      // Record wallet transaction
      const refundTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        walletId: u.id,
        userId: u.id,
        amount: eligibility.refundAmount,
        type: 'REFUND',
        description: `Pass Subscription Cancellation Refund (${u.membershipTier || 'Pass'})`,
        balanceAfter: newWalletBalance,
        createdAt: new Date().toISOString(),
      };
      setWalletTransactions(prev => [refundTx, ...prev]);

      // In-app payment notification
      addNotification({
        userId: u.id,
        title: 'Subscription Cancelled & Refunded',
        message: `Your ${u.membershipTier || 'Pass'} has been cancelled within 3 days without usage. SAR ${eligibility.refundAmount.toLocaleString()} was refunded to your wallet.`,
        type: 'payment',
      });

      showToast(`Subscription cancelled. SAR ${eligibility.refundAmount.toLocaleString()} refunded to your wallet!`, 'success');
    } else {
      // In-app notification for non-refundable cancellation
      const reasonSummary = eligibility.ineligibleReasons.length > 0
        ? eligibility.ineligibleReasons.join(' ')
        : 'As per policy, passes are only refundable within 3 days of purchase and if unused.';

      addNotification({
        userId: u.id,
        title: 'Subscription Cancelled (No Refund)',
        message: `Your pass subscription has been cancelled without refund. Reason: ${reasonSummary}`,
        type: 'system',
      });

      showToast('Subscription cancelled without refund as per policy (3-day & zero-usage required).', 'info');
    }

    // 4. Update current user state and localStorage
    const updatedUser: User = {
      ...u,
      hasActivePass: false,
      membershipTier: undefined,
      walletBalance: newWalletBalance,
      remainingHours: 0,
      totalPlanHours: 0,
      passPurchaseDate: undefined,
      passPricePaid: undefined,
      passUsed: false,
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(usr => usr.id === updatedUser.id ? updatedUser : usr));
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
      try {
        const storedUsers = localStorage.getItem('cp_users');
        if (storedUsers) {
          const parsedUsers = JSON.parse(storedUsers) as User[];
          const updatedUsersList = parsedUsers.map(usr => usr.id === updatedUser.id ? updatedUser : usr);
          localStorage.setItem('cp_users', JSON.stringify(updatedUsersList));
        }
      } catch (e) { }
    }

    return {
      success: true,
      refunded: eligibility.isEligible,
      refundAmount: eligibility.refundAmount,
      message: eligibility.isEligible
        ? `Subscription cancelled. SAR ${eligibility.refundAmount.toLocaleString()} refunded to your wallet.`
        : 'Subscription cancelled without refund as per policy.',
      reasons: eligibility.ineligibleReasons,
    };
  };

  const fetchDirectBookings = async (): Promise<DirectBookingApi[]> => {
    try {
      const data = await fetchDirectBookingsFromApi();
      if (Array.isArray(data) && data.length > 0) {
        setDirectBookingsApi(data);
        const dbBookings: Booking[] = data.map((b) => {
          const matchedSpace = spaces.find(s => s.id === b.workspaceId) || spaces.find(s => s.name === b.workspace?.name);
          const rawDuration = (b.durationType || '').toUpperCase();
          const p = rawDuration === 'MONTHLY' ? 'monthly' : rawDuration === 'YEARLY' ? 'yearly' : 'daily';
          const userIdStr = b.userId || (typeof b.user === 'object' && b.user && 'id' in b.user ? (b.user as any).id : '') || '';

          let parsedMonths = 1;
          let parsedDays = 1;
          if (b.durationDetails) {
            const match = b.durationDetails.match(/(\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > 0) {
                if (p === 'monthly') parsedMonths = num;
                if (p === 'daily') parsedDays = num;
              }
            }
          }

          const startD = b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

          let endD = startD;
          if (p === 'monthly') {
            endD = calculateEndDate(startD, 'monthly', parsedMonths);
          } else if (p === 'yearly') {
            endD = calculateEndDate(startD, 'yearly', 1);
          } else if (parsedDays > 1) {
            const d = new Date(startD);
            d.setDate(d.getDate() + (parsedDays - 1));
            endD = d.toISOString().split('T')[0];
          }

          let computedPrice = 0;
          if (p === 'monthly') {
            const mRate = matchedSpace?.pricing?.monthly || (b.workspace as any)?.monthlyRate || (b.section as any)?.monthlyRate || 1700;
            computedPrice = mRate * parsedMonths;
          } else if (p === 'yearly') {
            const yRate = matchedSpace?.pricing?.yearly || (b.workspace as any)?.yearlyRate || (b.section as any)?.yearlyRate || ((b.workspace as any)?.monthlyRate ? (b.workspace as any).monthlyRate * 10 : 17000);
            computedPrice = yRate;
          } else {
            const dRate = matchedSpace?.pricing?.daily || (b.workspace as any)?.dailyRate || (b.section as any)?.dailyRate || 140;
            computedPrice = dRate * parsedDays;
          }

          return {
            id: b.id,
            userId: userIdStr,
            spaceId: b.workspaceId || matchedSpace?.id || 'space-1',
            spaceName: b.workspace?.name || matchedSpace?.name || 'Workspace',
            spaceCity: b.workspace?.city || matchedSpace?.city || 'Riyadh',
            spaceAddress: matchedSpace?.address || b.workspace?.city || 'Riyadh',
            spaceImage: matchedSpace?.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c',
            type: matchedSpace?.type || 'private-office',
            plan: p,
            seats: 1,
            employees: [],
            startDate: startD,
            endDate: endD,
            durationDays: p === 'daily' ? parsedDays : undefined,
            durationMonths: p === 'monthly' ? parsedMonths : undefined,
            durationDetails: b.durationDetails,
            startTime: '09:00',
            endTime: '18:00',
            totalPrice: computedPrice,
            status: b.status === 'CONFIRMED' || b.status === 'ACTIVE' ? 'active' : b.status === 'CANCELLED' ? 'cancelled' : 'previous',
            createdAt: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          };
        });

        setBookings((prev) => {
          const map = new Map(prev.map(item => [item.id, item]));
          dbBookings.forEach(dbItem => {
            const existing = map.get(dbItem.id);
            if (existing) {
              map.set(dbItem.id, {
                ...dbItem,
                totalPrice: (existing.totalPrice && existing.totalPrice > 0 && !(dbItem.plan === 'monthly' && existing.totalPrice <= 300))
                  ? existing.totalPrice
                  : dbItem.totalPrice,
                durationMonths: existing.durationMonths || dbItem.durationMonths,
                durationDays: existing.durationDays || dbItem.durationDays,
                durationHours: existing.durationHours || dbItem.durationHours,
                seats: existing.seats || dbItem.seats,
                employees: existing.employees?.length ? existing.employees : dbItem.employees,
              });
            } else {
              map.set(dbItem.id, dbItem);
            }
          });
          return Array.from(map.values());
        });
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch direct bookings:', err);
      return directBookingsApi;
    }
  };

  const createDirectBooking = async (bookingData: {
    userId: string;
    workspaceId: string;
    sectionId: string;
    durationType: string;
    bookingDate: string;
    status?: string;
  }): Promise<{ success: boolean; booking?: DirectBookingApi; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/direct-bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingData),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to create direct booking');
      const newBooking: DirectBookingApi = resData;
      setDirectBookingsApi((prev) => [newBooking, ...prev]);
      showToast('Direct booking created successfully', 'success');
      return { success: true, booking: newBooking };
    } catch (err: any) {
      showToast(err.message || 'Failed to create direct booking', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateDirectBooking = async (
    bookingId: string,
    updates: Partial<{ status: string }>
  ): Promise<{ success: boolean; booking?: DirectBookingApi; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/direct-bookings/${bookingId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to update direct booking');
      const updatedBooking: DirectBookingApi = resData;
      setDirectBookingsApi((prev) => prev.map((b) => (b.id === bookingId ? updatedBooking : b)));
      showToast('Direct booking updated successfully', 'success');
      return { success: true, booking: updatedBooking };
    } catch (err: any) {
      showToast(err.message || 'Failed to update direct booking', 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteDirectBooking = async (bookingId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/direct-bookings/${bookingId}`, {
        method: 'DELETE',
        headers,
      });
      const resData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resData.error || 'Failed to delete direct booking');
      setDirectBookingsApi((prev) => prev.filter((b) => b.id !== bookingId));
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      showToast('Direct booking deleted successfully', 'success');
      return { success: true };
    } catch (err: any) {
      showToast(err.message || 'Failed to delete direct booking', 'error');
      return { success: false, error: err.message };
    }
  };

  const fetchPayments = async (): Promise<PaymentApi[]> => {
    try {
      const data = await fetchPaymentsFromApi();
      if (Array.isArray(data)) setPaymentsApi(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      return paymentsApi;
    }
  };

  const fetchAmenities = async () => {
    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      const res = await fetch(`${getApiBaseUrl()}/amenities`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const approved = data
            .filter((a: any) => a.status === 'APPROVED' && !a.isDefault)
            .map((a: any) => a.name);
          if (approved.length > 0) {
            setApprovedCustomAmenities((prev) => Array.from(new Set([...prev, ...approved])));
          }

          const requests: AmenityRequest[] = data
            .filter((a: any) => !a.isDefault || a.requestedBy)
            .map((a: any) => ({
              id: a.id,
              amenityName: a.name,
              providerId: a.requestedBy || 'user-p1',
              providerName: 'Workspace Provider',
              status: (a.status || 'PENDING_APPROVAL') as AmenityRequestStatus,
              createdAt: a.createdAt || new Date().toISOString(),
            }));

          if (requests.length > 0) {
            setAmenityRequests((prev) => {
              const map = new Map(prev.map((r) => [r.id, r]));
              requests.forEach((r) => map.set(r.id, r));
              return Array.from(map.values());
            });
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch amenities from /api/amenities:', err);
    }
  };

  const fetchNotifications = async (): Promise<Notification[]> => {
    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      const res = await fetch(`${getApiBaseUrl()}/notifications`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const dbNotifs: Notification[] = data.map((n: any) => ({
            id: n.id,
            userId: n.userId,
            title: n.title,
            message: n.message,
            type: (n.type?.toLowerCase() || 'info') as any,
            read: n.isRead ?? false,
            createdAt: n.sentAt ? new Date(n.sentAt).toLocaleString() : 'Just now',
          }));

          setNotifications((prev) => {
            const map = new Map(prev.map((item) => [item.id, item]));
            dbNotifs.forEach((dbItem) => map.set(dbItem.id, dbItem));
            return Array.from(map.values());
          });
        }
      }
      return notifications;
    } catch (err) {
      console.warn('Failed to fetch notifications from /api/notifications:', err);
      return notifications;
    }
  };

  const createPayment = async (paymentData: {
    userId: string;
    workspaceId?: string;
    amount: number;
    method: string;
    paymentFor: string;
    referenceId?: string;
    status?: string;
  }): Promise<{ success: boolean; payment?: PaymentApi; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to record payment');
      const newPayment: PaymentApi = resData;
      setPaymentsApi((prev) => [newPayment, ...prev]);
      showToast('Payment recorded successfully', 'success');
      return { success: true, payment: newPayment };
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
      return { success: false, error: err.message };
    }
  };

  const updatePayment = async (
    paymentId: string,
    updates: Partial<{ status: string }>
  ): Promise<{ success: boolean; payment?: PaymentApi; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/payments/${paymentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPaymentsApi((prev) => prev.map((p) => (p.id === paymentId ? { ...p, ...updates } : p)));
        return { success: true };
      }
      const updatedPayment: PaymentApi = resData;
      setPaymentsApi((prev) => prev.map((p) => (p.id === paymentId ? updatedPayment : p)));
      showToast('Payment updated successfully', 'success');
      return { success: true, payment: updatedPayment };
    } catch (err: any) {
      setPaymentsApi((prev) => prev.map((p) => (p.id === paymentId ? { ...p, ...updates } : p)));
      return { success: true };
    }
  };

  const deletePayment = async (paymentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
      const response = await fetch(`${getApiBaseUrl()}/payments/${paymentId}`, {
        method: 'DELETE',
        headers,
      });
      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPaymentsApi((prev) => prev.filter((p) => p.id !== paymentId));
        return { success: true };
      }
      setPaymentsApi((prev) => prev.filter((p) => p.id !== paymentId));
      showToast('Payment deleted successfully', 'success');
      return { success: true };
    } catch (err: any) {
      setPaymentsApi((prev) => prev.filter((p) => p.id !== paymentId));
      return { success: true };
    }
  };

  const fetchWallet = async (targetUserId?: string): Promise<{ balance: number; transactions: WalletTransaction[] } | null> => {
    const uid = targetUserId || currentUser?.id;
    if (!uid) return null;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      const response = await fetch(`${getApiBaseUrl()}/wallet?userId=${encodeURIComponent(uid)}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const balance = typeof data.balance === 'number' ? data.balance : 0;
        const txs: WalletTransaction[] = Array.isArray(data.transactions) ? data.transactions : [];

        setWalletTransactions(txs);
        setCurrentUser((prev) => (prev && prev.id === uid ? { ...prev, walletBalance: balance } : prev));
        return { balance, transactions: txs };
      }
    } catch (err) {
      console.warn('Failed to fetch wallet:', err);
    }
    return null;
  };

  const depositToWallet = async (amount: number, description?: string): Promise<{ success: boolean; message: string; balance?: number }> => {
    if (!currentUser) return { success: false, message: 'User is not logged in' };
    if (amount <= 0) return { success: false, message: 'Invalid amount' };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      const response = await fetch(`${getApiBaseUrl()}/wallet`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: currentUser.id,
          amount,
          type: 'DEPOSIT',
          description: description || 'Wallet Top-up',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to top-up wallet');
      }

      setCurrentUser((prev) => (prev ? { ...prev, walletBalance: data.balance } : null));
      const newTx: WalletTransaction = data.transaction || {
        id: `tx-${Date.now()}`,
        walletId: currentUser.id,
        userId: currentUser.id,
        amount,
        type: 'DEPOSIT',
        description: description || 'Wallet Top-up',
        balanceAfter: data.balance,
        createdAt: new Date().toISOString(),
      };
      setWalletTransactions((prev) => [newTx, ...prev]);
      showToast('Wallet topped up successfully', 'success');
      return { success: true, message: data.message || 'Wallet topped up successfully', balance: data.balance };
    } catch (err: any) {
      const msg = err.message || 'An error occurred while topping up wallet';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const withdrawFromWallet = async (amount: number, description?: string): Promise<{ success: boolean; message: string; balance?: number }> => {
    if (!currentUser) return { success: false, message: 'User is not logged in' };
    if (amount <= 0) return { success: false, message: 'Invalid amount' };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedToken = getStoredToken();
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      const response = await fetch(`${getApiBaseUrl()}/wallet`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: currentUser.id,
          amount,
          type: 'WITHDRAW',
          description: description || 'Wallet Withdrawal',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to withdraw from wallet');
      }

      setCurrentUser((prev) => (prev ? { ...prev, walletBalance: data.balance } : null));
      const newTx: WalletTransaction = data.transaction || {
        id: `tx-${Date.now()}`,
        walletId: currentUser.id,
        userId: currentUser.id,
        amount,
        type: 'WITHDRAW',
        description: description || 'Wallet Withdrawal',
        balanceAfter: data.balance,
        createdAt: new Date().toISOString(),
      };
      setWalletTransactions((prev) => [newTx, ...prev]);
      showToast('Wallet debited successfully', 'success');
      return { success: true, message: data.message || 'Wallet debited successfully', balance: data.balance };
    } catch (err: any) {
      const msg = err.message || 'An error occurred while withdrawing';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const fetchCompanyWallet = async (companyId?: string): Promise<{ balance: number; company?: any } | null> => {
    try {
      let targetCompId = companyId || currentUser?.companyId;
      if (!targetCompId) {
        const compRes = await getCompaniesApi();
        if (compRes.success && Array.isArray(compRes.data) && compRes.data.length > 0) {
          const userCompany = compRes.data.find((c: any) => c.hrAdminId === currentUser?.id || c.id === currentUser?.companyId) || compRes.data[0];
          targetCompId = userCompany?.id;
          if (userCompany) {
            const bal = typeof userCompany.balance === 'number' ? userCompany.balance : 0;
            setCompanyWalletBalance(bal);
            setCompanyData(userCompany);
            return { balance: bal, company: userCompany };
          }
        }
      }
      if (targetCompId) {
        const res = await getCompanyApi(targetCompId);
        if (res.success && res.data) {
          const bal = typeof res.data.balance === 'number' ? res.data.balance : 0;
          setCompanyWalletBalance(bal);
          setCompanyData(res.data);
          return { balance: bal, company: res.data };
        }
      }
    } catch (err) {
      console.warn('Failed to fetch company wallet:', err);
    }
    return null;
  };

  const depositToCompanyWallet = async (amount: number, companyId?: string): Promise<{ success: boolean; message: string; balance?: number }> => {
    if (amount <= 0) return { success: false, message: 'Invalid deposit amount' };
    let targetCompId = companyId || currentUser?.companyId || companyData?.id;
    if (!targetCompId) {
      const compRes = await getCompaniesApi();
      if (compRes.success && Array.isArray(compRes.data) && compRes.data.length > 0) {
        const userCompany = compRes.data.find((c: any) => c.hrAdminId === currentUser?.id || c.id === currentUser?.companyId) || compRes.data[0];
        targetCompId = userCompany?.id;
      }
    }
    if (!targetCompId) {
      return { success: false, message: 'Company ID not found' };
    }

    try {
      const res = await depositCompanyWalletApi(targetCompId, amount);
      if (!res.success) {
        throw new Error(res.error || 'Failed to deposit to company wallet');
      }
      const newBal = res.data?.company?.newBalance ?? (companyWalletBalance + amount);
      setCompanyWalletBalance(newBal);
      setCompanyData((prev: any) => prev ? { ...prev, balance: newBal } : { id: targetCompId, balance: newBal });
      showToast(`Successfully deposited SAR ${amount.toLocaleString()} into shared wallet`, 'success');
      return { success: true, message: 'Deposit successful', balance: newBal };
    } catch (err: any) {
      const msg = err.message || 'Error depositing to company wallet';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const fetchTickets = async (): Promise<SupportTicket[]> => {
    try {
      const res = await getTicketsApi();
      if (res.success && Array.isArray(res.data)) {
        const mapped: SupportTicket[] = res.data.map((dbT: any) => {
          const statusLower = (dbT.status || 'OPEN').toLowerCase();
          const validStatus: TicketStatus =
            statusLower === 'in_progress' || statusLower === 'in-progress' || statusLower === 'pending'
              ? 'in-progress'
              : statusLower === 'resolved'
                ? 'resolved'
                : statusLower === 'closed'
                  ? 'closed'
                  : 'open';

          const replies = Array.isArray(dbT.replies) ? dbT.replies : [];
          const lastReplyMessage = replies.length > 0 ? replies[replies.length - 1].message : undefined;

          return {
            id: dbT.id,
            ticketNumber: `TK-${dbT.id.slice(-4).toUpperCase()}`,
            userName: dbT.user?.name || dbT.company?.name || 'User',
            userEmail: dbT.user?.email || dbT.company?.email || 'user@coworkingpass.sa',
            userId: dbT.userId,
            category: 'general',
            subject: dbT.subject || 'Support Ticket',
            message: dbT.subject || '',
            status: validStatus,
            priority: 'medium',
            createdAt: dbT.createdAt ? new Date(dbT.createdAt).toLocaleString() : new Date().toLocaleString(),
            updatedAt: dbT.updatedAt ? new Date(dbT.updatedAt).toLocaleString() : undefined,
            adminReply: lastReplyMessage,
          };
        });
        setSupportTickets(mapped);
        return mapped;
      }
    } catch (err) {
      console.error('Failed to fetch tickets from /api/tickets:', err);
    }
    return supportTickets;
  };

  const fetchUsers = async (): Promise<User[]> => {
    try {
      const data = await fetchUsersFromApi();
      if (Array.isArray(data) && data.length > 0) {
        const mappedUsers: User[] = data.map((u: any) => {
          let role: UserRole = 'individual';
          if (u.role === 'SUPER_ADMIN') role = 'admin';
          else if (u.role === 'PARTNER_ADMIN') role = 'provider';
          else if (u.role === 'HR_ADMIN') role = 'organization';
          else if (u.role === 'INDIVIDUAL') role = 'individual';

          return {
            id: u.id,
            name: u.name || 'User',
            email: u.email,
            password: '',
            role,
            phone: '+966 50 000 0000',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces',
            isBlocked: !!u.isBanned,
            joinDate: '2026-09-21',
            companyId: u.companyId,
            orgName: u.company?.companyName,
          };
        });

        setUsers((prev) => {
          const map = new Map<string, User>();
          prev.forEach((u) => {
            if (u.email) map.set(u.email.toLowerCase(), u);
          });
          mappedUsers.forEach((u) => {
            if (u.email) {
              const existing = map.get(u.email.toLowerCase());
              map.set(u.email.toLowerCase(), {
                ...existing,
                ...u,
                role: existing?.role || u.role,
                isBlocked: existing?.isBlocked !== undefined ? existing.isBlocked : u.isBlocked,
              });
            }
          });
          const merged = Array.from(map.values());
          if (typeof window !== 'undefined') {
            localStorage.setItem('cp_users', JSON.stringify(merged));
          }
          return merged;
        });
      }
      return users;
    } catch (err) {
      console.error('Failed to fetch users from /api/users:', err);
      return users;
    }
  };

  const fetchPartners = async (): Promise<Partner[]> => {
    try {
      const data = await fetchPartnersFromApi();
      if (Array.isArray(data) && data.length > 0) {
        setPartners((prev) => {
          const map = new Map<string, Partner>();
          prev.forEach((p) => {
            const key = p.id || (p.contactEmail ? p.contactEmail.trim().toLowerCase() : '');
            if (key) map.set(key, p);
          });
          data.forEach((p) => {
            const key = p.id || (p.contactEmail ? p.contactEmail.trim().toLowerCase() : '');
            if (key) map.set(key, p);
          });
          const merged = Array.from(map.values());
          if (typeof window !== 'undefined') {
            localStorage.setItem('cp_partners', JSON.stringify(merged));
          }
          return merged;
        });
        return data;
      }
      return partners;
    } catch (err) {
      console.error('Failed to fetch partners from /api/partners:', err);
      return partners;
    }
  };

  const fetchHourlyBookings = async (): Promise<HourlyBookingApi[]> => {
    try {
      const data = await fetchHourlyBookingsFromApi();
      if (Array.isArray(data) && data.length > 0) {
        setHourlyBookingsApi(data);
        const dbBookings: Booking[] = data.map((b) => {
          const ws = b.workspace || b.section?.workspace;
          const matchedSpace = spaces.find(s => s.id === ws?.id || s.id === b.section?.workspaceId) || spaces.find(s => s.name === ws?.name);
          const userIdStr = b.userId || (typeof b.user === 'object' && b.user && 'id' in b.user ? (b.user as any).id : '') || '';
          const hours = b.hoursUsed || b.package?.hoursAmount || 1;
          const hourlyRate = matchedSpace?.pricing?.hourly || 45;
          const computedPrice = b.package?.price || (hourlyRate * hours);

          let startTimeStr = '09:00';
          let endTimeStr = '18:00';
          if (b.startDate) {
            try {
              const d = new Date(b.startDate);
              if (!isNaN(d.getTime())) {
                startTimeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              }
            } catch (e) { }
          }
          if (b.endDate) {
            try {
              const d = new Date(b.endDate);
              if (!isNaN(d.getTime())) {
                endTimeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              }
            } catch (e) { }
          }

          return {
            id: b.id,
            userId: userIdStr,
            spaceId: ws?.id || b.section?.workspaceId || matchedSpace?.id || 'space-1',
            spaceName: ws?.name || matchedSpace?.name || 'Workspace',
            spaceCity: ws?.city || matchedSpace?.city || 'Riyadh',
            spaceAddress: matchedSpace?.address || ws?.city || 'Riyadh',
            spaceImage: (ws?.images && ws.images[0]) || matchedSpace?.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c',
            type: matchedSpace?.type || 'meeting-room',
            plan: 'hourly',
            seats: 1,
            employees: [],
            durationHours: hours,
            bookingHours: hours,
            startDate: b.startDate ? new Date(b.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: b.endDate ? new Date(b.endDate).toISOString().split('T')[0] : (b.startDate ? new Date(b.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
            startTime: startTimeStr,
            endTime: endTimeStr,
            totalPrice: computedPrice,
            status: b.status === 'ACTIVE' || b.status === 'CONFIRMED' ? 'active' : b.status === 'CANCELLED' ? 'cancelled' : 'previous',
            createdAt: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          };
        });

        setBookings((prev) => {
          const map = new Map(prev.map(item => [item.id, item]));
          dbBookings.forEach(dbItem => {
            const existing = map.get(dbItem.id);
            if (existing) {
              map.set(dbItem.id, {
                ...dbItem,
                totalPrice: existing.totalPrice && existing.totalPrice > 0 ? existing.totalPrice : dbItem.totalPrice,
                durationHours: existing.durationHours || dbItem.durationHours,
                seats: existing.seats || dbItem.seats,
              });
            } else {
              map.set(dbItem.id, dbItem);
            }
          });
          return Array.from(map.values());
        });
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch hourly bookings from /api/hourly-bookings:', err);
      return hourlyBookingsApi;
    }
  };

  const createHourlyBooking = async (bookingData: {
    userId: string;
    sectionId: string;
    packageId: string;
    startDate: string;
    endDate: string;
    status?: string;
  }): Promise<{ success: boolean; booking?: HourlyBookingApi; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/hourly-bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingData),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to create hourly booking');
      }

      const newBooking: HourlyBookingApi = resData.booking || resData;
      setHourlyBookingsApi((prev) => [newBooking, ...prev]);
      showToast(`Hourly booking created successfully`, 'success');
      return { success: true, booking: newBooking };
    } catch (err: any) {
      console.error('Error creating hourly booking via POST /api/hourly-bookings:', err);
      showToast(err.message || 'Failed to create hourly booking', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateHourlyBooking = async (
    bookingId: string,
    updates: Partial<{
      userId: string;
      sectionId: string;
      packageId: string;
      startDate: string;
      endDate: string;
      hoursUsed: number;
      status: string;
    }>
  ): Promise<{ success: boolean; booking?: HourlyBookingApi; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/hourly-bookings/${bookingId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update hourly booking');
      }

      const updatedBooking: HourlyBookingApi = resData.booking || resData;
      setHourlyBookingsApi((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...updatedBooking } : b))
      );
      showToast(`Hourly booking updated successfully`, 'success');
      return { success: true, booking: updatedBooking };
    } catch (err: any) {
      console.error(`Error updating hourly booking via PUT /api/hourly-bookings/${bookingId}:`, err);
      showToast(err.message || 'Failed to update hourly booking', 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteHourlyBooking = async (bookingId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/hourly-bookings/${bookingId}`, {
        method: 'DELETE',
        headers,
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to delete hourly booking');
      }

      setHourlyBookingsApi((prev) => prev.filter((b) => b.id !== bookingId));
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      showToast(`Hourly booking cancelled successfully`, 'success');
      return { success: true };
    } catch (err: any) {
      console.error(`Error deleting hourly booking via DELETE /api/hourly-bookings/${bookingId}:`, err);
      showToast(err.message || 'Failed to delete hourly booking', 'error');
      return { success: false, error: err.message };
    }
  };

  const fetchPayouts = async (): Promise<PayoutApi[]> => {
    try {
      const data = await fetchPayoutsFromApi();
      if (Array.isArray(data) && data.length > 0) {
        setPayoutsApi(data);
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch payouts from /api/payouts:', err);
      return payoutsApi;
    }
  };

  const createPayout = async (payoutData: {
    partnerId: string;
    billingMonth: string;
    totalVisitsReceived: number;
    amountDue: number;
    status?: string;
  }): Promise<{ success: boolean; payout?: PayoutApi; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/payouts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payoutData),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to create payout');
      }

      const newPayout: PayoutApi = resData.payout || resData;
      setPayoutsApi((prev) => [newPayout, ...prev]);
      showToast(`Payout created successfully`, 'success');
      return { success: true, payout: newPayout };
    } catch (err: any) {
      console.error('Error creating payout via POST /api/payouts:', err);
      showToast(err.message || 'Failed to create payout', 'error');
      return { success: false, error: err.message };
    }
  };

  const updatePayout = async (
    payoutId: string,
    updates: Partial<{
      partnerId: string;
      billingMonth: string;
      totalVisitsReceived: number;
      amountDue: number;
      status: string;
      paidAt: string;
    }>
  ): Promise<{ success: boolean; payout?: PayoutApi; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/payouts/${payoutId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update payout');
      }

      const updatedPayout: PayoutApi = resData.payout || resData;
      setPayoutsApi((prev) =>
        prev.map((p) => (p.id === payoutId ? { ...p, ...updatedPayout } : p))
      );
      showToast(`Payout updated successfully`, 'success');
      return { success: true, payout: updatedPayout };
    } catch (err: any) {
      console.error(`Error updating payout via PUT /api/payouts/${payoutId}:`, err);
      showToast(err.message || 'Failed to update payout', 'error');
      return { success: false, error: err.message };
    }
  };

  const deletePayout = async (payoutId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/payouts/${payoutId}`, {
        method: 'DELETE',
        headers,
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to delete payout');
      }

      setPayoutsApi((prev) => prev.filter((p) => p.id !== payoutId));
      showToast(`Payout deleted successfully`, 'success');
      return { success: true };
    } catch (err: any) {
      console.error(`Error deleting payout via DELETE /api/payouts/${payoutId}:`, err);
      showToast(err.message || 'Failed to delete payout', 'error');
      return { success: false, error: err.message };
    }
  };

  const fetchWorkspaces = async (): Promise<WorkspaceApi[]> => {
    try {
      const data = await fetchWorkspacesFromApi();
      if (Array.isArray(data) && data.length > 0) {
        setWorkspacesApi(data);
        const userEmail = currentUser?.email?.toLowerCase();
        const userPartner = partners.find(p => p.contactEmail?.toLowerCase() === userEmail);
        const userPartnerId = userPartner?.id;

        let savedTypes: Record<string, string> = {};
        let savedAmenities: Record<string, string[]> = {};
        let savedCustomSpaceNames = new Set<string>();
        let savedCustomSpaceIds = new Set<string>();
        if (typeof window !== 'undefined') {
          try {
            const rawMap = localStorage.getItem('cp_space_types');
            if (rawMap) savedTypes = JSON.parse(rawMap);
            const rawAmenityMap = localStorage.getItem('cp_space_amenities');
            if (rawAmenityMap) savedAmenities = JSON.parse(rawAmenityMap);
            const rawCustom = localStorage.getItem('cp_custom_spaces');
            if (rawCustom) {
              const parsed: Space[] = JSON.parse(rawCustom);
              parsed.forEach(p => {
                savedCustomSpaceIds.add(p.id);
                if (p.name) savedCustomSpaceNames.add(p.name.trim().toLowerCase());
              });
            }
          } catch (_) { }
        }

        const dbSpaces: Space[] = data.map((w) => {
          const isBelongingToCurrentUser = Boolean(currentUser && (
            w.partnerId === currentUser.id ||
            (userPartnerId && w.partnerId === userPartnerId) ||
            (userEmail && w.partner?.contactEmail?.toLowerCase() === userEmail) ||
            savedCustomSpaceIds.has(w.id) ||
            savedCustomSpaceNames.has((w.name || '').trim().toLowerCase())
          ));
          const existing = spaces.find(s => s.id === w.id || s.name.toLowerCase() === w.name.toLowerCase())
            || INITIAL_SPACES.find(s => s.id === w.id || s.name.toLowerCase() === w.name.toLowerCase());

          const nameKey = (w.name || '').trim().toLowerCase();
          const savedType = savedTypes[w.id] || savedTypes[nameKey] || savedTypes[w.name.toLowerCase()];
          const savedAmenityList = savedAmenities[w.id] || savedAmenities[nameKey] || savedAmenities[w.name.toLowerCase()];

          const nameLower = (w.name || '').toLowerCase();
          const isNameHall = nameLower.includes('hall') || nameLower.includes('قاعة') || nameLower.includes('majlis') || nameLower.includes('conference') || nameLower.includes('training') || nameLower.includes('meeting') || nameLower.includes('room');
          const isNameTheater = nameLower.includes('theater') || nameLower.includes('مسرح') || nameLower.includes('auditorium');

          let inferredType: SpaceType | undefined = undefined;
          if (isNameTheater) inferredType = 'theater';
          else if (isNameHall) inferredType = 'meeting-room';

          let sectionType: string | undefined = undefined;
          if (Array.isArray(w.sections) && w.sections.length > 0) {
            const sec = w.sections[0];
            if (sec.type === 'MEETING_ROOM') sectionType = 'meeting-room';
            else if (sec.type === 'THEATER') sectionType = 'theater';
            else if (sec.type === 'DESK') {
              if (isNameTheater) sectionType = 'theater';
              else if (isNameHall) sectionType = 'meeting-room';
              else if (savedType) sectionType = savedType;
              else sectionType = 'private-office';
            }
          }

          const preservedType = (savedType || sectionType || inferredType || existing?.type || (w as any).type || 'private-office') as SpaceType;

          if (Array.isArray(w.sections) && w.sections.length > 0) {
            const sec = w.sections[0];
            const targetDbSecType = mapFrontendTypeToDbSectionType(preservedType);
            if (sec.type !== targetDbSecType && targetDbSecType !== 'DESK') {
              const storedToken = getStoredToken();
              if (storedToken) {
                fetch(`${getApiBaseUrl()}/workspace-sections/${sec.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${storedToken}`,
                  },
                  body: JSON.stringify({ type: targetDbSecType }),
                }).catch(() => { });
              }
            }
          }

          const backendAmenityList = (w as any).amenities !== undefined && Array.isArray((w as any).amenities)
            ? (w as any).amenities.map((a: any) => typeof a === 'string' ? a : (a.amenity?.name || a.name)).filter(Boolean)
            : undefined;

          const finalAmenities = savedAmenityList !== undefined
            ? savedAmenityList
            : (backendAmenityList !== undefined
              ? backendAmenityList
              : (existing?.amenities !== undefined ? existing.amenities : []));

          let savedImagesList: string[] | undefined = undefined;
          if (typeof window !== 'undefined') {
            try {
              const rawImgMap = localStorage.getItem('cp_space_images');
              if (rawImgMap) {
                const imgMap = JSON.parse(rawImgMap);
                savedImagesList = imgMap[w.id] || imgMap[w.name.toLowerCase()];
              }
            } catch (_) { }
          }

          const dbImages = (w as any).images && Array.isArray((w as any).images) && (w as any).images.length > 0
            ? (w as any).images
            : undefined;

          const finalImages = dbImages || savedImagesList || (existing?.images && existing.images.length > 0 ? existing.images : ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80']);

          return {
            id: w.id,
            name: w.name,
            city: w.city,
            district: '',
            address: w.city,
            description: existing?.description || `Workspace managed by ${w.partner?.brandName || 'Partner'}`,
            type: preservedType,
            images: finalImages,
            amenities: finalAmenities,
            totalCapacity: w.totalCapacity !== undefined && w.totalCapacity !== null ? Number(w.totalCapacity) : 0,
            availableCapacity: w.totalCapacity !== undefined && w.totalCapacity !== null ? Number(w.totalCapacity) : 0,

            pricing: {
              hourly: (w as any).hourlyRate ?? existing?.pricing?.hourly ?? 45,
              daily: w.dailyRate !== undefined && w.dailyRate !== null ? w.dailyRate : (existing?.pricing?.daily ?? 100),
              monthly: w.monthlyRate !== undefined && w.monthlyRate !== null ? w.monthlyRate : (existing?.pricing?.monthly ?? 2000),
              yearly: w.yearlyRate !== undefined && w.yearlyRate !== null ? w.yearlyRate : (existing?.pricing?.yearly ?? 20000),
            },
            bookingMode: existing?.bookingMode || (preservedType === 'meeting-room' || preservedType === 'event-hall' || (preservedType as string).includes('hall') ? 'hourly' : 'subscription'),
            bookingPackages: existing?.bookingPackages || [],
            rating: existing?.rating || 4.8,
            reviewCount: existing?.reviewCount || 12,
            isVisible: existing?.isVisible !== undefined ? existing.isVisible : true,
            isFeatured: existing?.isFeatured !== undefined ? existing.isFeatured : false,
            openHours: existing?.openHours || '08:00 AM - 10:00 PM',
            phone: existing?.phone || '+966 50 000 0000',
            email: isBelongingToCurrentUser ? (currentUser?.email || w.partner?.contactEmail || 'contact@coworkingpass.sa') : (w.partner?.contactEmail || existing?.email || 'contact@coworkingpass.sa'),
            ownerId: isBelongingToCurrentUser ? (currentUser?.id || w.partnerId) : w.partnerId,
          };
        });

        // استبعاد أي تكرار بالاسم لضمان ظهور كل مساحة عمل مرة واحدة فقط
        const uniqueDbSpaces: Space[] = [];
        const seenNames = new Set<string>();
        for (const s of dbSpaces) {
          const key = (s.name || '').trim().toLowerCase();
          if (!seenNames.has(key)) {
            seenNames.add(key);
            uniqueDbSpaces.push(s);
          }
        }

        // قراءة المساحات المضافة محلياً ودمجها مع الداتابيز ومساحات النظام الأساسية
        let customSpaces: Space[] = [];
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('cp_custom_spaces');
            if (raw) customSpaces = JSON.parse(raw);
          } catch (_) { }
        }

        const mergedSpaces = [
          ...uniqueDbSpaces,
          ...customSpaces.filter(cs => !seenNames.has((cs.name || '').trim().toLowerCase())),
          ...INITIAL_SPACES.filter(init => !seenNames.has(init.name.trim().toLowerCase()) && !customSpaces.some(cs => (cs.name || '').trim().toLowerCase() === init.name.trim().toLowerCase()))
        ];

        setSpaces(mergedSpaces);
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch workspaces from /api/workspaces:', err);
      return workspacesApi;
    }
  };

  const createWorkspace = async (workspaceData: {
    partnerId: string;
    name: string;
    city: string;
    locationMapUrl?: string;
    dailyRate?: number;
    monthlyRate?: number;
    yearlyRate?: number;
    passVisitValue: number;
    totalCapacity: number;
    amenities?: string[];
    images?: string[];
  }): Promise<{ success: boolean; workspace?: WorkspaceApi; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/workspaces`, {
        method: 'POST',
        headers,
        body: JSON.stringify(workspaceData),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to create workspace');
      }

      const newWorkspace: WorkspaceApi = resData.workspace || resData;
      setWorkspacesApi((prev) => [newWorkspace, ...prev]);
      showToast(`Workspace ${workspaceData.name} created successfully`, 'success');
      return { success: true, workspace: newWorkspace };
    } catch (err: any) {
      console.error('Error creating workspace via POST /api/workspaces:', err);
      showToast(err.message || 'Failed to create workspace', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateWorkspace = async (
    workspaceId: string,
    updates: Partial<{
      partnerId: string;
      name: string;
      city: string;
      locationMapUrl: string;
      dailyRate: number;
      monthlyRate: number;
      yearlyRate: number;
      passVisitValue: number;
      totalCapacity: number;
      amenities: string[];
      images: string[];
    }>
  ): Promise<{ success: boolean; workspace?: WorkspaceApi; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.warn(`Workspace PUT notice (${workspaceId}):`, resData.error || 'Failed to update workspace in DB');
        return { success: false, error: resData.error || 'Failed to update workspace' };
      }

      const updatedWorkspace: WorkspaceApi = resData.workspace || resData;
      setWorkspacesApi((prev) =>
        prev.map((w) => (w.id === workspaceId ? { ...w, ...updatedWorkspace } : w))
      );
      showToast(`Workspace updated successfully`, 'success');
      return { success: true, workspace: updatedWorkspace };
    } catch (err: any) {
      console.error(`Error updating workspace via PUT /api/workspaces/${workspaceId}:`, err);
      return { success: false, error: err.message };
    }
  };

  const deleteWorkspace = async (workspaceId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers,
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to delete workspace');
      }

      setWorkspacesApi((prev) => prev.filter((w) => w.id !== workspaceId));
      showToast(`Workspace deleted successfully`, 'success');
      return { success: true };
    } catch (err: any) {
      console.error(`Error deleting workspace via DELETE /api/workspaces/${workspaceId}:`, err);
      showToast(err.message || 'Failed to delete workspace', 'error');
      return { success: false, error: err.message };
    }
  };

  const createPartner = async (partnerData: {
    brandName: string;
    contactEmail: string;
    taxNumber: string;
    revenueSharePercentage: number;
  }): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
    try {
      const storedToken = getStoredToken();
      if (!storedToken) {
        return { success: false, error: 'Please log in first' };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`,
      };

      const response = await fetch(`${getApiBaseUrl()}/partners`, {
        method: 'POST',
        headers,
        body: JSON.stringify(partnerData),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to create partner');
      }

      const newPartner: Partner = resData.partner || resData;
      setPartners((prev) => {
        const updated = [newPartner, ...prev];
        if (typeof window !== 'undefined') localStorage.setItem('cp_partners', JSON.stringify(updated));
        return updated;
      });
      showToast(`Partner ${partnerData.brandName} created successfully`, 'success');
      return { success: true, partner: newPartner };
    } catch (err: any) {
      console.error('Error creating partner via POST /api/partners:', err);
      showToast(err.message || 'Failed to create partner', 'error');
      return { success: false, error: err.message };
    }
  };

  const updatePartner = async (
    partnerId: string,
    updates: Partial<{
      brandName: string;
      contactEmail: string;
      taxNumber: string;
      revenueSharePercentage: number;
      status: ApprovalStatus;
      rejectionReason?: string;
    }>
  ): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/partners/${partnerId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update partner');
      }

      const updatedPartner: Partner = resData.partner || resData;
      setPartners((prev) => {
        const updated = prev.map((p) => (p.id === partnerId ? { ...p, ...updatedPartner } : p));
        if (typeof window !== 'undefined') localStorage.setItem('cp_partners', JSON.stringify(updated));
        return updated;
      });
      showToast(`Partner updated successfully`, 'success');
      return { success: true, partner: updatedPartner };
    } catch (err: any) {
      console.error(`Error updating partner via PUT /api/partners/${partnerId}:`, err);
      showToast(err.message || 'Failed to update partner', 'error');
      return { success: false, error: err.message };
    }
  };

  const deletePartner = async (partnerId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/partners/${partnerId}`, {
        method: 'DELETE',
        headers,
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to delete partner');
      }

      setPartners((prev) => {
        const updated = prev.filter((p) => p.id !== partnerId);
        if (typeof window !== 'undefined') localStorage.setItem('cp_partners', JSON.stringify(updated));
        return updated;
      });
      showToast(`Partner deleted successfully`, 'success');
      return { success: true };
    } catch (err: any) {
      console.error(`Error deleting partner via DELETE /api/partners/${partnerId}:`, err);
      showToast(err.message || 'Failed to delete partner', 'error');
      return { success: false, error: err.message };
    }
  };

  const approvePartner = async (partnerId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await updatePartner(partnerId, { status: 'APPROVED' });
      if (res.success) {
        const targetPartner = partners.find((p) => p.id === partnerId);
        if (targetPartner && targetPartner.contactEmail) {
          const targetEmail = targetPartner.contactEmail.trim().toLowerCase();
          setUsers((prev) => {
            const updatedUsers = prev.map((u) =>
              (u.email || '').trim().toLowerCase() === targetEmail
                ? { ...u, partnerStatus: 'APPROVED' as ApprovalStatus }
                : u
            );
            if (typeof window !== 'undefined') localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
            return updatedUsers;
          });
        }
        showToast('Space Partner account approved successfully! Confirmation email sent.', 'success');
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err: any) {
      console.error(`Error approving partner ${partnerId}:`, err);
      showToast(err.message || 'Error approving partner account', 'error');
      return { success: false, error: err.message };
    }
  };

  const rejectPartner = async (partnerId: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await updatePartner(partnerId, { status: 'REJECTED', rejectionReason: reason });
      if (res.success) {
        const targetPartner = partners.find((p) => p.id === partnerId);
        if (targetPartner && targetPartner.contactEmail) {
          const targetEmail = targetPartner.contactEmail.trim().toLowerCase();
          setUsers((prev) => {
            const updatedUsers = prev.map((u) =>
              (u.email || '').trim().toLowerCase() === targetEmail
                ? { ...u, partnerStatus: 'REJECTED' as ApprovalStatus }
                : u
            );
            if (typeof window !== 'undefined') localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
            return updatedUsers;
          });
        }
        showToast('Partner application rejected.', 'info');
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err: any) {
      console.error(`Error rejecting partner ${partnerId}:`, err);
      showToast(err.message || 'Error rejecting partner application', 'error');
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchWorkspaces().catch(() => { });
    fetchMembershipPlans().catch(() => { });
    fetchAmenities().catch(() => { });
    fetchLoyaltyRules().catch(() => { });
    fetchPartners().catch(() => { });
    fetchUsers().catch(() => { });

    const storedToken = getStoredToken();
    if (storedToken) {
      fetchHourlyBookings().catch(() => { });
      fetchPayouts().catch(() => { });
      fetchSubscriptions().catch(() => { });
      fetchDirectBookings().catch(() => { });
      fetchPayments().catch(() => { });
      fetchNotifications().catch(() => { });
      if (currentUser) {
        fetchWallet(currentUser.id).catch(() => { });
        getLoyaltyPointsApi(currentUser.id).then(ptsRes => {
          if (ptsRes.success && Array.isArray(ptsRes.data)) {
            const uPts = ptsRes.data.find((p: any) => p.userId === currentUser.id);
            if (uPts && typeof uPts.availableBalance === 'number') {
              const syncedUser = { ...currentUser, loyaltyPoints: uPts.availableBalance };
              setCurrentUser(syncedUser);
              if (typeof window !== 'undefined') {
                localStorage.setItem('cp_currentUser', JSON.stringify(syncedUser));
              }
            }
          }
        }).catch(() => { });
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchWallet(currentUser.id).catch(() => { });
      if (currentUser.role === 'organization' || currentUser.companyId) {
        fetchCompanyWallet(currentUser.companyId).catch(() => { });
      }
    }
  }, [currentUser?.id, currentUser?.companyId, currentUser?.role]);

  const sanitizeBookings = (list: Booking[]): Booking[] => {
    const seen = new Set<string>();
    return list.map((b, idx) => {
      let uniqueId = b.id;
      if (!uniqueId || seen.has(uniqueId)) {
        uniqueId = `${b.id || 'booking'}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      }
      seen.add(uniqueId);
      return { ...b, id: uniqueId };
    });
  };

  const sanitizeNotifications = (list: Notification[]): Notification[] => {
    const seen = new Set<string>();
    return list.map((n, idx) => {
      let uniqueId = n.id;
      if (!uniqueId || seen.has(uniqueId)) {
        uniqueId = `${n.id || 'notif'}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      }
      seen.add(uniqueId);
      return { ...n, id: uniqueId };
    });
  };

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('cp_currentUser');
      if (savedUser) {
        let parsed = JSON.parse(savedUser);
        if (parsed.avatar && (parsed.avatar.includes('images.unsplash.com') || parsed.avatar.includes('admin-avatar'))) {
          parsed.avatar = '';
        }
        parsed = checkAndRenewPlanHours(parsed);
        if (parsed.hasActivePass && !parsed.passPurchaseDate) {
          parsed.passPurchaseDate = parsed.planCycleStart || (parsed.joinDate ? `${parsed.joinDate}T00:00:00.000Z` : new Date().toISOString());
        }
        if (parsed.hasActivePass && !parsed.passPricePaid) {
          const t = (parsed.membershipTier || '').toLowerCase();
          parsed.passPricePaid = t.includes('year') || t.includes('annual') ? 17000 : 1700;
        }
        localStorage.setItem('cp_currentUser', JSON.stringify(parsed));
        setCurrentUser(parsed);
      }
      const savedUsers = localStorage.getItem('cp_users');
      let combinedUsers = INITIAL_USERS;
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers) as User[];
          const mergedMap = new Map<string, User>();
          parsed.forEach(u => mergedMap.set(u.email.toLowerCase(), u));
          INITIAL_USERS.forEach(initU => {
            const existing = mergedMap.get(initU.email.toLowerCase());
            if (!existing) {
              mergedMap.set(initU.email.toLowerCase(), initU);
            } else {
              mergedMap.set(initU.email.toLowerCase(), {
                ...existing,
                membershipTier: initU.membershipTier || existing.membershipTier,
                hasActivePass: initU.hasActivePass !== undefined ? initU.hasActivePass : existing.hasActivePass,
                loyaltyPoints: existing.loyaltyPoints ?? (initU as any).loyaltyPoints ?? 0,
                remainingHours: existing.remainingHours !== undefined ? existing.remainingHours : initU.remainingHours,
                totalPlanHours: existing.totalPlanHours !== undefined ? existing.totalPlanHours : initU.totalPlanHours,
                passPurchaseDate: existing.passPurchaseDate !== undefined ? existing.passPurchaseDate : initU.passPurchaseDate,
                passPricePaid: existing.passPricePaid !== undefined ? existing.passPricePaid : initU.passPricePaid,
                passUsed: existing.passUsed !== undefined ? existing.passUsed : initU.passUsed,
              });
            }
          });
          combinedUsers = Array.from(mergedMap.values());
        } catch (err) {
          console.error('Failed to parse saved users:', err);
        }
      }
      const cleanedUsers = combinedUsers.map(u => {
        if (u.avatar && (u.avatar.includes('images.unsplash.com') || u.avatar.includes('admin-avatar'))) {
          return { ...u, avatar: '' };
        }
        return u;
      });
      setUsers(cleanedUsers);
      localStorage.setItem('cp_users', JSON.stringify(cleanedUsers));

      const savedBookings = localStorage.getItem('cp_bookings');
      if (savedBookings) {
        try {
          const parsed = JSON.parse(savedBookings);
          const sanitized = sanitizeBookings(parsed);
          setBookings(sanitized);
          localStorage.setItem('cp_bookings', JSON.stringify(sanitized));
        } catch (e) {
          setBookings(sanitizeBookings(INITIAL_BOOKINGS));
        }
      } else {
        const sanitized = sanitizeBookings(INITIAL_BOOKINGS);
        setBookings(sanitized);
        localStorage.setItem('cp_bookings', JSON.stringify(sanitized));
      }

      const savedNotifs = localStorage.getItem('cp_notifications');
      if (savedNotifs) {
        try {
          const parsed = JSON.parse(savedNotifs);
          const sanitized = sanitizeNotifications(parsed);
          setNotifications(sanitized);
          localStorage.setItem('cp_notifications', JSON.stringify(sanitized));
        } catch (e) {
          setNotifications(sanitizeNotifications(INITIAL_NOTIFICATIONS));
        }
      } else {
        const sanitized = sanitizeNotifications(INITIAL_NOTIFICATIONS);
        setNotifications(sanitized);
        localStorage.setItem('cp_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
      }

      const savedCart = localStorage.getItem('cp_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      const savedAmenityReqs = localStorage.getItem('cp_amenity_requests');
      if (savedAmenityReqs) {
        try {
          setAmenityRequests(JSON.parse(savedAmenityReqs));
        } catch (e) {
          // Keep default state
        }
      }

      const savedApprovedAmenities = localStorage.getItem('cp_approved_amenities');
      if (savedApprovedAmenities) {
        try {
          setApprovedCustomAmenities(JSON.parse(savedApprovedAmenities));
        } catch (e) {
          // Keep default state
        }
      }

      fetchTickets().catch(() => { });
      fetchPartners().catch(() => { });
      fetchWorkspaces().catch(() => { });
    } catch (e) {
      console.error('Failed to load storage state:', e);
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'provider') {
      const userEmail = (currentUser.email || '').toLowerCase();
      const matchedPartner = partners.find(p => (p.contactEmail || '').toLowerCase() === userEmail);
      if (matchedPartner && (!currentUser.businessName || !currentUser.crNumber)) {
        const updatedUser: User = {
          ...currentUser,
          businessName: currentUser.businessName || matchedPartner.brandName,
          crNumber: currentUser.crNumber || matchedPartner.taxNumber,
        };
        setCurrentUser(updatedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
        }
      }

      const storedToken = getStoredToken();
      if (storedToken) {
        const exists = partners.some(p => (p.contactEmail || '').toLowerCase() === userEmail);
        if (!exists && userEmail) {
          createPartner({
            brandName: (currentUser as any).businessName || currentUser.name || 'Venue Partner',
            contactEmail: currentUser.email,
            taxNumber: (currentUser as any).crNumber || '300000000000003',
            revenueSharePercentage: 20,
          }).catch(() => { });
        }
      }
    }
  }, [currentUser, partners]);

  useEffect(() => {
    if (currentUser) {
      fetchWallet(currentUser.id).catch(() => { });
      if (currentUser.role === 'organization' || (currentUser as any).role === 'HR_ADMIN' || currentUser.companyId) {
        fetchCompanyWallet(currentUser.companyId).catch(() => { });
      }
    }
  }, [currentUser?.id, currentUser?.role, currentUser?.companyId]);

  const navigate = (screen: Screen, params: Record<string, any> = {}) => {
    setHistory(prev => [...prev.slice(-9), nav]);
    setNav({ screen, params });
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setNav(prev);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const startOtpVerification = (session: OtpSession) => {
    setOtpSession(session);
    navigate('otp-verify');
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; requireOtp?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdminAccount = cleanEmail === 'admin@coworkingpass.sa';
    const apiRes = await loginUserApi({ email, password });
    if (apiRes.success && apiRes.userId) {
      let user = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        user = {
          id: apiRes.userId,
          name: isAdminAccount ? 'Platform Super Admin' : email.split('@')[0],
          email,
          password,
          role: isAdminAccount ? 'admin' : 'individual',
          phone: '',
          avatar: '',
          isBlocked: false,
          joinDate: new Date().toISOString().split('T')[0],
          loyaltyPoints: 0,
        };
      } else if (isAdminAccount) {
        user = { ...user, role: 'admin' };
      }
      const session: OtpSession = {
        user,
        targetEmailOrPhone: email,
        mode: 'login',
        role: user.role,
        userId: apiRes.userId,
        backendSynced: true,
        devOtp: apiRes.devOtp || (isAdminAccount ? '123456' : undefined),
      };
      setOtpSession(session);
      navigate('otp-verify');
      showToast(apiRes.message || `Verification code sent to ${email}`, 'info');
      return { success: true, requireOtp: true };
    }

    if (!apiRes.success && apiRes.error && !apiRes.error.includes('Network connection issue')) {
      const isServerError = apiRes.error.includes('Internal server error') || apiRes.error.includes('500');
      if (!isServerError) {
        return { success: false, error: apiRes.error };
      }
    }

    let user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
    if (!user) {
      user = INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
    }
    // Universal admin fallback compatibility: allow 'password', 'Admin@123456', or 'admin123'
    if (!user && isAdminAccount) {
      if (password === 'password' || password === 'Admin@123456' || password === 'admin123') {
        user = INITIAL_USERS.find(u => u.email.toLowerCase() === 'admin@coworkingpass.sa');
      }
    }
    if (!user) {
      return { success: false, error: apiRes.error || 'Invalid email or password. Please try again.' };
    }
    if (user.isBlocked) {
      return { success: false, error: 'Your account has been suspended. Please contact support.' };
    }

    const session: OtpSession = {
      user: isAdminAccount ? { ...user, role: 'admin' } : user,
      targetEmailOrPhone: user.email || email,
      mode: 'login',
      role: isAdminAccount ? 'admin' : user.role,
      devOtp: isAdminAccount ? '123456' : undefined,
    };
    setOtpSession(session);
    navigate('otp-verify');
    showToast(`Verification code sent to ${user.email}`, 'info');
    return { success: true, requireOtp: true };
  };

  const signup = (name: string, email: string, password: string, phone: string, role: UserRole = 'individual') => {
    const generatedUsername = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`;
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      username: generatedUsername,
      email,
      password,
      role,
      phone,
      avatar: '',
      isBlocked: false,
      joinDate: new Date().toISOString().split('T')[0],
      university: '',
      bio: '',
      loyaltyPoints: 0,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setPendingUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }
    return newUser;
  };

  const requestSignupOtp = async (newUser: User, role: UserRole, extraData?: Partial<User>): Promise<{ success: boolean; error?: string; message?: string }> => {
    const apiRes = await registerUserApi({
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: role || newUser.role || 'individual',
      orgName: extraData?.orgName,
      companyName: extraData?.orgName,
      businessName: extraData?.businessName,
      crNumber: extraData?.crNumber,
    });

    if (!apiRes.success && apiRes.error && !apiRes.error.includes('Network connection issue')) {
      showToast(apiRes.error, 'error');
      return { success: false, error: apiRes.error };
    }

    const mergedUser: User = {
      ...newUser,
      role: role || newUser.role || 'individual',
      orgName: extraData?.orgName || newUser.orgName,
      ...(extraData || {}),
    };

    const session: OtpSession = {
      user: mergedUser,
      targetEmailOrPhone: newUser.email || newUser.phone,
      mode: 'signup',
      role,
      extraData,
      userId: apiRes.userId,
      backendSynced: Boolean(apiRes.userId),
      devOtp: apiRes.devOtp,
    };

    const isProviderRegistration = role === 'provider' || role === 'PARTNER_ADMIN' || newUser.role === 'provider' || newUser.role === 'PARTNER_ADMIN';
    if (isProviderRegistration) {
      const brand = (extraData?.businessName || newUser.name || 'New Space Partner').trim();
      const cr = (extraData?.crNumber || '').trim();
      const pendingPartner: Partner = {
        id: apiRes.userId || `partner-${Date.now()}`,
        brandName: brand,
        contactEmail: newUser.email,
        taxNumber: cr || '1010000000',
        revenueSharePercentage: 15,
        status: 'PENDING_APPROVAL',
        createdAt: new Date().toISOString(),
      };
      setPartners((prev) => {
        const list = prev.filter(p => (p.contactEmail || '').toLowerCase() !== (pendingPartner.contactEmail || '').toLowerCase());
        const updated = [pendingPartner, ...list];
        if (typeof window !== 'undefined') localStorage.setItem('cp_partners', JSON.stringify(updated));
        return updated;
      });

      const adminNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: 'usr_admin',
        title: 'New Space Partner Application',
        message: `Venue "${brand}" (CR: ${cr || 'N/A'}) has submitted a registration application pending your review and approval.`,
        type: 'info',
        read: false,
        createdAt: 'Just now',
      };
      setNotifications((prev) => [adminNotif, ...prev]);
    }

    setOtpSession(session);
    navigate('otp-verify');
    showToast(apiRes.message || `Verification code sent to ${newUser.email || newUser.phone}`, 'info');
    return { success: true, message: apiRes.message };
  };

  const requestForgotPasswordOtp = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanEmail);
    if (!user) {
      user = INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanEmail);
    }
    if (!user) {
      return { success: false, error: 'No account found with this email address. Please check and try again.' };
    }
    if (user.isBlocked) {
      return { success: false, error: 'This account has been suspended. Please contact support.' };
    }

    const session: OtpSession = {
      user,
      targetEmailOrPhone: user.email || email,
      mode: 'forgot-password',
      role: user.role,
    };
    setOtpSession(session);
    navigate('otp-verify');
    showToast(`Verification code sent to ${user.email}`, 'info');
    return { success: true };
  };

  const verifyOtp = async (code: string): Promise<{ success: boolean; error?: string; pendingApproval?: boolean }> => {
    if (!otpSession) {
      return { success: false, error: 'No active verification session. Please sign in again.' };
    }
    const cleanCode = code.trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return { success: false, error: 'Please enter a valid 6-digit verification code.' };
    }

    const isDemo = Boolean(
      (otpSession.userId && (otpSession.userId.startsWith('usr_') || otpSession.userId.startsWith('demo_'))) ||
      (otpSession.user?.email && ['admin@coworkingpass.sa', 'sarah@example.com', 'hr@aramco.com', 'partner@spacehub.sa'].includes(otpSession.user.email.toLowerCase()))
    );

    if (otpSession.mode === 'login') {
      let user = otpSession.user;
      if (otpSession.userId) {
        const apiRes = await verifyLoginApi({ userId: otpSession.userId, code: cleanCode });
        if (!apiRes.success && (!isDemo || cleanCode !== '123456')) {
          return { success: false, error: apiRes.error || 'Invalid verification code. Please try again.' };
        }
        if (apiRes.token && typeof window !== 'undefined') {
          localStorage.setItem('cp_token', apiRes.token);
        }
        if (apiRes.user) {
          const userRole = mapRoleToFrontend(apiRes.user.role);
          const returnedOrgName = apiRes.user.orgName || apiRes.user.companyName;
          user = {
            ...user,
            id: apiRes.user.id || user.id,
            name: apiRes.user.name || user.name,
            email: apiRes.user.email || user.email,
            role: userRole,
            companyId: apiRes.user.companyId || user.companyId,
            orgName: returnedOrgName || user.orgName,
            businessName: (apiRes.user as any).businessName || user.businessName || (otpSession.user as any)?.businessName,
            crNumber: (apiRes.user as any).crNumber || user.crNumber || (otpSession.user as any)?.crNumber,
          };
          const updatedUsers = users.some(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase())
            ? users.map(u => (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) ? user : u)
            : [...users, user];
          setUsers(updatedUsers);
          if (typeof window !== 'undefined') {
            localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
          }
        }
      }

      setCurrentUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cp_currentUser', JSON.stringify(user));
      }

      if (user.role === 'organization') {
        const orgCompanyName = user.orgName || 'New Organization';
        createCompanyApi({
          companyName: orgCompanyName,
          hrAdminId: user.id,
        }).then(res => {
          if (res.success) {
            console.log('[Company DB Sync] Created company record:', res.company);
          } else {
            console.warn('[Company DB Sync] Company creation response:', res.error);
          }
        });
      }

      setOtpSession(null);
      if (user.role === 'admin') navigate('admin-dashboard');
      else if (user.role === 'organization') navigate('org-dashboard');
      else if (user.role === 'provider') navigate('provider-dashboard');
      else navigate('ind-dashboard');
      showToast(`Welcome back, ${user.name}!`, 'success');
      return { success: true };
    }

    if (otpSession.mode === 'forgot-password') {
      const user = otpSession.user;
      setPendingResetUser(user);
      setOtpSession(null);
      navigate('reset-password');
      showToast('Identity verified. Please set your new password.', 'success');
      return { success: true };
    }

    if (otpSession.userId) {
      const apiRes = await verifyEmailApi({ userId: otpSession.userId, code: cleanCode });
      if (!apiRes.success && (!isDemo || cleanCode !== '123456')) {
        return { success: false, error: apiRes.error || 'Invalid verification code. Please try again.' };
      }
    }

    const updated: User = {
      ...otpSession.user,
      id: otpSession.userId || otpSession.user.id,
      role: otpSession.role || 'individual',
      avatar: otpSession.user.avatar || '',
      ...(otpSession.extraData || {}),
    };

    const updatedUsers = users.some(u => u.id === updated.id || u.email.toLowerCase() === updated.email.toLowerCase())
      ? users.map(u => (u.id === updated.id || u.email.toLowerCase() === updated.email.toLowerCase()) ? updated : u)
      : [...users, updated];
    setUsers(updatedUsers);
    setPendingUser(null);
    setOtpSession(null);

    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }

    if (updated.role === 'organization') {
      const hrAdminId = updated.id || otpSession.userId || '';
      const companyName = updated.orgName || 'New Organization';
      if (hrAdminId) {
        createCompanyApi({ companyName, hrAdminId }).then(res => {
          if (res.success) {
            console.log('[Company DB Sync] Created company record on signup:', res.company);
          } else {
            console.warn('[Company DB Sync] Signup creation response:', res.error);
          }
        });
      }
    }

    const isProvider = updated.role === 'provider' || updated.role === 'PARTNER_ADMIN' || otpSession.role === 'provider' || otpSession.role === 'PARTNER_ADMIN';

    if (isProvider) {
      const brand = (updated.businessName || otpSession.extraData?.businessName || updated.name || 'New Space Partner').trim();
      const cr = (updated.crNumber || otpSession.extraData?.crNumber || '').trim();
      const pendingPartner: Partner = {
        id: updated.id || `partner-${Date.now()}`,
        brandName: brand,
        contactEmail: updated.email,
        taxNumber: cr || '1010000000',
        revenueSharePercentage: 15,
        status: 'PENDING_APPROVAL',
        createdAt: new Date().toISOString(),
      };
      setPartners((prev) => {
        const list = prev.filter((p) => (p.contactEmail || '').toLowerCase() !== (pendingPartner.contactEmail || '').toLowerCase());
        const updatedList = [pendingPartner, ...list];
        if (typeof window !== 'undefined') localStorage.setItem('cp_partners', JSON.stringify(updatedList));
        return updatedList;
      });

      showToast('Email verified successfully! Your Space Partner application is under review and pending administrator approval.', 'info');
      return { success: true, pendingApproval: true };
    }

    const loginRes = await login(updated.email, updated.password);
    if (loginRes.success) {
      showToast('Account email verified successfully! Please enter the security code sent to your email to log in.', 'success');
      return { success: true };
    }

    setCurrentUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updated));
    }
    if (updated.role === 'organization') navigate('org-dashboard');
    else navigate('ind-dashboard');
    showToast(`Account verified! Welcome to Coworking Pass, ${updated.name}!`, 'success');
    return { success: true };
  };

  const resendOtp = async () => {
    if (!otpSession) return;
    if (otpSession.mode === 'signup' && otpSession.user) {
      const apiRes = await registerUserApi({
        name: otpSession.user.name,
        email: otpSession.user.email,
        password: otpSession.user.password,
        role: otpSession.role || otpSession.user.role || 'individual',
        orgName: otpSession.extraData?.orgName,
        companyName: otpSession.extraData?.orgName,
        businessName: otpSession.extraData?.businessName,
        crNumber: otpSession.extraData?.crNumber,
      });
      if (apiRes.userId || apiRes.devOtp) {
        setOtpSession(prev => prev ? { ...prev, userId: apiRes.userId || prev.userId, devOtp: apiRes.devOtp } : null);
      }
    } else if (otpSession.mode === 'login' && otpSession.user) {
      const apiRes = await loginUserApi({
        email: otpSession.user.email,
        password: otpSession.user.password,
      });
      if (apiRes.userId || apiRes.devOtp) {
        setOtpSession(prev => prev ? { ...prev, userId: apiRes.userId || prev.userId, devOtp: apiRes.devOtp } : null);
      }
    }
    showToast(`New verification code sent to ${otpSession.targetEmailOrPhone}`, 'info');
  };

  const resetPassword = (newPassword: string) => {
    if (!pendingResetUser) {
      return { success: false, error: 'No active password reset session. Please request a verification code again.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }
    const updatedUser: User = {
      ...pendingResetUser,
      password: newPassword,
    };
    const updatedUsers = users.some(u => u.id === updatedUser.id)
      ? users.map(u => u.id === updatedUser.id ? updatedUser : u)
      : [...users, updatedUser];

    setUsers(updatedUsers);
    setPendingResetUser(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }
    navigate('login');
    showToast('Password updated successfully! Please sign in with your new password.', 'success');
    return { success: true };
  };

  const cancelOtp = () => {
    const prevMode = otpSession?.mode || 'login';
    setOtpSession(null);
    if (prevMode === 'signup') navigate('signup');
    else if (prevMode === 'forgot-password') navigate('forgot-password');
    else navigate('login');
  };

  const completeSignup = (role: UserRole, extraData?: Partial<User>) => {
    if (!pendingUser) return;
    const updated: User = {
      ...(pendingUser as User),
      role,
      avatar: pendingUser.avatar || '',
      ...(extraData || {}),
    };
    const updatedUsers = users.map(u => u.id === updated.id ? updated : u);
    setUsers(updatedUsers);
    setCurrentUser(updated);
    setPendingUser(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updated));
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }
    if (role === 'organization') navigate('org-dashboard');
    else if (role === 'provider') navigate('provider-dashboard');
    else navigate('ind-dashboard');
    showToast('Welcome to Coworking Pass!');
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    let latestUser = currentUser;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cp_currentUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (!currentUser || parsed.id === currentUser.id)) {
            latestUser = { ...(currentUser || {}), ...parsed };
          }
        }
      } catch (e) { }
    }
    if (!latestUser) return;
    const updated = { ...latestUser, ...updates };
    setCurrentUser(updated);
    const updatedUsers = users.map(u => u.id === updated.id ? updated : u);
    setUsers(updatedUsers);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updated));
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }
    showToast('Profile updated successfully.');
  };

  const logout = () => {
    setCurrentUser(null);
    setPendingUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cp_currentUser');
      localStorage.removeItem('cp_token');
      localStorage.removeItem('token');
      localStorage.removeItem('jwt');
    }
    navigate('landing');
    showToast('You have been logged out.', 'info');
  };

  const toggleFavorite = (spaceId: string) => {
    setFavorites(prev =>
      prev.includes(spaceId) ? prev.filter(id => id !== spaceId) : [...prev, spaceId]
    );
  };

  const requestUserLocation = async (force: boolean = false): Promise<{ lat: number; lng: number } | null> => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setLocationStatus('unsupported');
      setLocationErrorMessage('Geolocation is not supported by your browser or device.');
      showToast('Geolocation is not supported by your browser.', 'error');
      try { sessionStorage.setItem('coworking_location_status', 'unsupported'); } catch { }
      return null;
    }

    if (userLocation && !force) {
      return userLocation;
    }

    // If permission has already been determined (denied/unavailable/unsupported) and not forcing a re-request, don't re-prompt
    if (!force && (locationStatus === 'denied' || locationStatus === 'unavailable' || locationStatus === 'unsupported')) {
      return null;
    }

    setLocationStatus('loading');
    setLocationErrorMessage(null);

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          setLocationStatus('granted');
          setLocationErrorMessage(null);
          try { sessionStorage.setItem('coworking_location_status', 'granted'); } catch { }
          resolve(coords);
        },
        error => {
          console.warn('Geolocation error:', error);
          if (error.code === 1) {
            // PERMISSION_DENIED
            setLocationStatus('denied');
            setLocationErrorMessage('Location permission was denied. Enabling location access is required to calculate accurate distances and sort workspaces nearest to you.');
            try { sessionStorage.setItem('coworking_location_status', 'denied'); } catch { }
            showToast('Location permission was denied. Workspaces are shown in default order.', 'info');
          } else if (error.code === 2) {
            // POSITION_UNAVAILABLE
            setLocationStatus('unavailable');
            setLocationErrorMessage('Location services are disabled or unavailable on your device. Please ensure GPS or device location is turned on.');
            try { sessionStorage.setItem('coworking_location_status', 'unavailable'); } catch { }
            showToast('Location services are disabled or unavailable.', 'info');
          } else if (error.code === 3) {
            // TIMEOUT
            setLocationStatus('unavailable');
            setLocationErrorMessage('Location request timed out. Please check your connection or signal and try again.');
            try { sessionStorage.setItem('coworking_location_status', 'unavailable'); } catch { }
            showToast('Location request timed out.', 'info');
          } else {
            setLocationStatus('unavailable');
            setLocationErrorMessage(error.message || 'Unable to determine your current location.');
            try { sessionStorage.setItem('coworking_location_status', 'unavailable'); } catch { }
            showToast('Unable to determine your current location.', 'info');
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const addSpace = (space: Omit<Space, 'id'>) => {
    const defaultCoordsByCity: Record<string, { lat: number; lng: number }> = {
      Riyadh: { lat: 24.7136, lng: 46.6753 },
      Jeddah: { lat: 21.5433, lng: 39.1728 },
      Dammam: { lat: 26.4207, lng: 50.0888 },
      Khobar: { lat: 26.2810, lng: 50.2080 },
      Madinah: { lat: 24.4672, lng: 39.6111 },
      Makkah: { lat: 21.3891, lng: 39.8579 },
    };
    const cityCoords = defaultCoordsByCity[space.city] || { lat: 24.7136, lng: 46.6753 };
    const lat = space.latitude ?? space.coordinates?.lat ?? cityCoords.lat;
    const lng = space.longitude ?? space.coordinates?.lng ?? cityCoords.lng;

    const tempId = `space-${Date.now()}`;
    const newSpace: Space = {
      ...space,
      id: tempId,
      latitude: lat,
      longitude: lng,
      coordinates: { lat, lng },
    };

    if (typeof window !== 'undefined') {
      try {
        const rawCustom = localStorage.getItem('cp_custom_spaces');
        const customList: Space[] = rawCustom ? JSON.parse(rawCustom) : [];
        const filtered = customList.filter(s => s.id !== newSpace.id && s.name.trim().toLowerCase() !== newSpace.name.trim().toLowerCase());
        filtered.push(newSpace);
        localStorage.setItem('cp_custom_spaces', JSON.stringify(filtered));

        if (newSpace.type) {
          const rawMap = localStorage.getItem('cp_space_types');
          const typeMap = rawMap ? JSON.parse(rawMap) : {};
          typeMap[newSpace.id] = newSpace.type;
          typeMap[newSpace.name.toLowerCase()] = newSpace.type;
          localStorage.setItem('cp_space_types', JSON.stringify(typeMap));
        }
        if (newSpace.amenities) {
          const rawAmenityMap = localStorage.getItem('cp_space_amenities');
          const amenitiesMap = rawAmenityMap ? JSON.parse(rawAmenityMap) : {};
          amenitiesMap[newSpace.id] = newSpace.amenities;
          amenitiesMap[newSpace.name.toLowerCase()] = newSpace.amenities;
          localStorage.setItem('cp_space_amenities', JSON.stringify(amenitiesMap));
        }
        if (newSpace.images) {
          const rawImgMap = localStorage.getItem('cp_space_images');
          const imgMap = rawImgMap ? JSON.parse(rawImgMap) : {};
          imgMap[newSpace.id] = newSpace.images;
          imgMap[newSpace.name.toLowerCase()] = newSpace.images;
          localStorage.setItem('cp_space_images', JSON.stringify(imgMap));
        }
      } catch (_) { }
    }

    setSpaces(prev => {
      const filtered = prev.filter(s => s.name.trim().toLowerCase() !== newSpace.name.trim().toLowerCase());
      return [...filtered, newSpace];
    });
    showToast('Space added successfully.');

    (async () => {
      try {
        let storedToken = getStoredToken();
        if (!storedToken && currentUser?.email) {
          try {
            const lRes = await loginUserApi({ email: currentUser.email, password: currentUser.password || 'password' });
            if (lRes.success && lRes.userId) {
              const vRes = await verifyLoginApi({ userId: lRes.userId, code: '123456' });
              if (vRes.token) {
                storedToken = vRes.token;
                if (typeof window !== 'undefined') localStorage.setItem('cp_token', vRes.token);
              }
            }
          } catch (_) { }
        }

        let currentPartners = partners;
        if (currentPartners.length === 0) {
          currentPartners = await fetchPartners();
        }

        const userEmail = currentUser?.email?.toLowerCase();
        let validPartnerId = currentPartners.find(p => p.id === space.ownerId)?.id ||
          (userEmail ? currentPartners.find(p => p.contactEmail?.toLowerCase() === userEmail)?.id : undefined);

        if (!validPartnerId && storedToken) {
          const partnerRes = await createPartner({
            brandName: (space as any).providerName || currentUser?.name || currentUser?.businessName || space.name || 'Workspace Partner',
            contactEmail: currentUser?.email || `contact-${Date.now()}@coworkingpass.sa`,
            taxNumber: '300000000000003',
            revenueSharePercentage: 15,
          });
          if (partnerRes.success && partnerRes.partner) {
            validPartnerId = partnerRes.partner.id;
          }
        }
        if (!validPartnerId && currentPartners.length > 0) {
          validPartnerId = currentPartners[0].id;
        }

        if (validPartnerId && storedToken) {
          const createRes = await createWorkspace({
            partnerId: validPartnerId,
            name: space.name,
            city: space.city || 'Riyadh',
            dailyRate: space.pricing?.daily || 50,
            monthlyRate: space.pricing?.monthly || 800,
            yearlyRate: space.pricing?.yearly || 8000,
            passVisitValue: 15,
            totalCapacity: space.totalCapacity || 30,
            amenities: space.amenities || [],
            images: space.images || [],
          });

          if (createRes.success && createRes.workspace) {
            const createdWs = createRes.workspace;
            if (typeof window !== 'undefined') {
              try {
                const rawCustom = localStorage.getItem('cp_custom_spaces');
                if (rawCustom) {
                  const customList: Space[] = JSON.parse(rawCustom);
                  const updatedList = customList.map(s =>
                    (s.id === tempId || s.name.trim().toLowerCase() === newSpace.name.trim().toLowerCase())
                      ? { ...s, id: createdWs.id, ownerId: currentUser?.id || validPartnerId }
                      : s
                  );
                  localStorage.setItem('cp_custom_spaces', JSON.stringify(updatedList));
                }

                if (newSpace.type) {
                  const rawMap = localStorage.getItem('cp_space_types');
                  const typeMap = rawMap ? JSON.parse(rawMap) : {};
                  typeMap[createdWs.id] = newSpace.type;
                  typeMap[createdWs.name.toLowerCase()] = newSpace.type;
                  localStorage.setItem('cp_space_types', JSON.stringify(typeMap));
                }
                if (space.amenities) {
                  const rawAmenityMap = localStorage.getItem('cp_space_amenities');
                  const amenitiesMap = rawAmenityMap ? JSON.parse(rawAmenityMap) : {};
                  amenitiesMap[createdWs.id] = space.amenities;
                  amenitiesMap[createdWs.name.toLowerCase()] = space.amenities;
                  localStorage.setItem('cp_space_amenities', JSON.stringify(amenitiesMap));
                }
                if (space.images) {
                  const rawImgMap = localStorage.getItem('cp_space_images');
                  const imgMap = rawImgMap ? JSON.parse(rawImgMap) : {};
                  imgMap[createdWs.id] = space.images;
                  imgMap[createdWs.name.toLowerCase()] = space.images;
                  localStorage.setItem('cp_space_images', JSON.stringify(imgMap));
                }
              } catch (_) { }
            }

            const dbSecType = mapFrontendTypeToDbSectionType(newSpace.type);
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
            try {
              await fetch(`${getApiBaseUrl()}/workspace-sections`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  workspaceId: createdWs.id,
                  type: dbSecType,
                  name: `${space.name} Section`,
                  capacity: space.totalCapacity || 30,
                  dailyRate: space.pricing?.daily || 50,
                  monthlyRate: space.pricing?.monthly || 800,
                  yearlyRate: space.pricing?.yearly || 8000,
                }),
              });
            } catch (_) { }

            await fetchWorkspaces();
          }
        }
      } catch (err) {
        console.warn('Database workspace save notice:', err);
      }
    })();
  };

  const updateSpace = (id: string, updates: Partial<Space>) => {
    const targetSpace = spaces.find(s => s.id === id);
    const updatedSpaceObj = targetSpace ? { ...targetSpace, ...updates } : updates;

    if (typeof window !== 'undefined') {
      try {
        const rawCustom = localStorage.getItem('cp_custom_spaces');
        if (rawCustom) {
          const customList: Space[] = JSON.parse(rawCustom);
          const updatedList = customList.map(s => s.id === id ? { ...s, ...updates } : s);
          localStorage.setItem('cp_custom_spaces', JSON.stringify(updatedList));
        }

        if (updates.type) {
          const rawMap = localStorage.getItem('cp_space_types');
          const typeMap = rawMap ? JSON.parse(rawMap) : {};
          typeMap[id] = updates.type;
          if (updates.name) typeMap[updates.name.toLowerCase()] = updates.type;
          localStorage.setItem('cp_space_types', JSON.stringify(typeMap));
        }
        if (updates.amenities !== undefined) {
          const rawMap = localStorage.getItem('cp_space_amenities');
          const amenitiesMap = rawMap ? JSON.parse(rawMap) : {};
          amenitiesMap[id] = updates.amenities;
          if (updates.name || targetSpace?.name) {
            const rawName = updates.name || targetSpace?.name || '';
            const nameKey = rawName.trim().toLowerCase();
            if (nameKey) {
              amenitiesMap[nameKey] = updates.amenities;
              amenitiesMap[rawName.toLowerCase()] = updates.amenities;
            }
          }
          localStorage.setItem('cp_space_amenities', JSON.stringify(amenitiesMap));
        }
        if (updates.images !== undefined) {
          const rawMap = localStorage.getItem('cp_space_images');
          const imgMap = rawMap ? JSON.parse(rawMap) : {};
          imgMap[id] = updates.images;
          if (updates.name || targetSpace?.name) {
            const rawName = updates.name || targetSpace?.name || '';
            const nameKey = rawName.trim().toLowerCase();
            if (nameKey) {
              imgMap[nameKey] = updates.images;
              imgMap[rawName.toLowerCase()] = updates.images;
            }
          }
          localStorage.setItem('cp_space_images', JSON.stringify(imgMap));
        }
      } catch (_) { }
    }

    setSpaces(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    showToast('Space updated successfully.');

    (async () => {
      try {
        const storedToken = getStoredToken();
        if (!storedToken) return;

        const matchedDbWorkspace = workspacesApi.find(
          w => w.id === id || (targetSpace && w.name.toLowerCase() === targetSpace.name.toLowerCase())
        );
        const targetDbId = matchedDbWorkspace?.id;

        const payload: Record<string, any> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.city !== undefined) payload.city = updates.city;
        if (updates.totalCapacity !== undefined) payload.totalCapacity = updates.totalCapacity;
        if (updates.pricing?.daily !== undefined) payload.dailyRate = updates.pricing.daily;
        if (updates.pricing?.monthly !== undefined) payload.monthlyRate = updates.pricing.monthly;
        if (updates.pricing?.yearly !== undefined) payload.yearlyRate = updates.pricing.yearly;
        if (updates.amenities !== undefined) payload.amenities = updates.amenities;
        if (updates.images !== undefined) payload.images = updates.images;

        if (targetDbId && (Object.keys(payload).length > 0 || updates.type)) {
          if (Object.keys(payload).length > 0) {
            await updateWorkspace(targetDbId, payload);
          }

          if (updates.type) {
            const dbSecType = mapFrontendTypeToDbSectionType(updates.type);
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            headers['Authorization'] = `Bearer ${storedToken}`;
            try {
              const secRes = await fetch(`${getApiBaseUrl()}/workspace-sections`, { headers });
              if (secRes.ok) {
                const sections = await secRes.json();
                if (Array.isArray(sections)) {
                  const existingSec = sections.find((s: any) => s.workspaceId === targetDbId);
                  if (existingSec) {
                    await fetch(`${getApiBaseUrl()}/workspace-sections/${existingSec.id}`, {
                      method: 'PUT',
                      headers,
                      body: JSON.stringify({ type: dbSecType }),
                    });
                  } else {
                    await fetch(`${getApiBaseUrl()}/workspace-sections`, {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({
                        workspaceId: targetDbId,
                        type: dbSecType,
                        name: `Section - ${dbSecType}`,
                        capacity: (updatedSpaceObj as any).totalCapacity || 30,
                      }),
                    });
                  }
                }
              }
            } catch (_) { }
          }
          await fetchWorkspaces();
        } else if (!targetDbId && (Object.keys(payload).length > 0 || updates.type)) {
          let currentPartners = partners;
          if (currentPartners.length === 0) {
            currentPartners = await fetchPartners();
          }

          const userEmail = currentUser?.email?.toLowerCase();
          let validPartnerId = currentPartners.find(p => p.id === (targetSpace as any)?.ownerId)?.id ||
            (userEmail ? currentPartners.find(p => p.contactEmail.toLowerCase() === userEmail)?.id : undefined) ||
            currentPartners[0]?.id;

          if (validPartnerId) {
            const createRes = await createWorkspace({
              partnerId: validPartnerId,
              name: (updatedSpaceObj as any).name || 'Workspace',
              city: (updatedSpaceObj as any).city || 'Riyadh',
              dailyRate: (updatedSpaceObj as any).pricing?.daily || 50,
              monthlyRate: (updatedSpaceObj as any).pricing?.monthly || 800,
              yearlyRate: (updatedSpaceObj as any).pricing?.yearly || 8000,
              passVisitValue: 15,
              totalCapacity: (updatedSpaceObj as any).totalCapacity || 30,
              amenities: (updatedSpaceObj as any).amenities || [],
              images: (updatedSpaceObj as any).images || [],
            });

            if (createRes.success && createRes.workspace) {
              const dbSecType = mapFrontendTypeToDbSectionType((updatedSpaceObj as any).type || 'mixed');
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              headers['Authorization'] = `Bearer ${storedToken}`;
              try {
                await fetch(`${getApiBaseUrl()}/workspace-sections`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    workspaceId: createRes.workspace.id,
                    type: dbSecType,
                    name: `${(updatedSpaceObj as any).name || 'Workspace'} Section`,
                    capacity: (updatedSpaceObj as any).totalCapacity || 30,
                    dailyRate: (updatedSpaceObj as any).pricing?.daily || 50,
                    monthlyRate: (updatedSpaceObj as any).pricing?.monthly || 800,
                    yearlyRate: (updatedSpaceObj as any).pricing?.yearly || 8000,
                  }),
                });
              } catch (_) { }
              await fetchWorkspaces();
            }
          }
        }
      } catch (err) {
        console.warn('Failed to save space update to database:', err);
      }
    })();
  };

  const toggleSpaceVisibility = (id: string) => {
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
  };

  const deleteSpace = (id: string) => {
    setSpaces(prev => prev.filter(s => s.id !== id));
    if (typeof window !== 'undefined') {
      try {
        const rawCustom = localStorage.getItem('cp_custom_spaces');
        if (rawCustom) {
          const customList: Space[] = JSON.parse(rawCustom);
          const updatedList = customList.filter(s => s.id !== id);
          localStorage.setItem('cp_custom_spaces', JSON.stringify(updatedList));
        }
      } catch (_) { }
    }
    showToast('Space deleted.');

    (async () => {
      try {
        let storedToken = getStoredToken();
        if (!storedToken && currentUser?.email) {
          try {
            const lRes = await loginUserApi({ email: currentUser.email, password: currentUser.password || 'password' });
            if (lRes.success && lRes.userId) {
              const vRes = await verifyLoginApi({ userId: lRes.userId, code: '123456' });
              if (vRes.token) {
                storedToken = vRes.token;
                if (typeof window !== 'undefined') localStorage.setItem('cp_token', vRes.token);
              }
            }
          } catch (_) { }
        }
        if (storedToken) {
          const res = await deleteWorkspace(id);
          if (res.success) {
            await fetchWorkspaces();
          }
        }
      } catch (err) {
        console.warn('Failed to delete space from database:', err);
      }
    })();
  };

  const addBooking = (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...booking,
      id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBookings(prev => [...prev, newBooking]);

    const space = spaces.find(s => s.id === booking.spaceId);
    const multiplier = space?.loyaltyPointsMultiplier || 1;
    const rawPrice = booking.totalPrice || 0;
    const earnedPoints = (rawPrice > 0 ? Math.max(10, Math.floor(rawPrice / 10)) : 10) * multiplier;

    // Quota deduction for Meeting Room & Theater hourly bookings
    const bCat = (booking.category || '').toLowerCase();
    const bType = (booking.type || '').toLowerCase();
    const sType = (space?.type || '').toLowerCase();
    const sName = (space?.name || booking.spaceName || '').toLowerCase();
    const isMeetingOrTheater =
      bType.includes('meeting') ||
      bType.includes('hall') ||
      bType.includes('theater') ||
      bCat.includes('meeting') ||
      bCat.includes('hall') ||
      bCat.includes('theater') ||
      sType.includes('meeting') ||
      sType.includes('hall') ||
      sType.includes('theater') ||
      sName.includes('meeting') ||
      sName.includes('قاعة') ||
      sName.includes('مسرح') ||
      sName.includes('theater') ||
      sName.includes('hall');

    // Read freshest user from localStorage if available
    let latestUser = currentUser;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cp_currentUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (!currentUser || parsed.id === currentUser.id)) {
            latestUser = { ...(currentUser || {}), ...parsed };
          }
        }
      } catch (e) { }
    }

    if (latestUser && latestUser.id === booking.userId) {
      let updatedUser: User = { ...latestUser };

      const hasPlanPass = Boolean(latestUser.hasActivePass);
      const isHourlyBooking = booking.plan === 'hourly' || (booking.durationHours && booking.durationHours > 0);
      const isEligibleQuotaBooking = isHourlyBooking || (isMeetingOrTheater && (booking.plan === 'daily' || (typeof booking.coveredHours === 'number' && booking.coveredHours > 0)));

      if (hasPlanPass && isMeetingOrTheater && isEligibleQuotaBooking) {
        const tier = (latestUser.membershipTier || '').toLowerCase();
        const isYearly = tier.includes('year') || tier.includes('annual');
        const defaultQuota = isYearly ? 12 : 8;
        const currentRemaining = typeof latestUser.remainingHours === 'number'
          ? latestUser.remainingHours
          : defaultQuota;

        const bookedHours = typeof booking.coveredHours === 'number'
          ? booking.coveredHours
          : (booking.durationHours || (isMeetingOrTheater && booking.plan === 'daily' ? 2 : 1));
        const hoursDeducted = Math.min(bookedHours, Math.max(0, currentRemaining));

        if (hoursDeducted > 0) {
          const newRemaining = Math.max(0, currentRemaining - hoursDeducted);
          updatedUser = {
            ...updatedUser,
            remainingHours: newRemaining,
            totalPlanHours: latestUser.totalPlanHours || defaultQuota,
            passUsed: true,
          };
        }
      }

      if (hasPlanPass && (booking.paidWithPass || (booking.coveredHours && booking.coveredHours > 0) || booking.totalPrice === 0 || booking.plan === 'daily' || booking.plan === 'monthly' || booking.plan === 'yearly')) {
        updatedUser = {
          ...updatedUser,
          passUsed: true,
        };
      }

      if (earnedPoints > 0) {
        updatedUser = {
          ...updatedUser,
          loyaltyPoints: (updatedUser.loyaltyPoints || 0) + earnedPoints,
        };
      }

      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (typeof window !== 'undefined') {
        localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
        try {
          const storedUsers = localStorage.getItem('cp_users');
          if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers) as User[];
            const updatedUsersList = parsedUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
            localStorage.setItem('cp_users', JSON.stringify(updatedUsersList));
          }
        } catch (e) { }
      }

      if (earnedPoints > 0) {
        createPointsTransactionApi({
          userId: latestUser.id,
          type: 'EARNED',
          points: earnedPoints,
          description: `Earned points for booking: ${booking.spaceName}`,
          referenceId: newBooking.id,
        }).then(res => {
          if (res.success) {
            getLoyaltyPointsApi(latestUser.id).then(ptsRes => {
              if (ptsRes.success && Array.isArray(ptsRes.data)) {
                const uPts = ptsRes.data.find((p: any) => p.userId === latestUser.id);
                if (uPts && typeof uPts.availableBalance === 'number') {
                  setCurrentUser(prevU => {
                    if (!prevU) return null;
                    const synced = { ...prevU, loyaltyPoints: uPts.availableBalance };
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('cp_currentUser', JSON.stringify(synced));
                    }
                    return synced;
                  });
                }
              }
            }).catch(() => { });
          }
        }).catch(() => { });
      }
    }

    addNotification({
      userId: booking.userId,
      title: 'Booking confirmed',
      message: `${booking.spaceName} confirmed.${earnedPoints > 0 ? ` Earned ${earnedPoints} loyalty points!` : ''}`,
      type: 'booking',
      read: false,
    });

    setSpaces(prev => prev.map(s =>
      s.id === booking.spaceId
        ? { ...s, availableCapacity: Math.max(0, s.availableCapacity - booking.seats) }
        : s
    ));

    (async () => {
      try {
        const storedToken = getStoredToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        // 1. Identify the target space from spaces state using the original booking.spaceId / spaceName
        const targetSpace = spaces.find(s => s.id === booking.spaceId)
          || spaces.find(s => s.name?.toLowerCase().trim() === booking.spaceName?.toLowerCase().trim());

        const effectiveSpaceName = targetSpace?.name || booking.spaceName;
        const effectiveCity = targetSpace?.city || booking.spaceCity;
        const cleanName = (effectiveSpaceName || '').trim().toLowerCase();
        const cleanCity = (effectiveCity || '').trim().toLowerCase().replace('al ', '');

        // 2. Find matching workspace in workspacesApi
        let matchedW = workspacesApi.find(w => w.id === booking.spaceId);

        if (!matchedW && cleanName) {
          // Exact name match
          matchedW = workspacesApi.find(w => (w.name || '').trim().toLowerCase() === cleanName);
        }

        if (!matchedW && cleanName) {
          // Partial name match (e.g. "Oasis Cowork" matches "Oasis Coworking")
          matchedW = workspacesApi.find(w => {
            const wName = (w.name || '').trim().toLowerCase();
            return wName.includes(cleanName) || cleanName.includes(wName);
          });
        }

        if (!matchedW && cleanName) {
          // First word match (e.g. "Oasis")
          const firstWord = cleanName.split(/\s+/)[0];
          if (firstWord && firstWord.length > 2) {
            matchedW = workspacesApi.find(w => (w.name || '').trim().toLowerCase().includes(firstWord));
          }
        }

        if (!matchedW && cleanCity) {
          // Match by city
          matchedW = workspacesApi.find(w => {
            const wCity = (w.city || '').trim().toLowerCase().replace('al ', '');
            return wCity && (wCity === cleanCity || wCity.includes(cleanCity) || cleanCity.includes(wCity));
          });
        }

        // Never fallback to workspacesApi[0]!
        const validWorkspaceId = matchedW ? matchedW.id : (booking.spaceId && booking.spaceId.includes('-') && booking.spaceId.length > 20 ? booking.spaceId : null);

        let sectionId: string | null = null;
        if (matchedW && Array.isArray((matchedW as any).sections) && (matchedW as any).sections.length > 0) {
          sectionId = (matchedW as any).sections[0].id;
        }

        if (!sectionId && validWorkspaceId) {
          try {
            const secRes = await fetch(`${getApiBaseUrl()}/workspace-sections`, { headers });
            if (secRes.ok) {
              const sections = await secRes.json();
              if (Array.isArray(sections)) {
                const matchedSec = sections.find((sec: any) => sec.workspaceId === validWorkspaceId);
                if (matchedSec) sectionId = matchedSec.id;
              }
            }
          } catch (e) { }
        }

        if (!sectionId && validWorkspaceId) {
          try {
            const spaceType = targetSpace?.type || 'desk';
            const dbSecType = mapFrontendTypeToDbSectionType(spaceType);
            const secCreateRes = await fetch(`${getApiBaseUrl()}/workspace-sections`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                workspaceId: validWorkspaceId,
                type: dbSecType,
                name: `${effectiveSpaceName || 'Workspace'} Section`,
                capacity: targetSpace?.totalCapacity || 50,
                dailyRate: booking.totalPrice || 50,
              }),
            });
            if (secCreateRes.ok) {
              const secData = await secCreateRes.json();
              sectionId = secData.id || secData.section?.id;
            }
          } catch (e) { }
        }

        const bookingPlanStr = (booking.plan || (booking as any).type || '') as string;
        const isHourly = bookingPlanStr === 'hourly' || (targetSpace && targetSpace.bookingMode === 'hourly');
        const durationType = bookingPlanStr === 'monthly' ? 'MONTHLY' : bookingPlanStr === 'yearly' ? 'YEARLY' : 'DAILY';
        const bookingDate = booking.startDate || new Date().toISOString().split('T')[0];

        if (!isHourly) {
          const computedDays = booking.durationDays || (booking.startDate && booking.endDate ? calculateDailyDurationDays(booking.startDate, booking.endDate) : 1);
          const computedMonths = booking.durationMonths || 1;
          const computedDetails = booking.durationDetails || (
            durationType === 'DAILY'
              ? `${computedDays} ${computedDays === 1 ? 'Day' : 'Days'}`
              : durationType === 'MONTHLY'
                ? `${computedMonths} ${computedMonths === 1 ? 'Month' : 'Months'}`
                : '1 Year'
          );

          const directRes = await fetch(`${getApiBaseUrl()}/direct-bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              userId: currentUser?.id || booking.userId,
              workspaceId: validWorkspaceId || undefined,
              spaceName: effectiveSpaceName,
              city: effectiveCity,
              sectionId: sectionId || undefined,
              durationType,
              durationDetails: computedDetails,
              durationDays: computedDays,
              durationMonths: computedMonths,
              bookingDate,
              status: 'CONFIRMED',
            }),
          });

          if (directRes.ok) {
            const dbBooking = await directRes.json();
            setDirectBookingsApi(prev => [dbBooking, ...prev]);

            if (dbBooking && dbBooking.id) {
              setBookings(prev => prev.map(b => b.id === newBooking.id ? {
                ...b,
                id: dbBooking.id,
                spaceId: dbBooking.workspaceId || b.spaceId,
                spaceName: dbBooking.workspace?.name || b.spaceName,
                spaceCity: dbBooking.workspace?.city || b.spaceCity,
              } : b));
            }

            await fetch(`${getApiBaseUrl()}/payments`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                userId: currentUser?.id || booking.userId,
                workspaceId: validWorkspaceId || dbBooking.workspaceId || undefined,
                amount: booking.totalPrice || 50,
                method: 'MADA',
                paymentFor: 'DIRECT_BOOKING',
                referenceId: dbBooking.id || newBooking.id,
              }),
            }).catch(() => { });
          }
        }

        if (booking.plan === 'hourly' || (targetSpace && targetSpace.bookingMode === 'hourly')) {
          let pkgId: string | null = null;
          try {
            const pkgRes = await fetch(`${getApiBaseUrl()}/hourly-packages`, { headers });
            if (pkgRes.ok) {
              const pkgs = await pkgRes.json();
              if (Array.isArray(pkgs)) {
                const matchPkg = pkgs.find((p: any) => p.sectionId === sectionId);
                if (matchPkg) pkgId = matchPkg.id;
              }
            }
          } catch (_) { }

          const hourlyDuration = Math.min(4, Math.max(1, booking.durationHours || 1));
          const hourlyDetails = booking.durationDetails || `${hourlyDuration} ${hourlyDuration === 1 ? 'Hour' : 'Hours'}`;

          if (!pkgId && sectionId) {
            try {
              const pkgCreateRes = await fetch(`${getApiBaseUrl()}/hourly-packages`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  sectionId,
                  packageName: `${hourlyDuration} Hour Package`,
                  hoursAmount: hourlyDuration,
                  periodType: 'PER_DAY',
                  price: booking.totalPrice || 45,
                }),
              });
              if (pkgCreateRes.ok) {
                const pkgData = await pkgCreateRes.json();
                pkgId = pkgData.id || pkgData.hourlyPackage?.id;
              }
            } catch (_) { }
          }

          const formatIsoWithTime = (dateStr?: string, timeStr?: string, defaultHour: number = 9) => {
            const d = dateStr ? dateStr.split('T')[0] : new Date().toISOString().split('T')[0];
            const parts = d.split('-').map(Number);
            const year = parts[0] || new Date().getFullYear();
            const month = parts[1] || (new Date().getMonth() + 1);
            const day = parts[2] || new Date().getDate();
            let hours = defaultHour;
            let minutes = 0;
            if (timeStr) {
              const isPM = /PM/i.test(timeStr);
              const isAM = /AM/i.test(timeStr);
              const cleanTime = timeStr.replace(/(AM|PM|\s)/gi, '').trim();
              const tparts = cleanTime.split(':');
              let h = parseInt(tparts[0], 10) || 0;
              if (isPM && h < 12) h += 12;
              if (isAM && h === 12) h = 0;
              hours = h;
              minutes = tparts.length > 1 ? (parseInt(tparts[1], 10) || 0) : 0;
            }
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00.000Z`;
          };

          const isoStart = formatIsoWithTime(booking.startDate, booking.startTime, 9);
          const isoEnd = formatIsoWithTime(booking.endDate || booking.startDate, booking.endTime, 9 + hourlyDuration);

          if (sectionId && pkgId) {
            try {
              const hbRes = await fetch(`${getApiBaseUrl()}/hourly-bookings`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  userId: currentUser?.id || booking.userId,
                  workspaceId: validWorkspaceId || undefined,
                  spaceName: effectiveSpaceName,
                  city: effectiveCity,
                  sectionId,
                  packageId: pkgId,
                  startDate: isoStart,
                  endDate: isoEnd,
                  startTime: booking.startTime,
                  endTime: booking.endTime,
                  hoursUsed: hourlyDuration,
                  durationDetails: hourlyDetails,
                  status: 'ACTIVE',
                }),
              });
              if (hbRes.ok) {
                const hbData = await hbRes.json();
                setHourlyBookingsApi(prev => [hbData, ...prev]);

                if (hbData && hbData.id) {
                  setBookings(prev => prev.map(b => b.id === newBooking.id ? {
                    ...b,
                    id: hbData.id,
                    spaceId: hbData.workspaceId || b.spaceId,
                    spaceName: hbData.workspace?.name || hbData.section?.workspace?.name || b.spaceName,
                    spaceCity: hbData.workspace?.city || hbData.section?.workspace?.city || b.spaceCity,
                  } : b));
                }

                await fetch(`${getApiBaseUrl()}/payments`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    userId: currentUser?.id || booking.userId,
                    workspaceId: validWorkspaceId || hbData.workspaceId || undefined,
                    amount: booking.totalPrice || 50,
                    method: 'MADA',
                    paymentFor: 'HOURLY_BOOKING',
                    referenceId: hbData.id || newBooking.id,
                  }),
                }).catch(() => { });
              }
            } catch (_) { }
          }
        }
      } catch (err) {
        console.warn('Booking DB persistence notice:', err);
      }
    })();

    return newBooking;
  };

  const cancelBooking = (id: string, refundMethod: 'wallet' | 'card' = 'wallet') => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === booking.spaceId
          ? { ...s, availableCapacity: Math.min(s.totalCapacity, s.availableCapacity + booking.seats) }
          : s
      )
    );

    (async () => {
      try {
        const storedToken = getStoredToken();
        if (!storedToken) return;
        const directRes = await updateDirectBooking(id, { status: 'CANCELLED' });
        if (!directRes.success) {
          await updateHourlyBooking(id, { status: 'CANCELLED' });
        }
      } catch (err) {
        console.warn('Booking cancellation DB sync notice:', err);
      }
    })();

    const price = getBookingPrice(booking, spaces);
    const userRole = currentUser?.id === booking.userId ? currentUser?.role : 'individual';
    const { eligible, requiredHours } = isCancellationRefundEligible(booking.startDate, booking.startTime, userRole);

    if (currentUser && currentUser.id === booking.userId) {
      let updatedUser = { ...currentUser };
      let msg = '';

      if (eligible) {
        if (refundMethod === 'wallet') {
          const currentWallet = currentUser.walletBalance || 0;
          updatedUser = { ...currentUser, walletBalance: currentWallet + price };
          msg = `Booking cancelled. SAR ${price.toLocaleString()} refunded to your wallet balance.`;

          if (price > 0) {
            (async () => {
              try {
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                const storedToken = getStoredToken();
                if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
                const response = await fetch(`${getApiBaseUrl()}/wallet`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    userId: currentUser.id,
                    amount: price,
                    type: 'REFUND',
                    description: `Refund for cancelled booking (${booking.spaceName})`,
                    referenceId: booking.id,
                  }),
                });
                if (response.ok) {
                  const data = await response.json();
                  setCurrentUser((prev) => (prev ? { ...prev, walletBalance: data.balance } : null));
                  const refundTx: WalletTransaction = data.transaction || {
                    id: `tx-${Date.now()}`,
                    walletId: currentUser.id,
                    userId: currentUser.id,
                    amount: price,
                    type: 'REFUND',
                    description: `Refund for cancelled booking (${booking.spaceName})`,
                    balanceAfter: data.balance ?? (currentWallet + price),
                    createdAt: new Date().toISOString(),
                  };
                  setWalletTransactions((prev) => [refundTx, ...prev.filter(t => t.id !== refundTx.id)]);
                }
              } catch (err) {
                console.warn('Wallet refund DB sync notice:', err);
              }
            })();
          }
        } else {
          msg = `Booking cancelled. Refund of SAR ${price.toLocaleString()} initiated to original card (5-14 business days).`;
        }
      } else {
        msg = `Booking cancelled. As per Legal Policy, cancellations within ${requiredHours}h of start time are non-refundable.`;
      }

      setCurrentUser(updatedUser);
      const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      setUsers(updatedUsers);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
        localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
      }

      addNotification({
        userId: currentUser.id,
        title: 'Booking Cancelled',
        message: msg,
        type: 'cancelled',
      });

      showToast(msg, eligible ? 'info' : 'error');
    } else {
      showToast('Booking cancelled successfully.', 'info');
    }
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      addNotification({
        userId: booking.userId,
        title: `Booking ${status}`,
        message: `${booking.spaceName} booking status was updated to ${status}.`,
        type: status === 'cancelled' ? 'cancelled' : 'booking',
      });
    }

    (async () => {
      try {
        const storedToken = getStoredToken();
        if (!storedToken) return;
        const dbStatus = status === 'active' ? 'CONFIRMED' : status === 'cancelled' ? 'CANCELLED' : 'EXPIRED';
        const directRes = await updateDirectBooking(id, { status: dbStatus });
        if (!directRes.success) {
          const hourlyDbStatus = status === 'active' ? 'ACTIVE' : status === 'cancelled' ? 'CANCELLED' : 'EXPIRED';
          await updateHourlyBooking(id, { status: hourlyDbStatus });
        }
      } catch (err) {
        console.warn('Booking status update DB sync notice:', err);
      }
    })();
  };

  const getValidPostgresUserId = (candidateId?: string): string | undefined => {
    if (candidateId && candidateId.length > 20 && !candidateId.startsWith('user-') && candidateId !== 'admin' && !candidateId.startsWith('notif-')) {
      return candidateId;
    }
    if (currentUser?.id && currentUser.id.length > 20 && !currentUser.id.startsWith('user-') && currentUser.id !== 'admin') {
      return currentUser.id;
    }
    try {
      const token = getStoredToken();
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.userId && payload.userId.length > 20) return payload.userId;
        }
      }
    } catch (e) { }

    const realUser = users.find(u => u.id && u.id.length > 20 && !u.id.startsWith('user-'));
    if (realUser) return realUser.id;

    return undefined;
  };

  const mapToNotificationTypeEnum = (typeStr: string = '', titleStr: string = ''): string => {
    const upper = typeStr.toUpperCase();
    const validEnums = [
      'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'WAITLIST_PROMOTED', 'MEETING_BOOKED',
      'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PASS_ASSIGNED', 'PASS_EXPIRING',
      'ACCOUNT_VERIFIED', 'POINTS_EARNED', 'POINTS_REDEEMED', 'PAYOUT_PROCESSED',
      'PARTNER_APPROVED', 'AMENITY_REQUEST_STATUS'
    ];
    if (validEnums.includes(upper)) return upper;

    const combined = (typeStr + ' ' + titleStr).toLowerCase();
    if (combined.includes('cancel')) return 'BOOKING_CANCELLED';
    if (combined.includes('payment') || combined.includes('pay')) return 'PAYMENT_SUCCESS';
    if (combined.includes('expir') || combined.includes('remind')) return 'PASS_EXPIRING';
    if (combined.includes('point')) return 'POINTS_EARNED';
    if (combined.includes('amenity')) return 'AMENITY_REQUEST_STATUS';
    if (combined.includes('partner') || combined.includes('approve')) return 'PARTNER_APPROVED';
    if (combined.includes('meeting')) return 'MEETING_BOOKED';
    if (combined.includes('pass')) return 'PASS_ASSIGNED';
    return 'BOOKING_CONFIRMED';
  };

  const currentDbUserId = getValidPostgresUserId(currentUser?.id);
  const userNotifications = currentUser
    ? notifications.filter(n =>
      currentUser.role === 'admin' ||
      n.userId === currentUser.id ||
      (currentDbUserId && n.userId === currentDbUserId) ||
      (!n.userId || n.userId === 'user-1' || n.userId === 'admin' || n.userId.startsWith('user-'))
    )
    : [];

  const markNotificationRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
      return updated;
    });

    (async () => {
      try {
        const storedToken = getStoredToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
        await fetch(`${getApiBaseUrl()}/notifications`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id, isRead: true }),
        });
      } catch (err) { }
    })();
  };

  const toggleNotificationRead = (id: string) => {
    let nextReadState = false;
    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      nextReadState = target ? !target.read : true;
      const updated = prev.map(n => n.id === id ? { ...n, read: nextReadState } : n);
      if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
      return updated;
    });

    (async () => {
      try {
        const storedToken = getStoredToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
        await fetch(`${getApiBaseUrl()}/notifications`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id, isRead: nextReadState }),
        });
      } catch (err) { }
    })();
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => userNotifications.some(u => u.id === n.id) ? { ...n, read: true } : n);
      if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
      return updated;
    });

    (async () => {
      try {
        const storedToken = getStoredToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
        for (const n of userNotifications) {
          if (!n.read) {
            await fetch(`${getApiBaseUrl()}/notifications`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({ id: n.id, isRead: true }),
            }).catch(() => { });
          }
        }
      } catch (err) { }
    })();
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
      return updated;
    });
    showToast('Notification removed', 'info');
  };

  const clearAllNotifications = () => {
    setNotifications(prev => {
      const userNotifIds = new Set(userNotifications.map(u => u.id));
      const updated = prev.filter(n => !userNotifIds.has(n.id));
      if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
      return updated;
    });
    showToast('All notifications cleared', 'info');
  };

  const addNotification = (notifData: Omit<Notification, 'id' | 'createdAt' | 'read'> & { read?: boolean }): Notification => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: notifData.userId || currentUser?.id || 'user-1',
      title: notifData.title,
      message: notifData.message,
      type: notifData.type || 'info',
      read: notifData.read ?? false,
      createdAt: 'Just now',
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
      return updated;
    });

    (async () => {
      try {
        const storedToken = getStoredToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

        let targetUserId = getValidPostgresUserId(notifData.userId);

        if (targetUserId) {
          const notifType = mapToNotificationTypeEnum(notifData.type, notifData.title);

          const res = await fetch(`${getApiBaseUrl()}/notifications`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              userId: targetUserId,
              type: notifType,
              title: notifData.title,
              message: notifData.message,
              channel: 'IN_APP',
            }),
          });
          if (res.ok) {
            const created = await res.json();
            if (created?.id) {
              setNotifications(prev => prev.map(n => n.id === newNotif.id ? { ...n, id: created.id, userId: targetUserId! } : n));
            }
          } else {
            console.warn('POST /api/notifications returned status:', res.status);
          }
        }
      } catch (err) {
        console.warn('Notification DB persistence notice:', err);
      }
    })();

    return newNotif;
  };

  const generateFakeNotification = (presetType: string = 'booking', customTitle?: string, customMessage?: string): Notification => {
    const userId = currentUser?.id || 'user-1';
    let title = customTitle || '';
    let message = customMessage || '';
    let type: Notification['type'] = 'booking';

    if (!customTitle || !customMessage) {
      switch (presetType) {
        case 'booking':
          title = 'Booking Confirmed!';
          message = 'Your reservation at The Hub Riyadh has been confirmed for tomorrow at 9:00 AM.';
          type = 'booking';
          break;
        case 'reminder':
          title = 'Pass Expiring Soon';
          message = 'Your All-Access Pass will renew in 3 days. Ensure your billing card is up to date.';
          type = 'reminder';
          break;
        case 'info':
          title = 'Waitlist Spot Available!';
          message = 'A hot desk opened up at WorkBay Jeddah. Click here to confirm your reservation.';
          type = 'info';
          break;
        case 'payment':
          title = 'Payment Received';
          message = 'SAR 150.00 successfully processed for Daily Pass booking #BP-8821.';
          type = 'payment';
          break;
        case 'system':
          title = 'System Maintenance';
          message = 'Coworking Pass platform upgraded with instant auto-booking capabilities.';
          type = 'system';
          break;
        default:
          title = 'Test Notification';
          message = 'This is a mock notification generated for testing user notification flows.';
          type = 'info';
      }
    } else {
      type = (presetType as Notification['type']) || 'info';
    }

    return addNotification({ userId, title, message, type });
  };

  const blockUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isBlocked: true } : u));
    showToast('User has been blocked.');
  };

  const unblockUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isBlocked: false } : u));
    showToast('User has been unblocked.');
  };

  const changeUserRole = (id: string, role: UserRole) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    showToast('User permissions updated.');
  };

  const joinWaitlist = async (spaceId: string, options?: { preferredDate?: string; alertPreferences?: { sms: boolean; email: boolean; whatsapp: boolean } }) => {
    const userId = currentUser?.id || 'user-1';
    const key = `${userId}_${spaceId}`;
    setWaitlist(prev => ({ ...prev, [key]: true }));

    const targetSpace = spaces.find(s => s.id === spaceId) || workspacesApi.find(w => w.id === spaceId);

    const actualWorkspaceId = targetSpace?.id || spaceId;

    const actualSectionId = (targetSpace as any)?.sections?.[0]?.id || (targetSpace as any)?.sectionId || `sec-${actualWorkspaceId}`;

    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      const response = await fetch(`${getApiBaseUrl()}/waitlist`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          workspaceId: actualWorkspaceId,
          sectionId: actualSectionId,
          durationType: 'DAILY', // القيمة الإجبارية التي يشترطها الـ Backend
          bookingDate: options?.preferredDate || new Date().toISOString().split('T')[0],
        }),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Waitlist Server Error Details:', resData.error || resData);
        showToast(resData.error || 'Failed to join waitlist', 'error');
        return;
      }

      addNotification({
        userId,
        title: 'Joined Waitlist',
        message: `You successfully joined the waitlist. We'll notify you as soon as a spot opens!`,
        type: 'info',
      });
      showToast('You have joined the priority waitlist successfully!');
    } catch (err) {
      console.warn('Waitlist API sync notice:', err);
      showToast('Network error while joining waitlist', 'error');
    }
  };



  const leaveWaitlist = (spaceId: string) => {
    const userId = currentUser?.id || 'user-1';
    const key = `${userId}_${spaceId}`;
    setWaitlist(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    showToast('You have left the priority waitlist.', 'info');
  };

  const enableAutoBooking = (spaceId: string, cardId: string) => {
    const userId = currentUser?.id || 'user-1';
    const key = `${userId}_${spaceId}`;
    setAutobooking(prev => ({ ...prev, [key]: true }));
    setAutobookingCard(prev => ({ ...prev, [key]: cardId }));
    const space = spaces.find(s => s.id === spaceId);
    addNotification({
      userId,
      title: 'Auto-Booking Activated',
      message: `Auto-Booking enabled for ${space?.name || 'workspace'}. We'll automatically book and notify you when a desk opens.`,
      type: 'info',
    });
    showToast('Auto-Booking enabled! We\'ll charge your saved card and reserve automatically when a spot opens.', 'success');
  };

  const disableAutoBooking = (spaceId: string) => {
    const userId = currentUser?.id || 'user-1';
    const key = `${userId}_${spaceId}`;
    setAutobooking(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setAutobookingCard(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    showToast('Auto-Booking disabled.', 'info');
  };

  const addPaymentCard = (card: Omit<PaymentCard, 'id'>) => {
    const newCard: PaymentCard = { ...card, id: `card-${Date.now()}` };
    if (currentUser) {
      const updated = { ...currentUser, savedCards: [...(currentUser.savedCards || []), newCard] };
      setCurrentUser(updated);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    }
    return newCard;
  };

  const saveCartToStorage = (newCart: CartItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cp_cart', JSON.stringify(newCart));
      } catch (e) {
        console.error('Failed to save cart state:', e);
      }
    }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    const newItem: CartItem = {
      ...item,
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [...cart, newItem];
    setCart(updated);
    saveCartToStorage(updated);
    setIsCartOpen(true);
    showToast(`Added ${item.spaceName} to your cart!`, 'success');
  };

  const removeFromCart = (cartItemId: string) => {
    const updated = cart.filter((i) => i.id !== cartItemId);
    setCart(updated);
    saveCartToStorage(updated);
    showToast('Item removed from cart.', 'info');
  };

  const updateCartItemSeats = (cartItemId: string, seats: number) => {
    if (seats < 1) return;
    updateCartItem(cartItemId, { seats });
  };

  const updateCartItem = (cartItemId: string, updates: Partial<CartItem>) => {
    const updated = cart.map((i) => {
      if (i.id === cartItemId) {
        const newItem = { ...i, ...updates };

        if (updates.startDate !== undefined || updates.endDate !== undefined || updates.plan !== undefined || updates.durationMonths !== undefined) {
          const sDate = updates.startDate ?? i.startDate;
          const plan = updates.plan ?? i.plan;
          const durM = updates.durationMonths ?? i.durationMonths ?? 1;
          if (plan === 'daily') {
            const eDate = updates.endDate ?? i.endDate ?? sDate;
            newItem.endDate = eDate >= sDate ? eDate : sDate;
            newItem.durationDays = calculateDailyDurationDays(sDate, newItem.endDate);
          } else {
            newItem.endDate = calculateEndDate(sDate, plan, durM);
          }
        }

        if (newItem.plan === 'hourly' && newItem.startTime) {
          const durH = newItem.durationHours || 1;
          const [h, m] = newItem.startTime.split(':').map(Number);
          if (!isNaN(h)) {
            const endH = (h + durH) % 24;
            newItem.endTime = `${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
          }
        }

        const seats = newItem.seats || 1;
        const targetSpace = spaces.find((s) => s.id === newItem.spaceId);
        const durationDays = newItem.plan === 'daily' ? (newItem.durationDays || calculateDailyDurationDays(newItem.startDate, newItem.endDate || newItem.startDate)) : 1;
        if (targetSpace && currentUser?.hasActivePass) {
          const coverage = getEffectiveSpacePrice(
            currentUser,
            targetSpace,
            newItem.plan,
            newItem.type,
            newItem.durationHours || 1,
            newItem.durationMonths || 1,
            seats,
            durationDays
          );
          newItem.itemTotal = coverage.effectivePrice;
          newItem.pricePerSeat = coverage.isCovered ? 0 : Math.round(coverage.effectivePrice / seats);
        } else if (newItem.plan === 'hourly') {
          const hours = newItem.durationHours || 1;
          newItem.itemTotal = newItem.pricePerSeat * hours * seats;
        } else if (newItem.plan === 'daily') {
          newItem.itemTotal = newItem.pricePerSeat * durationDays * seats;
        } else if (newItem.plan === 'monthly') {
          const months = newItem.durationMonths || 1;
          newItem.itemTotal = newItem.pricePerSeat * months * seats;
        } else {
          newItem.itemTotal = newItem.pricePerSeat * seats;
        }

        return newItem;
      }
      return i;
    });

    setCart(updated);
    saveCartToStorage(updated);
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('cp_cart');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const applyLoyaltyDiscount = (pointsToUse: number) => {
    if (!currentUser) return { discount: 0, safePoints: 0 };
    const availablePoints = currentUser.loyaltyPoints || 0;
    const safePoints = Math.max(0, Math.min(Math.floor(pointsToUse / 100) * 100, availablePoints));
    const discount = (safePoints / 100) * 25;
    return { discount, safePoints };
  };

  const checkoutCart = (pointsToUse: number = 0): Booking[] => {
    if (!currentUser || cart.length === 0) return [];

    const rawTotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
    const userPoints = currentUser.loyaltyPoints || 0;
    const usableUserPoints = Math.floor(userPoints / 100) * 100;
    const pointsNeeded = Math.max(100, Math.ceil(rawTotal / 25) * 100);
    const safePointsToUse = Math.max(
      0,
      Math.min(Math.floor(pointsToUse / 100) * 100, usableUserPoints, pointsNeeded)
    );
    const rawDiscount = (safePointsToUse / 100) * 25;
    const pointsDiscount = Math.min(rawTotal, rawDiscount);
    const discountRatio = rawTotal > 0 ? pointsDiscount / rawTotal : 0;

    const newBookings: Booking[] = [];
    cart.forEach((item) => {
      const itemDiscount = item.itemTotal * discountRatio;
      const finalItemPrice = Math.max(0, item.itemTotal - itemDiscount);

      const b = addBooking({
        userId: currentUser.id,
        spaceId: item.spaceId,
        spaceName: item.spaceName,
        spaceCity: item.spaceCity,
        spaceAddress: item.spaceAddress,
        spaceImage: item.spaceImage,
        type: item.type as BookingType,
        plan: item.plan,
        startTime: item.startTime,
        endTime: item.endTime,
        durationHours: item.durationHours,
        durationDays: item.durationDays,
        durationMonths: item.durationMonths,
        startDate: item.startDate,
        endDate: item.endDate,
        seats: item.seats,
        employees: item.employees || [],
        totalPrice: finalItemPrice,
        status: 'active',
        notes: item.notes,
      });
      newBookings.push(b);
    });

    const earned = cart.reduce((sum, item) => {
      const space = spaces.find((s) => s.id === item.spaceId);
      const multiplier = space?.loyaltyPointsMultiplier || 1;
      return sum + Math.floor(item.itemTotal / 100) * 10 * multiplier;
    }, 0);

    let freshestUser = currentUser;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cp_currentUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id === currentUser.id) {
            freshestUser = { ...currentUser, ...parsed };
          }
        }
      } catch (e) { }
    }

    const updatedPoints = Math.max(0, userPoints - safePointsToUse) + earned;
    const updatedUser = { ...freshestUser, loyaltyPoints: updatedPoints };
    setCurrentUser(updatedUser);
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);

    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }

    if (currentUser && safePointsToUse > 0) {
      createPointsTransactionApi({
        userId: currentUser.id,
        type: 'REDEEMED',
        points: safePointsToUse,
        description: `Redeemed points for checkout discount (SAR ${pointsDiscount} off)`,
      }).then(res => {
        if (res.success) {
          getLoyaltyPointsApi(currentUser.id).then(ptsRes => {
            if (ptsRes.success && Array.isArray(ptsRes.data)) {
              const uPts = ptsRes.data.find((p: any) => p.userId === currentUser.id);
              if (uPts && typeof uPts.availableBalance === 'number') {
                const syncedUser = { ...currentUser, loyaltyPoints: uPts.availableBalance };
                setCurrentUser(syncedUser);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('cp_currentUser', JSON.stringify(syncedUser));
                }
              }
            }
          }).catch(() => { });
        }
      }).catch(() => { });
    }

    clearCart();

    addNotification({
      userId: currentUser.id,
      title: 'Batch Checkout Successful',
      message: `Payment confirmed for ${newBookings.length} workspace pass${newBookings.length > 1 ? 'es' : ''
        }.${safePointsToUse > 0 ? ` Redeemed ${safePointsToUse} points for SAR ${pointsDiscount} off.` : ''} Earned ${earned} loyalty points!`,
      type: 'payment',
    });

    showToast(
      `Payment processed! ${newBookings.length} pass${newBookings.length > 1 ? 'es' : ''
      } confirmed (+${earned} points).`,
      'success'
    );

    return newBookings;
  };

  const DEFAULT_PLATFORM_AMENITIES = [
    'High-Speed WiFi',
    'Parking',
    'Coffee & Tea',
    'Printing',
    'Meeting Rooms',
    'Phone Booths',
    'Reception',
    '24/7 Access',
    'Accessibility',
    'Prayer Room',
    'Locker',
    'Gym Access',
    'Rooftop',
    'Event Space',
    '4K Projector',
    'Surround Sound',
    'Stage Lighting',
  ];

  const getApprovedAmenities = (): string[] => {
    const combined = new Set([...DEFAULT_PLATFORM_AMENITIES, ...approvedCustomAmenities]);
    return Array.from(combined);
  };

  const requestCustomAmenity = (amenityName: string, spaceId?: string, spaceName?: string) => {
    const trimmed = amenityName.trim();
    if (!trimmed) {
      return { success: false, message: 'Amenity name cannot be empty.' };
    }

    const allApproved = getApprovedAmenities();
    if (allApproved.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: `"${trimmed}" is already an available amenity.` };
    }

    const existingReq = amenityRequests.find(
      r => r.amenityName.toLowerCase() === trimmed.toLowerCase() && r.status === 'PENDING_APPROVAL'
    );
    if (existingReq) {
      return { success: false, message: `A request for "${trimmed}" is already pending admin approval.` };
    }

    const newReq: AmenityRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      amenityName: trimmed,
      providerId: currentUser?.id || 'user-p1',
      providerName: currentUser?.name || 'Workspace Provider',
      spaceId,
      spaceName,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
    };

    const updated = [newReq, ...amenityRequests];
    setAmenityRequests(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_amenity_requests', JSON.stringify(updated));
    }

    (async () => {
      try {
        const storedToken = getStoredToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

        const res = await fetch(`${getApiBaseUrl()}/amenities`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: trimmed,
            icon: 'Sparkles',
            isDefault: false,
            requestedBy: currentUser?.id || 'user-p1',
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.amenity?.id) {
            setAmenityRequests(prev => prev.map(r => r.id === newReq.id ? { ...r, id: resData.amenity.id } : r));
          }
        }
      } catch (err) {
        console.warn('Failed to save custom amenity to database:', err);
      }
    })();

    addNotification({
      userId: 'admin',
      title: 'New Custom Amenity Request',
      message: `${currentUser?.name || 'Provider'} requested custom amenity "${trimmed}"${spaceName ? ` for ${spaceName}` : ''}.`,
      type: 'system',
    });

    showToast(`Amenity request for "${trimmed}" submitted to Admin for approval.`, 'info');
    return { success: true, message: 'Request submitted successfully!', request: newReq };
  };

  const approveAmenityRequest = (requestId: string) => {
    const req = amenityRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedReqs = amenityRequests.map(r =>
      r.id === requestId ? { ...r, status: 'APPROVED' as AmenityRequestStatus } : r
    );
    setAmenityRequests(updatedReqs);

    const existsInApproved = approvedCustomAmenities.some(
      a => a.toLowerCase() === req.amenityName.toLowerCase()
    );
    const newApproved = existsInApproved ? approvedCustomAmenities : [...approvedCustomAmenities, req.amenityName];
    setApprovedCustomAmenities(newApproved);

    if (req.spaceId) {
      const targetSpace = spaces.find(s => s.id === req.spaceId);
      if (targetSpace && !targetSpace.amenities.includes(req.amenityName)) {
        updateSpace(targetSpace.id, {
          amenities: [...targetSpace.amenities, req.amenityName],
        });
      }
    }

    (async () => {
      try {
        const storedToken = getStoredToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

        let putRes = await fetch(`${getApiBaseUrl()}/amenities/${requestId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: 'APPROVED' }),
        });

        if (!putRes.ok) {
          const postRes = await fetch(`${getApiBaseUrl()}/amenities`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: req.amenityName,
              icon: 'Sparkles',
              isDefault: false,
              requestedBy: req.providerId || currentUser?.id || 'user-p1',
            }),
          });
          if (postRes.ok) {
            const postData = await postRes.json();
            const realId = postData.amenity?.id || postData.id;
            if (realId) {
              await fetch(`${getApiBaseUrl()}/amenities/${realId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'APPROVED' }),
              });
            }
          }
        }
      } catch (err) {
        console.warn('Failed to approve amenity in database:', err);
      }
    })();

    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_amenity_requests', JSON.stringify(updatedReqs));
      localStorage.setItem('cp_approved_amenities', JSON.stringify(newApproved));
    }

    addNotification({
      userId: req.providerId,
      title: 'Amenity Request Approved',
      message: `Your custom amenity request "${req.amenityName}" has been approved by the Admin and added to the platform catalog!`,
      type: 'system',
    });

    showToast(`Approved custom amenity "${req.amenityName}".`, 'success');
  };

  const rejectAmenityRequest = (requestId: string, reason?: string) => {
    const req = amenityRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedReqs = amenityRequests.map(r =>
      r.id === requestId
        ? { ...r, status: 'REJECTED' as AmenityRequestStatus, rejectionReason: reason || 'Does not meet catalog guidelines.' }
        : r
    );
    setAmenityRequests(updatedReqs);

    (async () => {
      try {
        const storedToken = getStoredToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

        let putRes = await fetch(`${getApiBaseUrl()}/amenities/${requestId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: 'REJECTED' }),
        });

        if (!putRes.ok) {
          const postRes = await fetch(`${getApiBaseUrl()}/amenities`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: req.amenityName,
              icon: 'Sparkles',
              isDefault: false,
              requestedBy: req.providerId || currentUser?.id || 'user-p1',
            }),
          });
          if (postRes.ok) {
            const postData = await postRes.json();
            const realId = postData.amenity?.id || postData.id;
            if (realId) {
              await fetch(`${getApiBaseUrl()}/amenities/${realId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'REJECTED' }),
              });
            }
          }
        }
      } catch (err) {
        console.warn('Failed to reject amenity in database:', err);
      }
    })();

    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_amenity_requests', JSON.stringify(updatedReqs));
    }

    addNotification({
      userId: req.providerId,
      title: 'Amenity Request Rejected',
      message: `Your custom amenity request "${req.amenityName}" was rejected by the Admin.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'system',
    });

    showToast(`Rejected custom amenity request "${req.amenityName}".`, 'error');
  };

  const addSupportTicket: AppContextType['addSupportTicket'] = (ticketData) => {
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      status: ticketData.status || 'open',
      priority: ticketData.priority || (ticketData.category === 'complaint' ? 'high' : ticketData.category === 'refund' ? 'medium' : 'low'),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ...ticketData,
    };
    const updated = [newTicket, ...supportTickets];
    setSupportTickets(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_support_tickets', JSON.stringify(updated));
    }

    // Sync to PostgreSQL DB Ticket table
    (async () => {
      try {
        const compRes = await getCompaniesApi();
        const companies = compRes.success && Array.isArray(compRes.data) ? compRes.data : [];
        const compId = currentUser?.companyId || companies[0]?.id;
        if (compId) {
          await createTicketApi({
            companyId: compId,
            userId: currentUser?.id || newTicket.userId || 'user-1',
            subject: newTicket.subject || newTicket.message || 'Support Inquiry',
          });
        }
      } catch (err) {
        console.warn('DB Ticket sync notice:', err);
      }
    })();

    showToast(`Support ticket ${newTicket.ticketNumber} logged successfully`, 'success');
    return newTicket;
  };

  const updateTicketStatus = (id: string, status: TicketStatus, notes?: string) => {
    const updated = supportTickets.map((t) =>
      t.id === id
        ? {
          ...t,
          status,
          adminNotes: notes !== undefined ? notes : t.adminNotes,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        }
        : t
    );
    setSupportTickets(updated);

    const dbStatus = status === 'in-progress' ? 'IN_PROGRESS' : status === 'closed' || status === 'resolved' ? 'CLOSED' : 'OPEN';
    updateTicketStatusApi(id, dbStatus).catch((err) => console.warn('DB Ticket status sync notice:', err));

    showToast(`Ticket status updated to ${status}`, 'success');
  };

  const replyToTicket = (id: string, reply: string, newStatus: TicketStatus = 'resolved') => {
    const ticket = supportTickets.find((t) => t.id === id);
    const updated = supportTickets.map((t) =>
      t.id === id
        ? {
          ...t,
          adminReply: reply,
          status: newStatus,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        }
        : t
    );
    setSupportTickets(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_support_tickets', JSON.stringify(updated));
    }

    // Sync reply to PostgreSQL DB TicketReply table
    (async () => {
      try {
        await createTicketReplyApi({
          ticketId: id,
          userId: currentUser?.id || 'admin-1',
          message: reply,
        });
      } catch (err) {
        console.warn('DB TicketReply sync notice:', err);
      }
    })();

    if (ticket && ticket.userId) {
      addNotification({
        userId: ticket.userId,
        title: `Response to Ticket ${ticket.ticketNumber}`,
        message: `Admin Response: "${reply}"`,
        type: 'system',
      });
    }

    showToast(`Response sent to customer`, 'success');
  };

  const deleteBooking = (bookingId: string) => {
    const updated = bookings.filter((b) => b.id !== bookingId);
    setBookings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_bookings', JSON.stringify(updated));
    }
    deleteDirectBooking(bookingId);
    showToast('Booking deleted permanently', 'info');
  };

  const deleteAmenityRequest = (requestId: string) => {
    const updated = amenityRequests.filter((r) => r.id !== requestId);
    setAmenityRequests(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_amenity_requests', JSON.stringify(updated));
    }
    (async () => {
      try {
        const storedToken = getStoredToken();
        const headers: Record<string, string> = {};
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
        await fetch(`${getApiBaseUrl()}/amenities/${requestId}`, {
          method: 'DELETE',
          headers,
        });
      } catch (err) {
        console.warn('Failed to delete amenity from database:', err);
      }
    })();
    showToast('Amenity deleted from catalog', 'info');
  };

  return (
    <AppContext.Provider value={{
      nav, navigate, goBack,
      partners, fetchPartners, createPartner, updatePartner, deletePartner, approvePartner, rejectPartner,
      workspacesApi, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace,
      hourlyBookingsApi, fetchHourlyBookings, createHourlyBooking, updateHourlyBooking, deleteHourlyBooking,
      payoutsApi, fetchPayouts, createPayout, updatePayout, deletePayout,
      membershipPlansApi, fetchMembershipPlans, createMembershipPlan, updateMembershipPlan, deleteMembershipPlan,
      subscriptionsApi, fetchSubscriptions, createSubscription, updateSubscription, deleteSubscription,
      getPassRefundEligibility, cancelSubscriptionPass,
      directBookingsApi, fetchDirectBookings, createDirectBooking, updateDirectBooking, deleteDirectBooking,
      paymentsApi, fetchPayments, createPayment, updatePayment, deletePayment,
      currentUser, login, signup, logout, setPendingUser, pendingUser,
      userLocation, locationStatus, locationErrorMessage, requestUserLocation,
      spaces, favorites, toggleFavorite, addSpace, updateSpace, toggleSpaceVisibility, deleteSpace,
      bookings, addBooking, cancelBooking, updateBookingStatus, deleteBooking,
      amenityRequests, approvedCustomAmenities, requestCustomAmenity, approveAmenityRequest, rejectAmenityRequest, deleteAmenityRequest, getApprovedAmenities,
      supportTickets, fetchTickets, addSupportTicket, updateTicketStatus, replyToTicket,
      notifications: userNotifications,
      unreadNotificationsCount: userNotifications.filter(n => !n.read).length,
      markNotificationRead, toggleNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications, addNotification, generateFakeNotification,
      users, fetchUsers, blockUser, unblockUser, changeUserRole,
      waitlist, autobooking, autobookingCard, joinWaitlist, leaveWaitlist, enableAutoBooking, disableAutoBooking,
      addPaymentCard,
      cart, isCartOpen, setIsCartOpen, openCart, closeCart, addToCart, removeFromCart, updateCartItemSeats, updateCartItem, clearCart, checkoutCart,
      applyLoyaltyDiscount,
      walletTransactions, fetchWallet, depositToWallet, withdrawFromWallet,
      companyWalletBalance, companyData, fetchCompanyWallet, depositToCompanyWallet,
      loyaltyRules, fetchLoyaltyRules, createLoyaltyProposal, updateLoyaltyRuleStatus, deleteLoyaltyRule,
      qrScans, fetchQrCheckIns, recordQrScan, getSpaceCrowding,
      toast, showToast, updateCurrentUser, completeSignup,
      otpSession, startOtpVerification, requestSignupOtp, requestForgotPasswordOtp, resetPassword, pendingResetUser, verifyOtp, resendOtp, cancelOtp,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}