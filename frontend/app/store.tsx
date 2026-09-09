'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Space, Booking, Screen, NavState, UserRole, BookingType, PaymentCard, Notification, CartItem, AmenityRequest, AmenityRequestStatus, calculateEndDate, isCancellationRefundEligible, getBookingPrice, OtpSession, SupportTicket, TicketStatus, Partner, WorkspaceApi, HourlyBookingApi, PayoutApi, MembershipPlanApi, SubscriptionApi, DirectBookingApi, PaymentApi } from '@/types/types';
import { INITIAL_SPACES, INITIAL_USERS, INITIAL_BOOKINGS, INITIAL_NOTIFICATIONS, INITIAL_SUPPORT_TICKETS } from '@/data/data';
import { registerUserApi, verifyEmailApi, loginUserApi, verifyLoginApi, mapRoleToFrontend } from '@/services/authApi';

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    const cleaned = envUrl.replace(/\/$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }
  return 'http://localhost:3001/api';
}

export const API_BASE_URL = getApiBaseUrl();


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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const storedToken = token || getStoredToken();
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const storedToken = token || getStoredToken();
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const storedToken = token || getStoredToken();
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const storedToken = token || getStoredToken();
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const storedToken = token || getStoredToken();
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const storedToken = token || getStoredToken();
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
    const response = await fetch(`${getApiBaseUrl()}/payments`, { method: 'GET', headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? (data as PaymentApi[]) : [];
  } catch (error: any) {
    return [];
  }
}

interface AppContextType {
  // Navigation
  nav: NavState;
  navigate: (screen: Screen, params?: Record<string, any>) => void;
  goBack: () => void;

  // Partners / Providers (GET, POST, PUT http://localhost:3001/api/partners)
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
    }>
  ) => Promise<{ success: boolean; partner?: Partner; error?: string }>;
  deletePartner: (partnerId: string) => Promise<{ success: boolean; error?: string }>;

  // Workspaces API (GET, POST, PUT, DELETE http://localhost:3001/api/workspaces)
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
    }>
  ) => Promise<{ success: boolean; workspace?: WorkspaceApi; error?: string }>;
  deleteWorkspace: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;

  // Hourly Bookings API (GET, POST, PUT, DELETE http://localhost:3001/api/hourly-bookings)
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

  // Payouts API (GET, POST, PUT, DELETE /api/payouts)
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

  // Membership Plans API (GET, POST, PUT, DELETE /api/membership-plans)
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

  // Subscriptions API (GET, POST, PUT, DELETE /api/subscriptions)
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

  // Direct Bookings API (GET, POST, PUT, DELETE /api/direct-bookings)
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

  // Payments API (GET, POST, PUT, DELETE /api/payments)
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


  // Support Tickets & Inquiries
  supportTickets: SupportTicket[];
  addSupportTicket: (ticketData: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'status' | 'priority'> & { status?: TicketStatus; priority?: SupportTicket['priority'] }) => SupportTicket;
  updateTicketStatus: (id: string, status: TicketStatus, notes?: string) => void;
  replyToTicket: (id: string, reply: string, newStatus?: TicketStatus) => void;

  // Auth & 2FA OTP
  currentUser: User | null;
  otpSession: OtpSession | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requireOtp?: boolean }>;
  signup: (name: string, email: string, password: string, phone: string) => User;
  requestSignupOtp: (newUser: User, role: UserRole, extraData?: Partial<User>) => Promise<{ success: boolean; error?: string; message?: string }>;
  requestForgotPasswordOtp: (email: string) => { success: boolean; error?: string };
  resetPassword: (newPassword: string) => { success: boolean; error?: string };
  completeSignup: (role: UserRole, extraData?: Partial<User>) => void;
  verifyOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<void>;
  cancelOtp: () => void;
  startOtpVerification: (session: OtpSession) => void;
  logout: () => void;
  setPendingUser: (user: Partial<User>) => void;
  pendingUser: Partial<User> | null;
  pendingResetUser: User | null;
  updateCurrentUser: (updates: Partial<User>) => void;

  // Location & Geolocation
  userLocation: { lat: number; lng: number } | null;
  locationStatus: 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';
  requestUserLocation: () => Promise<{ lat: number; lng: number } | null>;

  // Spaces
  spaces: Space[];
  favorites: string[];
  toggleFavorite: (spaceId: string) => void;
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (id: string, updates: Partial<Space>) => void;
  toggleSpaceVisibility: (id: string) => void;
  deleteSpace: (id: string) => void;

  // Bookings
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  cancelBooking: (id: string, refundMethod?: 'wallet' | 'card') => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;

  // Amenity Requests (Provider -> Admin)
  amenityRequests: AmenityRequest[];
  approvedCustomAmenities: string[];
  requestCustomAmenity: (amenityName: string, spaceId?: string, spaceName?: string) => { success: boolean; message: string; request?: AmenityRequest };
  approveAmenityRequest: (requestId: string) => void;
  rejectAmenityRequest: (requestId: string, reason?: string) => void;
  getApprovedAmenities: () => string[];

  // Notifications
  notifications: Notification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  toggleNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'read'> & { read?: boolean }) => Notification;
  generateFakeNotification: (presetType?: string, customTitle?: string, customMessage?: string) => Notification;

  // Users (admin)
  users: User[];
  blockUser: (id: string) => void;
  unblockUser: (id: string) => void;
  changeUserRole: (id: string, role: UserRole) => void;

  // Waitlist & Auto-booking
  waitlist: Record<string, boolean>;
  autobooking: Record<string, boolean>;
  autobookingCard: Record<string, string>;
  joinWaitlist: (spaceId: string) => void;
  leaveWaitlist: (spaceId: string) => void;
  enableAutoBooking: (spaceId: string, cardId: string) => void;
  disableAutoBooking: (spaceId: string) => void;

  // Payment cards
  addPaymentCard: (card: Omit<PaymentCard, 'id'>) => PaymentCard;

  // Shopping Cart (نفس كودك الأصلي تماماً)
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemSeats: (cartItemId: string, seats: number) => void;
  updateCartItem: (cartItemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  checkoutCart: (pointsToUse?: number) => Booking[];

  // Loyalty Points (الميزة المضافة من كودهم)
  applyLoyaltyDiscount: (pointsToUse: number) => { discount: number; safePoints: number };

  // Toast
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
  const [spaces, setSpaces] = useState<Space[]>(INITIAL_SPACES);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [favorites, setFavorites] = useState<string[]>(['space-1', 'space-3']);
  const [waitlist, setWaitlist] = useState<Record<string, boolean>>({});
  const [autobooking, setAutobooking] = useState<Record<string, boolean>>({});
  const [autobookingCard, setAutobookingCard] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<AppContextType['toast']>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
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
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [workspacesApi, setWorkspacesApi] = useState<WorkspaceApi[]>([]);
  const [hourlyBookingsApi, setHourlyBookingsApi] = useState<HourlyBookingApi[]>([]);
  const [payoutsApi, setPayoutsApi] = useState<PayoutApi[]>([]);
  const [membershipPlansApi, setMembershipPlansApi] = useState<MembershipPlanApi[]>([]);
  const [subscriptionsApi, setSubscriptionsApi] = useState<SubscriptionApi[]>([]);
  const [directBookingsApi, setDirectBookingsApi] = useState<DirectBookingApi[]>([]);
  const [paymentsApi, setPaymentsApi] = useState<PaymentApi[]>([]);

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

  const fetchDirectBookings = async (): Promise<DirectBookingApi[]> => {
    try {
      const data = await fetchDirectBookingsFromApi();
      if (Array.isArray(data)) setDirectBookingsApi(data);
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

  const createPayment = async (paymentData: {
    userId: string;
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

  const fetchPartners = async (): Promise<Partner[]> => {
    try {
      const data = await fetchPartnersFromApi();
      if (Array.isArray(data) && data.length > 0) {
        setPartners(data);
      }
      return data;
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
        const dbSpaces: Space[] = data.map((w) => ({
          id: w.id,
          name: w.name,
          city: w.city,
          district: '',
          address: w.city,
          description: `Workspace managed by ${w.partner?.brandName || 'Partner'}`,
          type: 'private-office',
          images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'],
          amenities: ['High-Speed Wi-Fi', 'Coffee Bar', 'Meeting Rooms'],
          totalCapacity: w.totalCapacity || 50,
          availableCapacity: w.totalCapacity || 50,
          pricing: {
            daily: w.dailyRate || 100,
            monthly: w.monthlyRate || 2000,
            yearly: w.yearlyRate || 20000,
          },
          rating: 4.8,
          reviewCount: 12,
          isVisible: true,
          isFeatured: false,
          openHours: '08:00 AM - 10:00 PM',
          phone: '+966 50 000 0000',
          email: w.partner?.contactEmail || 'contact@coworkingpass.sa',
          ownerId: w.partnerId,
        }));

        setSpaces((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newDbSpaces = dbSpaces.filter((s) => !existingIds.has(s.id));
          return [...newDbSpaces, ...prev];
        });
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

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update workspace');
      }

      const updatedWorkspace: WorkspaceApi = resData.workspace || resData;
      setWorkspacesApi((prev) =>
        prev.map((w) => (w.id === workspaceId ? { ...w, ...updatedWorkspace } : w))
      );
      showToast(`Workspace updated successfully`, 'success');
      return { success: true, workspace: updatedWorkspace };
    } catch (err: any) {
      console.error(`Error updating workspace via PUT /api/workspaces/${workspaceId}:`, err);
      showToast(err.message || 'Failed to update workspace', 'error');
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

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
      setPartners((prev) => [newPartner, ...prev]);
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
      setPartners((prev) =>
        prev.map((p) => (p.id === partnerId ? { ...p, ...updatedPartner } : p))
      );
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

      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
      showToast(`Partner deleted successfully`, 'success');
      return { success: true };
    } catch (err: any) {
      console.error(`Error deleting partner via DELETE /api/partners/${partnerId}:`, err);
      showToast(err.message || 'Failed to delete partner', 'error');
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchPartners().catch(() => {});
    fetchWorkspaces().catch(() => {});
    fetchHourlyBookings().catch(() => {});
    fetchPayouts().catch(() => {});
    fetchMembershipPlans().catch(() => {});
    fetchSubscriptions().catch(() => {});
    fetchDirectBookings().catch(() => {});
    fetchPayments().catch(() => {});
  }, []);

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
        const parsed = JSON.parse(savedUser);
        if (parsed.avatar && (parsed.avatar.includes('images.unsplash.com') || parsed.avatar.includes('admin-avatar'))) {
          parsed.avatar = '';
          localStorage.setItem('cp_currentUser', JSON.stringify(parsed));
        }
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

      const savedTickets = localStorage.getItem('cp_support_tickets');
      if (savedTickets) {
        try {
          setSupportTickets(JSON.parse(savedTickets));
        } catch (e) {
          setSupportTickets(INITIAL_SUPPORT_TICKETS);
        }
      } else {
        localStorage.setItem('cp_support_tickets', JSON.stringify(INITIAL_SUPPORT_TICKETS));
      }
    } catch (e) {
      console.error('Failed to load storage state:', e);
    }
  }, []);

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
    // 1. Attempt login with backend API: POST http://localhost:3001/api/auth/login
    const apiRes = await loginUserApi({ email, password });
    if (apiRes.success && apiRes.userId) {
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        user = {
          id: apiRes.userId,
          name: email.split('@')[0],
          email,
          password,
          role: 'individual',
          phone: '',
          avatar: '',
          isBlocked: false,
          joinDate: new Date().toISOString().split('T')[0],
          loyaltyPoints: 0,
        };
      }
      const session: OtpSession = {
        user,
        targetEmailOrPhone: email,
        mode: 'login',
        role: user.role,
        userId: apiRes.userId,
        backendSynced: true,
      };
      setOtpSession(session);
      navigate('otp-verify');
      showToast(apiRes.message || `Verification code sent to ${email}`, 'info');
      return { success: true, requireOtp: true };
    }

    // 2. Fallback to local stored user / mock authentication
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      user = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    }
    if (!user) {
      return { success: false, error: apiRes.error || 'Invalid email or password. Please try again.' };
    }
    if (user.isBlocked) {
      return { success: false, error: 'Your account has been suspended. Please contact support.' };
    }

    const session: OtpSession = {
      user,
      targetEmailOrPhone: user.email || email,
      mode: 'login',
      role: user.role,
    };
    setOtpSession(session);
    navigate('otp-verify');
    showToast(`Verification code sent to ${user.email}`, 'info');
    return { success: true, requireOtp: true };
  };

  const signup = (name: string, email: string, password: string, phone: string) => {
    const generatedUsername = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`;
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      username: generatedUsername,
      email,
      password,
      role: 'individual',
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
    // 1. Call Backend API: POST http://localhost:3001/api/auth/register
    const apiRes = await registerUserApi({
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: role || newUser.role || 'individual',
    });

    if (!apiRes.success && apiRes.error && !apiRes.error.includes('Network connection issue')) {
      showToast(apiRes.error, 'error');
      return { success: false, error: apiRes.error };
    }

    const session: OtpSession = {
      user: newUser,
      targetEmailOrPhone: newUser.email || newUser.phone,
      mode: 'signup',
      role,
      extraData,
      userId: apiRes.userId,
      backendSynced: Boolean(apiRes.userId),
    };
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

  const verifyOtp = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!otpSession) {
      return { success: false, error: 'No active verification session. Please sign in again.' };
    }
    const cleanCode = code.trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return { success: false, error: 'Please enter a valid 6-digit verification code.' };
    }

    if (otpSession.mode === 'login') {
      let user = otpSession.user;
      if (otpSession.userId) {
        // Backend Login OTP Verification: POST http://localhost:3001/api/auth/verify-login
        const apiRes = await verifyLoginApi({ userId: otpSession.userId, code: cleanCode });
        if (!apiRes.success) {
          return { success: false, error: apiRes.error || 'Invalid verification code. Please try again.' };
        }
        if (apiRes.token && typeof window !== 'undefined') {
          localStorage.setItem('cp_token', apiRes.token);
        }
        if (apiRes.user) {
          const userRole = mapRoleToFrontend(apiRes.user.role);
          user = {
            ...user,
            id: apiRes.user.id || user.id,
            name: apiRes.user.name || user.name,
            email: apiRes.user.email || user.email,
            role: userRole,
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

    // signup mode
    if (otpSession.userId) {
      // Backend Email OTP Verification: POST http://localhost:3001/api/auth/verify-email
      const apiRes = await verifyEmailApi({ userId: otpSession.userId, code: cleanCode });
      if (!apiRes.success) {
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
    setCurrentUser(updated);
    setPendingUser(null);
    setOtpSession(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updated));
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }
    if (updated.role === 'organization') navigate('org-dashboard');
    else if (updated.role === 'provider') navigate('provider-dashboard');
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
      });
      if (apiRes.userId) {
        setOtpSession(prev => prev ? { ...prev, userId: apiRes.userId } : null);
      }
    } else if (otpSession.mode === 'login' && otpSession.user) {
      const apiRes = await loginUserApi({
        email: otpSession.user.email,
        password: otpSession.user.password,
      });
      if (apiRes.userId) {
        setOtpSession(prev => prev ? { ...prev, userId: apiRes.userId } : null);
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
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
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

  const requestUserLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setLocationStatus('unsupported');
      showToast('Geolocation is not supported by your browser.', 'error');
      return null;
    }

    if (userLocation) {
      return userLocation;
    }

    setLocationStatus('loading');
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          setLocationStatus('granted');
          resolve(coords);
        },
        error => {
          console.warn('Geolocation error:', error);
          setLocationStatus('denied');
          if (error.code === 1) { // PERMISSION_DENIED
            showToast('Location permission was denied. Workspaces will be sorted without distance.', 'info');
          } else {
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

    const newSpace: Space = {
      ...space,
      id: `space-${Date.now()}`,
      latitude: lat,
      longitude: lng,
      coordinates: { lat, lng },
    };
    setSpaces(prev => [...prev, newSpace]);
    showToast('Space added successfully.');

    // Persist new workspace to backend database with valid partnerId
    (async () => {
      try {
        let currentPartners = partners;
        if (currentPartners.length === 0) {
          currentPartners = await fetchPartners();
        }

        let validPartnerId = currentPartners.find(p => p.id === space.ownerId)?.id || currentPartners[0]?.id;

        if (!validPartnerId) {
          // Auto-create a Partner record in DB if no partner exists yet
          const partnerRes = await createPartner({
            brandName: (space as any).providerName || space.name || 'Default Partner',
            contactEmail: `contact-${Date.now()}@coworkingpass.sa`,
            taxNumber: '300000000000003',
            revenueSharePercentage: 20,
          });
          if (partnerRes.success && partnerRes.partner) {
            validPartnerId = partnerRes.partner.id;
          }
        }

        if (validPartnerId) {
          await createWorkspace({
            partnerId: validPartnerId,
            name: space.name,
            city: space.city || 'Riyadh',
            dailyRate: space.pricing?.daily || 50,
            monthlyRate: space.pricing?.monthly || 800,
            yearlyRate: space.pricing?.yearly || 8000,
            passVisitValue: 15,
            totalCapacity: space.totalCapacity || 30,
          });
        }
      } catch (err) {
        console.warn('Database workspace save notice:', err);
      }
    })();
  };

  const updateSpace = (id: string, updates: Partial<Space>) => {
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    showToast('Space updated successfully.');
  };

  const toggleSpaceVisibility = (id: string) => {
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
  };

  const deleteSpace = (id: string) => {
    setSpaces(prev => prev.filter(s => s.id !== id));
    showToast('Space deleted.');
  };

  const addBooking = (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...booking,
      id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBookings(prev => [...prev, newBooking]);
    
    // Auto-calculate loyalty points earned
    const space = spaces.find(s => s.id === booking.spaceId);
    const multiplier = space?.loyaltyPointsMultiplier || 1;
    const earnedPoints = Math.floor((booking.totalPrice || 0) / 100) * 10 * multiplier;

    if (currentUser && currentUser.id === booking.userId && earnedPoints > 0) {
      const updatedUser = {
        ...currentUser,
        loyaltyPoints: (currentUser.loyaltyPoints || 0) + earnedPoints,
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (typeof window !== 'undefined') {
        localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
      }
    }

    setNotifications(prev => [{
      id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: booking.userId,
      title: 'Booking confirmed',
      message: `${booking.spaceName} confirmed.${earnedPoints > 0 ? ` Earned ${earnedPoints} loyalty points!` : ''}`,
      type: 'booking',
      read: false,
      createdAt: new Date().toLocaleString(),
    }, ...prev]);

    setSpaces(prev => prev.map(s =>
      s.id === booking.spaceId
        ? { ...s, availableCapacity: Math.max(0, s.availableCapacity - booking.seats) }
        : s
    ));
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
      setNotifications(prev => [{
        id: `notification-${Date.now()}`,
        userId: booking.userId,
        title: `Booking ${status}`,
        message: `${booking.spaceName} booking status was updated to ${status}.`,
        type: status === 'cancelled' ? 'cancelled' : 'booking',
        read: false,
        createdAt: new Date().toLocaleString(),
      }, ...prev]);
    }
  };

  const userNotifications = currentUser ? notifications.filter(n => n.userId === currentUser.id || currentUser.role === 'admin') : [];

  const markNotificationRead = (id: string) => setNotifications(prev => {
    const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
    if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
    return updated;
  });

  const toggleNotificationRead = (id: string) => setNotifications(prev => {
    const updated = prev.map(n => n.id === id ? { ...n, read: !n.read } : n);
    if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
    return updated;
  });

  const markAllNotificationsRead = () => setNotifications(prev => {
    const updated = prev.map(n => userNotifications.some(u => u.id === n.id) ? { ...n, read: true } : n);
    if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
    return updated;
  });

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

  const joinWaitlist = (spaceId: string) => {
    const userId = currentUser?.id || 'user-1';
    const key = `${userId}_${spaceId}`;
    setWaitlist(prev => ({ ...prev, [key]: true }));
    const space = spaces.find(s => s.id === spaceId);
    addNotification({
      userId,
      title: 'Joined Waitlist',
      message: `You joined the waitlist for ${space?.name || 'the workspace'}. We'll notify you as soon as a spot opens!`,
      type: 'info',
    });
    showToast('You have joined the priority waitlist! We\'ll notify you when a spot opens.');
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

  // دوال السلة الخاصة بك
  const saveCartToStorage = (newCart: CartItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cp_cart', JSON.stringify(newCart));
      } catch (e) {
        console.error('Failed to save cart state:', e);
      }
    }
  };

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    const newItem: CartItem = {
      ...item,
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [...cart, newItem];
    setCart(updated);
    saveCartToStorage(updated);
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

        // Recalculate end date if start date, plan or durationMonths updated
        if (updates.startDate !== undefined || updates.plan !== undefined || updates.durationMonths !== undefined) {
          const sDate = updates.startDate ?? i.startDate;
          const plan = updates.plan ?? i.plan;
          const durM = updates.durationMonths ?? i.durationMonths ?? 1;
          newItem.endDate = calculateEndDate(sDate, plan, durM);
        }

        // Recalculate end time for hourly plan if startTime or durationHours changed
        if (newItem.plan === 'hourly' && newItem.startTime) {
          const durH = newItem.durationHours || 1;
          const [h, m] = newItem.startTime.split(':').map(Number);
          if (!isNaN(h)) {
            const endH = (h + durH) % 24;
            newItem.endTime = `${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
          }
        }

        // Recalculate item total price
        const seats = newItem.seats || 1;
        if (newItem.plan === 'hourly') {
          const hours = newItem.durationHours || 1;
          newItem.itemTotal = newItem.pricePerSeat * hours * seats;
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

  // دالة استخدام النقاط كخصم (من كودهم)
  const applyLoyaltyDiscount = (pointsToUse: number) => {
    if (!currentUser) return { discount: 0, safePoints: 0 };
    const availablePoints = currentUser.loyaltyPoints || 0;
    const safePoints = Math.max(0, Math.min(Math.floor(pointsToUse / 100) * 100, availablePoints));
    const discount = (safePoints / 100) * 25; // كل 100 نقطة = 25 ريالاً
    return { discount, safePoints };
  };

  // دالة الدفع مع إبقاء التوقيع نفسه، وتحديث النقاط المكتسبة تلقائياً
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

    // احتساب نقاط الولاء المكتسبة بناءً على كودهم
    const earned = cart.reduce((sum, item) => {
      const space = spaces.find((s) => s.id === item.spaceId);
      const multiplier = space?.loyaltyPointsMultiplier || 1;
      return sum + Math.floor(item.itemTotal / 100) * 10 * multiplier;
    }, 0);

    const updatedPoints = Math.max(0, userPoints - safePointsToUse) + earned;
    const updatedUser = { ...currentUser, loyaltyPoints: updatedPoints };
    setCurrentUser(updatedUser);
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);

    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }

    clearCart();

    addNotification({
      userId: currentUser.id,
      title: 'Batch Checkout Successful',
      message: `Payment confirmed for ${newBookings.length} workspace pass${
        newBookings.length > 1 ? 'es' : ''
      }.${safePointsToUse > 0 ? ` Redeemed ${safePointsToUse} points for SAR ${pointsDiscount} off.` : ''} Earned ${earned} loyalty points!`,
      type: 'payment',
    });

    showToast(
      `Payment processed! ${newBookings.length} pass${
        newBookings.length > 1 ? 'es' : ''
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

    // Notify Admin
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_support_tickets', JSON.stringify(updated));
    }
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

  return (
    <AppContext.Provider value={{
      nav, navigate, goBack,
      partners, fetchPartners, createPartner, updatePartner, deletePartner,
      workspacesApi, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace,
      hourlyBookingsApi, fetchHourlyBookings, createHourlyBooking, updateHourlyBooking, deleteHourlyBooking,
      payoutsApi, fetchPayouts, createPayout, updatePayout, deletePayout,
      membershipPlansApi, fetchMembershipPlans, createMembershipPlan, updateMembershipPlan, deleteMembershipPlan,
      subscriptionsApi, fetchSubscriptions, createSubscription, updateSubscription, deleteSubscription,
      directBookingsApi, fetchDirectBookings, createDirectBooking, updateDirectBooking, deleteDirectBooking,
      paymentsApi, fetchPayments, createPayment, updatePayment, deletePayment,
      currentUser, login, signup, logout, setPendingUser, pendingUser,
      userLocation, locationStatus, requestUserLocation,
      spaces, favorites, toggleFavorite, addSpace, updateSpace, toggleSpaceVisibility, deleteSpace,
      bookings, addBooking, cancelBooking, updateBookingStatus,
      amenityRequests, approvedCustomAmenities, requestCustomAmenity, approveAmenityRequest, rejectAmenityRequest, getApprovedAmenities,
      supportTickets, addSupportTicket, updateTicketStatus, replyToTicket,
      notifications: userNotifications,
      unreadNotificationsCount: userNotifications.filter(n => !n.read).length,
      markNotificationRead, toggleNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications, addNotification, generateFakeNotification,
      users, blockUser, unblockUser, changeUserRole,
      waitlist, autobooking, autobookingCard, joinWaitlist, leaveWaitlist, enableAutoBooking, disableAutoBooking,
      addPaymentCard,
      cart, addToCart, removeFromCart, updateCartItemSeats, updateCartItem, clearCart, checkoutCart,
      applyLoyaltyDiscount,
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
