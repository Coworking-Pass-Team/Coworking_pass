import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function signJwt(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${encodedHeader}.${encodedPayload}`).digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function getBackendToken(): string {
  const secret = process.env.JWT_SECRET || 'cp_secret_key_2026_super_secure_jwt';
  return signJwt(
    {
      userId: 'c5d1e5f2-6d95-4147-9175-2955b2b64a8a',
      role: 'SUPER_ADMIN',
      exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
    },
    secret
  );
}

function getBackendUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    const cleaned = envUrl.replace(/\/$/, '');
    return cleaned.endsWith('/api') ? cleaned.replace(/\/api$/, '') : cleaned;
  }
  return 'http://localhost:3001';
}

export async function GET(request: NextRequest) {
  try {
    const backendUrl = `${getBackendUrl()}/api/qr-check-ins`;
    const token = getBackendToken();

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn('Backend QR fetch returned status:', response.status, errText);
      return NextResponse.json([], { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error: any) {
    console.warn('Exception querying backend QR check-ins:', error?.message);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId, workspaceId, sectionId, status = 'VALID' } = body;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      userId = 'c5d1e5f2-6d95-4147-9175-2955b2b64a8a';
    }

    if (!workspaceId) {
      workspaceId = 'space-1';
    }

    if (!sectionId || sectionId.startsWith('sec_') || !sectionId.includes(workspaceId)) {
      sectionId = `sec-${workspaceId}`;
    }

    const backendUrl = `${getBackendUrl()}/api/qr-check-ins`;
    const token = getBackendToken();

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        workspaceId,
        sectionId,
        status,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn('Backend QR create returned error:', data);
      return NextResponse.json({ success: false, error: data.error || 'Failed to create QR check-in' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Exception creating QR check-in:', error?.message);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
