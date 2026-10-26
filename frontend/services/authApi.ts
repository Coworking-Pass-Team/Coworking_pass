/**
 * Auth API Service
 * Handles communication between the frontend and backend authentication & OTP endpoints.
 */

function getAuthBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    const cleaned = envUrl.replace(/\/$/, '');
    return cleaned.endsWith('/api') ? cleaned.replace(/\/api$/, '') : cleaned;
  }
  if (typeof window !== 'undefined' && window.location?.port === '3001') {
    return 'http://localhost:3001';
  }
  return 'https://coworking-pass-k49w.onrender.com';
}


export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  orgName?: string;
  companyName?: string;
  businessName?: string;
  crNumber?: string;
  /** Company employees: the HR admin's email, which sends a join request for the HR admin to approve */
  companyHrEmail?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  userId?: string;
  devOtp?: string;
  error?: string;
}

export interface VerifyEmailPayload {
  userId: string;
  code: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  userId?: string;
  devOtp?: string;
  error?: string;
}

export interface VerifyLoginPayload {
  userId: string;
  code: string;
}

export interface VerifyLoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId?: string | null;
    companyName?: string | null;
    orgName?: string | null;
  };
  error?: string;
}

/**
 * Normalizes frontend role strings to backend Enum values
 */
export function mapRoleToBackend(role: string): string {
  const r = (role || '').toLowerCase().trim();
  if (r === 'organization' || r === 'hr_admin') return 'HR_ADMIN';
  if (r === 'provider' || r === 'partner_admin') return 'PARTNER_ADMIN';
  if (r === 'admin' || r === 'super_admin') return 'SUPER_ADMIN';
  if (r === 'guest') return 'GUEST';
  return 'B2C'; // Default individual role
}

/**
 * Normalizes backend Role enums to frontend UserRole
 */
export function mapRoleToFrontend(backendRole: string): 'individual' | 'organization' | 'provider' | 'admin' {
  const r = (backendRole || '').toUpperCase().trim();
  if (r === 'HR_ADMIN') return 'organization';
  if (r === 'PARTNER_ADMIN') return 'provider';
  if (r === 'SUPER_ADMIN') return 'admin';
  return 'individual';
}

/**
 * Register a new account with backend OTP email verification
 * Method: POST
 * URL: http://localhost:3001/api/auth/register
 */
export async function registerUserApi(payload: RegisterPayload): Promise<RegisterResponse> {
  const url = `${getAuthBaseUrl()}/api/auth/register`;
  try {
    const backendRole = mapRoleToBackend(payload.role);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        role: backendRole,
        orgName: payload.orgName?.trim(),
        companyName: payload.companyName?.trim(),
        businessName: payload.businessName?.trim(),
        crNumber: payload.crNumber?.trim(),
        companyHrEmail: payload.companyHrEmail?.trim().toLowerCase() || undefined,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Registration failed with status ${response.status}.`,
      };
    }

    return {
      success: true,
      message: data.message || 'Account created. Verification code sent to your email.',
      userId: data.userId,
      devOtp: data.devOtp,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] registerUserApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach authentication server.',
    };
  }
}

/**
 * Verify OTP code for email registration
 * Method: POST
 * URL: http://localhost:3001/api/auth/verify-email
 */
export async function verifyEmailApi(payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
  const url = `${getAuthBaseUrl()}/api/auth/verify-email`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: payload.userId,
        code: payload.code.trim(),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Invalid or expired verification code.',
      };
    }

    return {
      success: true,
      message: data.message || 'Account activated successfully.',
    };
  } catch (error: any) {
    console.warn('[API Network Exception] verifyEmailApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach authentication server.',
    };
  }
}

/**
 * Request OTP code for user login
 * Method: POST
 * URL: http://localhost:3001/api/auth/login
 */
export async function loginUserApi(payload: LoginPayload): Promise<LoginResponse> {
  const url = `${getAuthBaseUrl()}/api/auth/login`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Invalid email or password.',
      };
    }

    return {
      success: true,
      message: data.message || 'Verification code sent to your email.',
      userId: data.userId,
      devOtp: data.devOtp,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] loginUserApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach authentication server.',
    };
  }
}

/**
 * Verify OTP code for login and obtain session token
 * Method: POST
 * URL: http://localhost:3001/api/auth/verify-login
 */
export async function verifyLoginApi(payload: VerifyLoginPayload): Promise<VerifyLoginResponse> {
  const url = `${getAuthBaseUrl()}/api/auth/verify-login`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: payload.userId,
        code: payload.code.trim(),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Invalid or expired verification code.',
      };
    }

    return {
      success: true,
      message: data.message || 'Logged in successfully.',
      token: data.token,
      user: data.user,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] verifyLoginApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach authentication server.',
    };
  }
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

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export interface MembershipPlan {
  id: string;
  planName: string;
  type: string;
  totalVisitsAllowed: number;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function createDirectBookingApi(payload: {
  userId: string;
  workspaceId?: string;   // اختياري — الـ backend يبحث بـ spaceName لو لم يُرسَل UUID صحيح
  sectionId: string;
  durationType: string;
  durationDetails?: string;
  durationDays?: number;
  durationMonths?: number;
  bookingDate: string;
  status?: string;
  spaceName?: string;     // الاسم الأساسي لإيجاد الـ workspace في الداتابيس
  city?: string;          // المدينة الصحيحة للمساحة
}) {
  const url = `${getAuthBaseUrl()}/api/direct-bookings`;
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // حل userId — نحاول نجيب UUID صحيح من localStorage أو API
    let targetUserId = payload.userId;
    if (!uuidRegex.test(targetUserId)) {
      if (typeof window !== 'undefined') {
        const storedUserId = localStorage.getItem('cp_userId') || localStorage.getItem('userId');
        if (storedUserId && uuidRegex.test(storedUserId)) {
          targetUserId = storedUserId;
        }
      }
      if (!uuidRegex.test(targetUserId)) {
        try {
          const usersRes = await fetch(`${getAuthBaseUrl()}/api/users`, { headers: getAuthHeaders() });
          if (usersRes.ok) {
            const usersList = await usersRes.json();
            if (Array.isArray(usersList) && usersList.length > 0) {
              targetUserId = usersList[0].id;
            }
          }
        } catch (_) {}
      }
    }

    // نرسل spaceName و city للـ backend وهو يتولى إيجاد/إنشاء الـ workspace والـ section
    const finalPayload = {
      userId: targetUserId,
      spaceName: payload.spaceName,
      city: payload.city,             // المدينة الصحيحة للمساحة
      sectionId: payload.sectionId,   // backend سيتجاهله لو كان وهمياً وسيبحث بـ spaceName
      durationType: payload.durationType,
      durationDetails: payload.durationDetails,
      durationDays: payload.durationDays,
      durationMonths: payload.durationMonths,
      bookingDate: payload.bookingDate,
      status: payload.status || 'CONFIRMED',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(finalPayload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create direct booking' };
    }
    return { success: true, booking: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function updateDirectBookingApi(bookingId: string, updates: { status: string }) {
  const url = `${getAuthBaseUrl()}/api/direct-bookings/${bookingId}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update direct booking' };
    }
    return { success: true, booking: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deleteDirectBookingApi(bookingId: string) {
  const url = `${getAuthBaseUrl()}/api/direct-bookings/${bookingId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete direct booking' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function createCompanyApi(payload: { companyName: string; hrAdminId: string; totalPassesAllocated?: number }) {
  const url = `${getAuthBaseUrl()}/api/companies`;
  try {
    const companyName = payload.companyName?.trim() || 'New Organization';
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        companyName,
        hrAdminId: payload.hrAdminId,
        totalPassesAllocated: payload.totalPassesAllocated ?? 0,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create company' };
    }
    return { success: true, company: data.company || data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export interface PaymentItemApi {
  id: string;
  userId: string;
  workspaceId?: string;
  amount: number;
  method: string;
  paymentFor: string;
  referenceId?: string;
  gatewayTransactionId?: string;
  status: 'SUCCESS' | 'FAILED' | string;
  createdAt?: string;
  user?: { id?: string; name?: string; email?: string; role?: string };
  workspace?: { id?: string; name?: string; city?: string };
}

export async function getPaymentsApi() {
  const url = `${getAuthBaseUrl()}/api/payments`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch payments', data: [] };
    }
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error', data: [] };
  }
}

export async function createPaymentApi(payload: {
  userId: string;
  workspaceId?: string;
  amount: number;
  method: string;
  paymentFor: string;
  referenceId?: string;
  status?: string;
}) {
  const url = `${getAuthBaseUrl()}/api/payments`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to record payment' };
    }
    return { success: true, payment: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function updatePaymentApi(paymentId: string, payload: { status?: string; amount?: number; method?: string; paymentFor?: string }) {
  const url = `${getAuthBaseUrl()}/api/payments/${paymentId}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update payment' };
    }
    return { success: true, payment: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deletePaymentApi(paymentId: string) {
  const url = `${getAuthBaseUrl()}/api/payments/${paymentId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete payment' };
    }
    return { success: true, message: data.message || 'Payment deleted' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export interface PayoutItemApi {
  id: string;
  partnerId: string;
  billingMonth: string;
  totalVisitsReceived: number;
  amountDue: number;
  status: 'PENDING' | 'PAID' | string;
  createdAt?: string;
  partner?: { id?: string; brandName?: string; contactEmail?: string; taxNumber?: string; revenueSharePercentage?: number };
}

export async function getPayoutsApi() {
  const url = `${getAuthBaseUrl()}/api/payouts`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch payouts', data: [] };
    }
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error', data: [] };
  }
}

export async function createPayoutApi(payload: {
  partnerId: string;
  billingMonth: string;
  totalVisitsReceived: number;
  amountDue: number;
  status?: string;
}) {
  const url = `${getAuthBaseUrl()}/api/payouts`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create payout' };
    }
    return { success: true, payout: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function updatePayoutApi(payoutId: string, payload: { status?: string; billingMonth?: string; totalVisitsReceived?: number; amountDue?: number }) {
  const url = `${getAuthBaseUrl()}/api/payouts/${payoutId}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update payout' };
    }
    return { success: true, payout: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deletePayoutApi(payoutId: string) {
  const url = `${getAuthBaseUrl()}/api/payouts/${payoutId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete payout' };
    }
    return { success: true, message: data.message || 'Payout deleted' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export interface SubscriptionItemApi {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | string;
  visitsUsed?: number;
  user?: { id?: string; name?: string; email?: string; role?: string };
  plan?: { id?: string; planName?: string; price?: number; type?: string; totalVisitsAllowed?: number };
}

export async function getSubscriptionsApi() {
  const url = `${getAuthBaseUrl()}/api/subscriptions`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch subscriptions', data: [] };
    }
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error', data: [] };
  }
}

export async function createSubscriptionApi(payload: {
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status?: string;
}) {
  const url = `${getAuthBaseUrl()}/api/subscriptions`;
  try {
    // 1. Resolve real DB Plan ID from PostgreSQL membership plans
    let targetPlanId = payload.planId;
    const plansRes = await getMembershipPlansApi();
    if (plansRes.success && Array.isArray(plansRes.data) && plansRes.data.length > 0) {
      const dbPlans = plansRes.data;
      const exactMatch = dbPlans.find((p: any) => p.id === payload.planId);
      if (exactMatch) {
        targetPlanId = exactMatch.id;
      } else {
        const query = (payload.planId || '').toLowerCase();
        const matched = dbPlans.find((p: any) => {
          const name = (p.planName || '').toLowerCase();
          if (query === 'day' || query.includes('day')) return name.includes('day');
          if (query === 'monthly' || query.includes('month')) return name.includes('month');
          if (query === 'annual' || query.includes('annu') || query.includes('year')) return name.includes('annu') || name.includes('year');
          if (query === 'team' || query.includes('team')) return name.includes('team');
          if (query === 'enterprise' || query.includes('business')) return name.includes('business') || name.includes('enterp');
          return false;
        });
        if (matched) {
          targetPlanId = matched.id;
        } else {
          targetPlanId = dbPlans[0].id;
        }
      }
    }

    // 2. Resolve real DB User ID if stored in localStorage
    let targetUserId = payload.userId;
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('cp_userId') || localStorage.getItem('userId');
      if (storedUserId && (payload.userId.startsWith('u') || payload.userId.includes('b2c') || payload.userId.includes('org'))) {
        targetUserId = storedUserId;
      }
    }

    const finalPayload = {
      ...payload,
      userId: targetUserId,
      planId: targetPlanId,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(finalPayload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create subscription in database' };
    }
    return { success: true, data, subscription: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function updateSubscriptionApi(subscriptionId: string, updates: Partial<{ status: string; planId: string; startDate: string; endDate: string; visitsUsed: number }>) {
  const url = `${getAuthBaseUrl()}/api/subscriptions/${subscriptionId}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update subscription in database' };
    }
    return { success: true, data, subscription: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deleteSubscriptionApi(subscriptionId: string) {
  const url = `${getAuthBaseUrl()}/api/subscriptions/${subscriptionId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete subscription from database' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function getMembershipPlansApi() {
  const url = `${getAuthBaseUrl()}/api/membership-plans`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: data.error || 'Failed to fetch membership plans', data: [] };
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error', data: [] };
  }
}

export async function createMembershipPlanApi(payload: {
  planName: string;
  type: string;
  totalVisitsAllowed: number;
  price: number;
}) {
  const url = `${getAuthBaseUrl()}/api/membership-plans`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create plan' };
    }
    return { success: true, data, plan: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function updateMembershipPlanApi(planId: string, updates: Partial<{ planName: string; type: string; totalVisitsAllowed: number; price: number }>) {
  const url = `${getAuthBaseUrl()}/api/membership-plans/${planId}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update plan' };
    }
    return { success: true, data, plan: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deleteMembershipPlanApi(planId: string) {
  const url = `${getAuthBaseUrl()}/api/membership-plans/${planId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete plan' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export interface HourlyBookingItemApi {
  id: string;
  userId: string;
  workspaceId?: string;
  sectionId: string;
  packageId: string;
  startDate: string;
  endDate: string;
  hoursUsed?: number;
  seats?: number;
  paidAmount?: number | null;
  durationDetails?: string;
  status: string;
  attendeeIds?: string[];
  rescheduleCount?: number;
  createdAt?: string;
  user?: { id?: string; name: string; email: string };
  workspace?: { id: string; name: string; city: string; images?: string[] };
  section?: { id: string; name: string; nameAr?: string | null; type: string; workspace?: { id: string; name: string; city: string } };
  package?: { id: string; packageName: string; hoursAmount: number; price: number };
}

export async function getHourlyBookingsApi() {
  const url = `${getAuthBaseUrl()}/api/hourly-bookings`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch hourly bookings', data: [] };
    }
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error', data: [] };
  }
}

export async function createHourlyBookingApi(payload: {
  userId: string;
  workspaceId?: string;   // اختياري — الـ backend يطابق بالـ ID لو كان UUID صحيح
  sectionId: string;
  packageId: string;
  startDate: string;
  endDate: string;
  durationDetails?: string;
  status?: string;
  spaceName?: string;
  city?: string;          // مدينة المساحة لتسجيلها بشكل صحيح في الداتابيس
  sectionType?: 'DESK' | 'MEETING_ROOM' | 'THEATER';
}) {
  const url = `${getAuthBaseUrl()}/api/hourly-bookings`;
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // حل userId — نحاول نجيب UUID صحيح من localStorage أو API
    let targetUserId = payload.userId;
    if (!uuidRegex.test(targetUserId)) {
      if (typeof window !== 'undefined') {
        const storedUserId = localStorage.getItem('cp_userId') || localStorage.getItem('userId');
        if (storedUserId && uuidRegex.test(storedUserId)) {
          targetUserId = storedUserId;
        }
      }
      if (!uuidRegex.test(targetUserId)) {
        try {
          const usersRes = await fetch(`${getAuthBaseUrl()}/api/users`, { headers: getAuthHeaders() });
          if (usersRes.ok) {
            const usersList = await usersRes.json();
            if (Array.isArray(usersList) && usersList.length > 0) {
              targetUserId = usersList[0].id;
            }
          }
        } catch (_) {}
      }
    }

    // نرسل workspaceId و spaceName و sectionType و city للـ backend
    const finalPayload = {
      userId: targetUserId,
      workspaceId: payload.workspaceId,
      sectionId: payload.sectionId,
      packageId: payload.packageId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      durationDetails: payload.durationDetails,
      status: payload.status || 'ACTIVE',
      spaceName: payload.spaceName,
      city: payload.city,
      sectionType: payload.sectionType,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(finalPayload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create hourly booking in database' };
    }
    return { success: true, data, booking: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function updateHourlyBookingApi(bookingId: string, updates: Partial<{ status: string; startDate: string; endDate: string; hoursUsed: number }>) {
  const url = `${getAuthBaseUrl()}/api/hourly-bookings/${bookingId}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update hourly booking' };
    }
    return { success: true, data, booking: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deleteHourlyBookingApi(bookingId: string) {
  const url = `${getAuthBaseUrl()}/api/hourly-bookings/${bookingId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete hourly booking' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function getWorkspaceSectionsApi() {
  const url = `${getAuthBaseUrl()}/api/workspace-sections`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) return { success: false, data: [] };
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (_) {
    return { success: false, data: [] };
  }
}

export async function getHourlyPackagesApi() {
  const url = `${getAuthBaseUrl()}/api/hourly-packages`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) return { success: false, data: [] };

    let packages = Array.isArray(data) ? data : [];

    if (packages.length === 0) {
      try {
        const secRes = await getWorkspaceSectionsApi();
        if (secRes.success && Array.isArray(secRes.data) && secRes.data.length > 0) {
          const meetingSec = secRes.data.find((s: any) => ['MEETING_ROOM', 'THEATER'].includes(s.type)) || secRes.data[0];
          if (meetingSec) {
            const createPkgRes = await fetch(url, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                sectionId: meetingSec.id,
                packageName: 'Standard Hourly Package',
                hoursAmount: 10,
                periodType: 'PER_DAY',
                price: 150
              })
            });
            if (createPkgRes.ok) {
              const newPkgData = await createPkgRes.json();
              const createdPkg = newPkgData.hourlyPackage || newPkgData;
              if (createdPkg && createdPkg.id) {
                packages = [createdPkg];
              }
            }
          }
        }
      } catch (_) {}
    }

    return { success: true, data: packages };
  } catch (_) {
    return { success: false, data: [] };
  }
}

export interface PointsTransactionPayload {
  userId: string;
  type: 'EARNED' | 'REDEEMED';
  points: number;
  description?: string;
  referenceId?: string;
}

export async function createPointsTransactionApi(payload: PointsTransactionPayload) {
  const url = `${getAuthBaseUrl()}/api/points-transactions`;
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let targetUserId = payload.userId;

    if (!uuidRegex.test(targetUserId)) {
      if (typeof window !== 'undefined') {
        const storedUserId = localStorage.getItem('cp_userId') || localStorage.getItem('userId');
        if (storedUserId && uuidRegex.test(storedUserId)) {
          targetUserId = storedUserId;
        }
      }
      if (!uuidRegex.test(targetUserId)) {
        try {
          const usersRes = await fetch(`${getAuthBaseUrl()}/api/users`, { headers: getAuthHeaders() });
          if (usersRes.ok) {
            const usersList = await usersRes.json();
            if (Array.isArray(usersList) && usersList.length > 0) {
              targetUserId = usersList[0].id;
            }
          }
        } catch (_) {}
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...payload,
        userId: targetUserId,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to record points transaction' };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function getLoyaltyPointsApi(userId?: string) {
  const url = `${getAuthBaseUrl()}/api/loyalty-points${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) return { success: false, data: [] };
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (_) {
    return { success: false, data: [] };
  }
}

export async function getPointsTransactionsApi() {
  const url = `${getAuthBaseUrl()}/api/points-transactions`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) return { success: false, data: [] };
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (_) {
    return { success: false, data: [] };
  }
}

export interface QrCheckInPayload {
  userId: string;
  workspaceId: string;
  sectionId?: string;
  status?: string;
}

export async function createQrCheckInApi(payload: QrCheckInPayload) {
  const url = `${getAuthBaseUrl()}/api/qr-check-ins`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        sectionId: payload.sectionId || `sec-${payload.workspaceId}`,
        status: payload.status || 'VALID',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to record QR check-in' };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/** Public per-workspace check-in counters for today (no personal data, no sign-in needed). */
export async function getQrSummaryApi(): Promise<{ success: boolean; counts: Record<string, number> }> {
  try {
    const response = await fetch(`${getAuthBaseUrl()}/api/qr-check-ins?summary=today`, { method: 'GET', cache: 'no-store' });
    if (!response.ok) return { success: false, counts: {} };
    const data = await response.json().catch(() => ({}));
    return { success: true, counts: (data && typeof data.counts === 'object' && data.counts) || {} };
  } catch (_) {
    return { success: false, counts: {} };
  }
}

export async function getQrCheckInsApi() {
  const url = `${getAuthBaseUrl()}/api/qr-check-ins`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders(), cache: 'no-store' });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) return { success: false, data: [] };
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (_) {
    return { success: false, data: [] };
  }
}

export interface LoyaltyRulePayload {
  ruleName: string;
  ruleType: 'EARNING' | 'REDEMPTION';
  pointsValue: number;
  monetaryValue: number;
  description?: string;
  proposedBy: string;
  status?: string;
  workspaceId?: string;
  bonusMultiplier?: number;
}

export async function getLoyaltyRulesApi() {
  const url = `${getAuthBaseUrl()}/api/loyalty-rules`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) return { success: false, data: [] };
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (_) {
    return { success: false, data: [] };
  }
}

export async function createLoyaltyRuleApi(payload: LoyaltyRulePayload) {
  const url = `${getAuthBaseUrl()}/api/loyalty-rules`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to submit loyalty proposal' };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function updateLoyaltyRuleApi(id: string, payload: { status: string; approvedBy?: string; isActive?: boolean; adminFeedback?: string }) {
  const url = `${getAuthBaseUrl()}/api/loyalty-rules/${encodeURIComponent(id)}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update loyalty rule' };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deleteLoyaltyRuleApi(id: string) {
  const url = `${getAuthBaseUrl()}/api/loyalty-rules/${encodeURIComponent(id)}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete loyalty rule' };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function getCompaniesApi() {
  const url = `${getAuthBaseUrl()}/api/companies`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) return { success: false, data: [] };
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (_) {
    return { success: false, data: [] };
  }
}

export async function getCompanyApi(id: string) {
  const url = `${getAuthBaseUrl()}/api/companies/${id}`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json().catch(() => null);
    if (!response.ok) return { success: false, error: data?.error || 'Failed to fetch company' };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/** Adds an existing member account (by email) to the company team; HR admin or super admin only. */
export async function addCompanyEmployeeApi(companyId: string, email: string) {
  const url = `${getAuthBaseUrl()}/api/companies/${companyId}/employees`;
  try {
    const response = await fetch(url, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ email }) });
    const data = await response.json().catch(() => null);
    if (!response.ok) return { success: false as const, error: (data?.error as string) || 'Failed to add the team member.' };
    return { success: true as const, data: data as { id: string; name: string; email: string } };
  } catch (err: any) {
    return { success: false as const, error: err.message || 'Network error' };
  }
}

/** Removes a member from the company team (HR admin, super admin, or the member leaving). */
export async function removeCompanyEmployeeApi(companyId: string, userId: string) {
  const url = `${getAuthBaseUrl()}/api/companies/${companyId}/employees/${userId}`;
  try {
    const response = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() });
    const data = await response.json().catch(() => null);
    if (!response.ok) return { success: false as const, error: (data?.error as string) || 'Failed to remove the team member.' };
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, error: err.message || 'Network error' };
  }
}

export interface MyJoinRequest {
  id: string;
  status: string;
  createdAt: string;
  company: { companyName: string; hrAdmin?: { name?: string; email?: string } };
}

export interface CompanyJoinRequestItem {
  id: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

async function joinRequestCall<T>(path: string, init: RequestInit, fallbackError: string) {
  try {
    const response = await fetch(`${getAuthBaseUrl()}/api/company-join-requests${path}`, { ...init, headers: getAuthHeaders() });
    const data = await response.json().catch(() => null);
    if (!response.ok) return { success: false as const, error: (data?.error as string) || fallbackError };
    return { success: true as const, data: data as T };
  } catch (err: any) {
    return { success: false as const, error: err.message || 'Network error' };
  }
}

/** The signed-in member's pending request to join a company, if any. */
export const getMyJoinRequestApi = () =>
  joinRequestCall<{ request: MyJoinRequest | null; company: { id: string; companyName: string } | null }>('', { method: 'GET' }, 'Failed to load your join request.');

/** A member asks to join the company whose HR admin uses this email. */
export const createJoinRequestApi = (hrEmail: string) =>
  joinRequestCall<{ id: string; status: string; companyName: string }>('', { method: 'POST', body: JSON.stringify({ hrEmail }) }, 'Failed to send the join request.');

/** The member withdraws their pending request. */
export const cancelJoinRequestApi = (id: string) =>
  joinRequestCall<{ status: string }>(`/${id}`, { method: 'DELETE' }, 'Failed to withdraw the join request.');

/** Pending requests to join the HR admin's company. */
export const listCompanyJoinRequestsApi = () =>
  joinRequestCall<CompanyJoinRequestItem[]>('', { method: 'GET' }, 'Failed to load join requests.');

/** The HR admin approves or declines a join request. */
export const answerJoinRequestApi = (id: string, action: 'approve' | 'decline') =>
  joinRequestCall<{ status: string }>(`/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) }, 'Failed to answer the join request.');

export async function depositCompanyWalletApi(companyId: string, amount: number, options?: { description?: string; referenceId?: string }) {
  const url = `${getAuthBaseUrl()}/api/companies/${companyId}/deposit`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, ...(options?.description ? { description: options.description } : {}), ...(options?.referenceId ? { referenceId: options.referenceId } : {}) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: data.error || 'Failed to deposit to company wallet' };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function withdrawCompanyWalletApi(companyId: string, amount: number, options?: { description?: string; referenceId?: string }) {
  const url = `${getAuthBaseUrl()}/api/companies/${companyId}/withdraw`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, description: options?.description, referenceId: options?.referenceId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: data.error || 'Failed to withdraw from company wallet' };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/** A team member pays from the company wallet (needs the company's spending policy and monthly limit). */
export async function spendCompanyWalletApi(companyId: string, amount: number, options?: { description?: string; referenceId?: string }) {
  const url = `${getAuthBaseUrl()}/api/companies/${companyId}/spend`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, description: options?.description, referenceId: options?.referenceId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: data.error || 'Failed to pay from the company wallet', code: data.code as string | undefined };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/** Undoes a member's company-wallet payment whose booking could not be confirmed (returns exactly what it took). */
export async function refundCompanySpendApi(companyId: string, referenceId: string) {
  const url = `${getAuthBaseUrl()}/api/companies/${companyId}/spend/refund`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ referenceId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: data.error || 'Failed to return the payment to the company wallet' };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export interface RescheduleResult {
  success: boolean;
  error?: string;
  /** Machine-readable reason: RESCHEDULE_WINDOW, RESCHEDULE_LIMIT, SLOT_UNAVAILABLE, INSUFFICIENT_BALANCE, ... */
  code?: string;
  requiredHours?: number;
  /** Positive: charged to the wallet that paid; negative: refunded to it; 0: nothing to settle */
  priceDifference?: number;
  settledOn?: 'COMPANY' | 'PERSONAL' | 'NONE';
}

async function postReschedule(url: string, body: Record<string, unknown>): Promise<RescheduleResult> {
  try {
    const response = await fetch(url, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: data.error || 'The booking could not be rescheduled', code: data.code, requiredHours: data.requiredHours };
    return { success: true, priceDifference: data.priceDifference ?? 0, settledOn: data.settledOn };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/** Moves an hourly session to another free session (same length). `startTime` accepts "2:00 PM" or "14:00". */
export function rescheduleHourlyBookingApi(bookingId: string, move: { startDate: string; startTime: string; sectionId?: string }) {
  return postReschedule(`${getAuthBaseUrl()}/api/hourly-bookings/${bookingId}/reschedule`, move);
}

/** Moves a daily, monthly or yearly booking to another start date. */
export function rescheduleDirectBookingApi(bookingId: string, move: { bookingDate: string; sectionId?: string }) {
  return postReschedule(`${getAuthBaseUrl()}/api/direct-bookings/${bookingId}/reschedule`, move);
}

export async function updateCompanyApi(id: string, data: any) {
  const url = `${getAuthBaseUrl()}/api/companies/${id}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: resData.error || 'Failed to update company' };
    return { success: true, data: resData };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function createTicketApi(payload: { companyId?: string | null; userId?: string; onBehalfOfEmail?: string; subject: string; message?: string; category?: string; priority?: string }) {
  const url = `${getAuthBaseUrl()}/api/tickets`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: data.error || 'Failed to create ticket' };
    return { success: true, data: data.ticket || data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function createTicketReplyApi(payload: { ticketId: string; userId: string; message: string }) {
  const url = `${getAuthBaseUrl()}/api/ticket-replies`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: data.error || 'Failed to add reply' };
    return { success: true, data: data.reply || data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function getTicketsApi() {
  const url = `${getAuthBaseUrl()}/api/tickets`;
  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) return { success: false, data: [] };
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (_) {
    return { success: false, data: [] };
  }
}

export async function updateTicketStatusApi(id: string, status: string) {
  const url = `${getAuthBaseUrl()}/api/tickets/${id}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: data.error || 'Failed to update ticket status' };
    return { success: true, data: data.ticket || data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}



export type ReportPeriod = 'today' | 'week' | 'month' | 'year';

/** Live platform analytics for super admins (aggregated from the database). */
export async function getAdminReportApi(period: ReportPeriod) {
  const url = `${getAuthBaseUrl()}/api/admin/reports?period=${period}`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false as const, error: (data as any).error || 'Failed to load report' };
    return { success: true as const, data };
  } catch (err: any) {
    return { success: false as const, error: err.message || 'Network error' };
  }
}
