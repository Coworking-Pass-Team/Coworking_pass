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
  return 'http://localhost:3001';
}


export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  orgName?: string;
  companyName?: string;
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
  workspaceId: string;
  sectionId: string;
  durationType: string;
  bookingDate: string;
  status?: string;
}) {
  const url = `${getAuthBaseUrl()}/api/direct-bookings`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
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
  amount: number;
  method: string;
  paymentFor: string;
  referenceId?: string;
  gatewayTransactionId?: string;
  status: 'SUCCESS' | 'FAILED' | string;
  createdAt?: string;
  user?: { id?: string; name?: string; email?: string; role?: string };
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
  sectionId: string;
  packageId: string;
  startDate: string;
  endDate: string;
  hoursUsed?: number;
  status: string;
  createdAt?: string;
  user?: { name: string; email: string };
  section?: { id: string; name: string; type: string };
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
  sectionId: string;
  packageId: string;
  startDate: string;
  endDate: string;
  status?: string;
}) {
  const url = `${getAuthBaseUrl()}/api/hourly-bookings`;
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

    let targetSectionId = payload.sectionId;
    if (!uuidRegex.test(targetSectionId) || targetSectionId.includes('PASTE') || targetSectionId.startsWith('sec_')) {
      const secRes = await getWorkspaceSectionsApi();
      if (secRes.success && Array.isArray(secRes.data) && secRes.data.length > 0) {
        const meetingSec = secRes.data.find((s: any) => ['MEETING_ROOM', 'THEATER'].includes(s.type)) || secRes.data[0];
        targetSectionId = meetingSec.id;
      }
    }

    let targetPackageId = payload.packageId;
    if (!uuidRegex.test(targetPackageId) || targetPackageId.includes('PASTE') || targetPackageId.startsWith('pkg_')) {
      const pkgRes = await getHourlyPackagesApi();
      if (pkgRes.success && Array.isArray(pkgRes.data) && pkgRes.data.length > 0) {
        targetPackageId = pkgRes.data[0].id;
      }
    }

    const finalPayload = {
      ...payload,
      userId: targetUserId,
      sectionId: targetSectionId,
      packageId: targetPackageId,
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
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
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
