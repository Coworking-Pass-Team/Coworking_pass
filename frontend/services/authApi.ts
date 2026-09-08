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
