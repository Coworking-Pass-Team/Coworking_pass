import { NextRequest, NextResponse } from 'next/server';

/**
 * Thin pass-through to the backend. It never mints credentials: the caller's own Authorization header is
 * forwarded, so the backend decides what that user may read or record. Requests without a token are refused.
 */
function getBackendUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    const cleaned = envUrl.replace(/\/$/, '');
    return cleaned.endsWith('/api') ? cleaned.replace(/\/api$/, '') : cleaned;
  }
  return 'http://localhost:3001';
}

function unauthorized() {
  return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization) return unauthorized();
  try {
    const response = await fetch(`${getBackendUrl()}/api/qr-check-ins`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Backend unreachable.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization) return unauthorized();
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    const response = await fetch(`${getBackendUrl()}/api/qr-check-ins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(response.ok ? { success: true, data } : { success: false, error: data.error || 'Failed to create QR check-in' }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Backend unreachable.' }, { status: 502 });
  }
}
