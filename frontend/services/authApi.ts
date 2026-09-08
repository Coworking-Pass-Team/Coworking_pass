/**
 * Auth API Service
 * Handles communication between the frontend and backend authentication & OTP endpoints.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  userId?: string;
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
  const url = `${API_BASE_URL}/api/auth/register`;
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
  const url = `${API_BASE_URL}/api/auth/verify-email`;
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
  const url = `${API_BASE_URL}/api/auth/login`;
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
  const url = `${API_BASE_URL}/api/auth/verify-login`;
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

export interface MembershipPlan {
  id: string;
  planName: string;
  type: 'B2C' | 'B2B';
  totalVisitsAllowed: number;
  price: number;
}

/**
 * List all membership plans
 * Method: GET
 * URL: http://localhost:3001/api/membership-plans (or http://localhost:3000/api/membership-plans)
 */
export async function getMembershipPlansApi(token?: string): Promise<{ success: boolean; data?: MembershipPlan[]; error?: string }> {
  const url = `${API_BASE_URL}/api/membership-plans`;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      return {
        success: false,
        error: (data as any)?.error || 'Failed to fetch membership plans.',
      };
    }

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    };
  } catch (error: any) {
    console.warn('[API Network Exception] getMembershipPlansApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach membership plans server.',
    };
  }
}

export interface CreateMembershipPlanPayload {
  planName: string;
  type: 'B2C' | 'B2B';
  totalVisitsAllowed: number;
  price: number;
}

/**
 * Create a new membership plan
 * Method: POST
 * URL: http://localhost:3001/api/membership-plans (or http://localhost:3000/api/membership-plans)
 */
export async function createMembershipPlanApi(
  payload: CreateMembershipPlanPayload,
  token?: string
): Promise<{ success: boolean; data?: MembershipPlan; error?: string }> {
  const url = `${API_BASE_URL}/api/membership-plans`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        planName: payload.planName.trim(),
        type: payload.type,
        totalVisitsAllowed: Number(payload.totalVisitsAllowed),
        price: Number(payload.price),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to create plan with status ${response.status}.`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] createMembershipPlanApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach membership plans server.',
    };
  }
}

export interface UpdateMembershipPlanPayload {
  planName?: string;
  type?: 'B2C' | 'B2B';
  totalVisitsAllowed?: number;
  price?: number;
}

/**
 * Update a membership plan
 * Method: PUT
 * URL: http://localhost:3001/api/membership-plans/[planId] (or http://localhost:3000/api/membership-plans/[planId])
 */
export async function updateMembershipPlanApi(
  planId: string,
  payload: UpdateMembershipPlanPayload,
  token?: string
): Promise<{ success: boolean; data?: MembershipPlan; error?: string }> {
  const url = `${API_BASE_URL}/api/membership-plans/${encodeURIComponent(planId)}`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const bodyData: Record<string, any> = {};
    if (payload.planName !== undefined) bodyData.planName = payload.planName.trim();
    if (payload.type !== undefined) bodyData.type = payload.type;
    if (payload.totalVisitsAllowed !== undefined) bodyData.totalVisitsAllowed = Number(payload.totalVisitsAllowed);
    if (payload.price !== undefined) bodyData.price = Number(payload.price);

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(bodyData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to update plan with status ${response.status}.`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] updateMembershipPlanApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach membership plans server.',
    };
  }
}

/**
 * Delete a membership plan
 * Method: DELETE
 * URL: http://localhost:3001/api/membership-plans/[planId] (or http://localhost:3000/api/membership-plans/[planId])
 */
export async function deleteMembershipPlanApi(
  planId: string,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  const url = `${API_BASE_URL}/api/membership-plans/${encodeURIComponent(planId)}`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to delete plan with status ${response.status}.`,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] deleteMembershipPlanApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach membership plans server.',
    };
  }
}

export interface ApiSubscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  visitsUsed: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  plan?: {
    id: string;
    planName: string;
    type: 'B2C' | 'B2B';
    totalVisitsAllowed: number;
    price: number;
  };
}

/**
 * List all subscriptions
 * Method: GET
 * URL: http://localhost:3001/api/subscriptions (or http://localhost:3000/api/subscriptions)
 */
export async function getSubscriptionsApi(
  userId?: string,
  token?: string
): Promise<{ success: boolean; data?: ApiSubscription[]; error?: string }> {
  let url = `${API_BASE_URL}/api/subscriptions`;
  if (userId) {
    url += `?userId=${encodeURIComponent(userId)}`;
  }

  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      return {
        success: false,
        error: (data as any)?.error || 'Failed to fetch subscriptions.',
      };
    }

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    };
  } catch (error: any) {
    console.warn('[API Network Exception] getSubscriptionsApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach subscriptions server.',
    };
  }
}

export interface CreateSubscriptionPayload {
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

/**
 * Create a new subscription
 * Method: POST
 * URL: http://localhost:3001/api/subscriptions (or http://localhost:3000/api/subscriptions)
 */
export async function createSubscriptionApi(
  payload: CreateSubscriptionPayload,
  token?: string
): Promise<{ success: boolean; data?: ApiSubscription; error?: string }> {
  const url = `${API_BASE_URL}/api/subscriptions`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: payload.userId,
        planId: payload.planId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: payload.status || 'ACTIVE',
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to create subscription with status ${response.status}.`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] createSubscriptionApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach subscriptions server.',
    };
  }
}

/**
 * Cancel a subscription
 * Method: DELETE
 * URL: http://localhost:3001/api/subscriptions/[id] (or http://localhost:3000/api/subscriptions/[id])
 */
export async function cancelSubscriptionApi(
  subscriptionId: string,
  token?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const url = `${API_BASE_URL}/api/subscriptions/${encodeURIComponent(subscriptionId)}`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to cancel subscription with status ${response.status}.`,
      };
    }

    return {
      success: true,
      message: data.message || 'Subscription cancelled successfully.',
    };
  } catch (error: any) {
    console.warn('[API Network Exception] cancelSubscriptionApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach subscriptions server.',
    };
  }
}

export interface UpdateSubscriptionPayload {
  planId?: string;
  startDate?: string;
  endDate?: string;
  visitsUsed?: number;
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

/**
 * Update a subscription
 * Method: PUT
 * URL: http://localhost:3001/api/subscriptions/[subscriptionId] (or http://localhost:3000/api/subscriptions/[subscriptionId])
 */
export async function updateSubscriptionApi(
  subscriptionId: string,
  payload: UpdateSubscriptionPayload,
  token?: string
): Promise<{ success: boolean; data?: ApiSubscription; error?: string }> {
  const url = `${API_BASE_URL}/api/subscriptions/${encodeURIComponent(subscriptionId)}`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const bodyData: Record<string, any> = {};
    if (payload.planId !== undefined) bodyData.planId = payload.planId;
    if (payload.startDate !== undefined) bodyData.startDate = payload.startDate;
    if (payload.endDate !== undefined) bodyData.endDate = payload.endDate;
    if (payload.visitsUsed !== undefined) bodyData.visitsUsed = Number(payload.visitsUsed);
    if (payload.status !== undefined) bodyData.status = payload.status;

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(bodyData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to update subscription with status ${response.status}.`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] updateSubscriptionApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach subscriptions server.',
    };
  }
}

export interface ApiDirectBooking {
  id: string;
  userId: string;
  workspaceId: string;
  sectionId: string;
  durationType: 'DAILY' | 'MONTHLY' | 'YEARLY';
  bookingDate: string;
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';
  createdAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  workspace?: {
    id: string;
    partnerId: string;
    name: string;
    city: string;
    locationMapUrl?: string | null;
    dailyRate?: number | null;
    monthlyRate?: number | null;
    yearlyRate?: number | null;
    passVisitValue?: number;
    totalCapacity?: number;
  };
  section?: {
    id: string;
    workspaceId: string;
    type: 'DESK' | 'MEETING_ROOM' | 'THEATER';
    name: string;
    capacity: number;
    dailyRate?: number | null;
    monthlyRate?: number | null;
    yearlyRate?: number | null;
  };
}

export interface GetDirectBookingsParams {
  userId?: string;
  workspaceId?: string;
  sectionId?: string;
  status?: string;
}

/**
 * List all direct bookings
 * Method: GET
 * URL: http://localhost:3001/api/direct-bookings (or http://localhost:3000/api/direct-bookings)
 */
export async function getDirectBookingsApi(
  params?: GetDirectBookingsParams,
  token?: string
): Promise<{ success: boolean; data?: ApiDirectBooking[]; error?: string }> {
  let url = `${API_BASE_URL}/api/direct-bookings`;
  if (params) {
    const search = new URLSearchParams();
    if (params.userId) search.append('userId', params.userId);
    if (params.workspaceId) search.append('workspaceId', params.workspaceId);
    if (params.sectionId) search.append('sectionId', params.sectionId);
    if (params.status) search.append('status', params.status);
    const queryString = search.toString();
    if (queryString) url += `?${queryString}`;
  }

  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      return {
        success: false,
        error: (data as any)?.error || 'Failed to fetch direct bookings.',
      };
    }

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    };
  } catch (error: any) {
    console.warn('[API Network Exception] getDirectBookingsApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach direct bookings server.',
    };
  }
}

export interface CreateDirectBookingPayload {
  userId?: string;
  workspaceId: string;
  sectionId: string;
  durationType: 'DAILY' | 'MONTHLY' | 'YEARLY';
  bookingDate: string;
  status?: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';
}

/**
 * Create a direct booking
 * Method: POST
 * URL: http://localhost:3001/api/direct-bookings (or http://localhost:3000/api/direct-bookings)
 */
export async function createDirectBookingApi(
  payload: CreateDirectBookingPayload,
  token?: string
): Promise<{ success: boolean; data?: ApiDirectBooking; error?: string }> {
  const url = `${API_BASE_URL}/api/direct-bookings`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        sectionId: payload.sectionId,
        durationType: payload.durationType,
        bookingDate: payload.bookingDate,
        status: payload.status || 'CONFIRMED',
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to create direct booking with status ${response.status}.`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] createDirectBookingApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach direct bookings server.',
    };
  }
}

export interface UpdateDirectBookingPayload {
  workspaceId?: string;
  sectionId?: string;
  durationType?: 'DAILY' | 'MONTHLY' | 'YEARLY';
  bookingDate?: string;
  status?: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';
}

/**
 * Update a direct booking
 * Method: PUT
 * URL: http://localhost:3001/api/direct-bookings/[id] (or http://localhost:3000/api/direct-bookings/[id])
 */
export async function updateDirectBookingApi(
  bookingId: string,
  payload: UpdateDirectBookingPayload,
  token?: string
): Promise<{ success: boolean; data?: ApiDirectBooking; error?: string }> {
  const url = `${API_BASE_URL}/api/direct-bookings/${encodeURIComponent(bookingId)}`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to update direct booking with status ${response.status}.`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] updateDirectBookingApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach direct bookings server.',
    };
  }
}

/**
 * Cancel a direct booking
 * Method: DELETE
 * URL: http://localhost:3001/api/direct-bookings/[id] (or http://localhost:3000/api/direct-bookings/[id])
 */
export async function cancelDirectBookingApi(
  bookingId: string,
  token?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const url = `${API_BASE_URL}/api/direct-bookings/${encodeURIComponent(bookingId)}`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to cancel direct booking with status ${response.status}.`,
      };
    }

    return {
      success: true,
      message: data.message || 'Direct booking cancelled successfully.',
    };
  } catch (error: any) {
    console.warn('[API Network Exception] cancelDirectBookingApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach direct bookings server.',
    };
  }
}

export const deleteDirectBookingApi = cancelDirectBookingApi;

export interface ApiPayment {
  id: string;
  userId: string;
  amount: number;
  method: 'MADA' | 'VISA' | 'APPLE_PAY' | 'SAMSUNG_PAY';
  gatewayTransactionId?: string | null;
  paymentFor: 'DIRECT_BOOKING' | 'HOURLY_BOOKING' | 'SUBSCRIPTION' | 'POINTS_REDEMPTION';
  referenceId?: string | null;
  status: 'SUCCESS' | 'FAILED';
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface GetPaymentsParams {
  userId?: string;
  status?: string;
  paymentFor?: string;
  method?: string;
}

/**
 * List all payments
 * Method: GET
 * URL: http://localhost:3001/api/payments (or http://localhost:3000/api/payments)
 */
export async function getPaymentsApi(
  params?: GetPaymentsParams,
  token?: string
): Promise<{ success: boolean; data?: ApiPayment[]; error?: string }> {
  let url = `${API_BASE_URL}/api/payments`;
  if (params) {
    const search = new URLSearchParams();
    if (params.userId) search.append('userId', params.userId);
    if (params.status) search.append('status', params.status);
    if (params.paymentFor) search.append('paymentFor', params.paymentFor);
    if (params.method) search.append('method', params.method);
    const queryString = search.toString();
    if (queryString) url += `?${queryString}`;
  }

  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      return {
        success: false,
        error: (data as any)?.error || 'Failed to fetch payments.',
      };
    }

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    };
  } catch (error: any) {
    console.warn('[API Network Exception] getPaymentsApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach payments server.',
    };
  }
}

export interface CreatePaymentPayload {
  userId?: string;
  amount: number;
  method: 'MADA' | 'VISA' | 'APPLE_PAY' | 'SAMSUNG_PAY';
  paymentFor: 'DIRECT_BOOKING' | 'HOURLY_BOOKING' | 'SUBSCRIPTION' | 'POINTS_REDEMPTION';
  referenceId?: string;
  status?: 'SUCCESS' | 'FAILED';
  gatewayTransactionId?: string;
}

/**
 * Create a payment record
 * Method: POST
 * URL: http://localhost:3001/api/payments (or http://localhost:3000/api/payments)
 */
export async function createPaymentApi(
  payload: CreatePaymentPayload,
  token?: string
): Promise<{ success: boolean; data?: ApiPayment; error?: string }> {
  const url = `${API_BASE_URL}/api/payments`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: payload.userId,
        amount: Number(payload.amount),
        method: payload.method,
        paymentFor: payload.paymentFor,
        referenceId: payload.referenceId,
        status: payload.status || 'SUCCESS',
        gatewayTransactionId: payload.gatewayTransactionId,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to create payment with status ${response.status}.`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] createPaymentApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach payments server.',
    };
  }
}

export interface UpdatePaymentPayload {
  amount?: number;
  method?: 'MADA' | 'VISA' | 'APPLE_PAY' | 'SAMSUNG_PAY';
  paymentFor?: 'DIRECT_BOOKING' | 'HOURLY_BOOKING' | 'SUBSCRIPTION' | 'POINTS_REDEMPTION';
  referenceId?: string;
  status?: 'SUCCESS' | 'FAILED';
  gatewayTransactionId?: string;
}

/**
 * Update a payment record
 * Method: PUT
 * URL: http://localhost:3001/api/payments/[paymentId] (or http://localhost:3000/api/payments/[paymentId])
 */
export async function updatePaymentApi(
  paymentId: string,
  payload: UpdatePaymentPayload,
  token?: string
): Promise<{ success: boolean; data?: ApiPayment; error?: string }> {
  const url = `${API_BASE_URL}/api/payments/${encodeURIComponent(paymentId)}`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to update payment with status ${response.status}.`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.warn('[API Network Exception] updatePaymentApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach payments server.',
    };
  }
}

/**
 * Delete a payment record
 * Method: DELETE
 * URL: http://localhost:3001/api/payments/[paymentId] (or http://localhost:3000/api/payments/[paymentId])
 */
export async function deletePaymentApi(
  paymentId: string,
  token?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const url = `${API_BASE_URL}/api/payments/${encodeURIComponent(paymentId)}`;
  try {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to delete payment with status ${response.status}.`,
      };
    }

    return {
      success: true,
      message: data.message || 'Payment deleted successfully.',
    };
  } catch (error: any) {
    console.warn('[API Network Exception] deletePaymentApi:', error);
    return {
      success: false,
      error: 'Network connection issue: could not reach payments server.',
    };
  }
}


