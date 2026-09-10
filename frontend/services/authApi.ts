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

export async function createSubscriptionApi(payload: {
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status?: string;
}) {
  const url = `${getAuthBaseUrl()}/api/subscriptions`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create subscription' };
    }
    return { success: true, data, subscription: data };
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
