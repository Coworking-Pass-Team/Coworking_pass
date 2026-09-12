import { NextResponse } from 'next/server';
import { usersDb, otpsDb } from '../_store';

export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json({ error: 'User ID and verification code are required.' }, { status: 400 });
    }

    const cleanCode = code.toString().trim();

    // Find valid OTP record
    const otpRecord = otpsDb.find(
      (o) => o.userId === userId && o.purpose === 'EMAIL_VERIFICATION' && !o.isUsed && o.expiresAt > new Date()
    );

    // Accept if matching code, or fallback demo code 123456
    const isCodeValid = (otpRecord && otpRecord.code === cleanCode) || cleanCode === '123456';

    if (!isCodeValid) {
      return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
    }

    if (otpRecord) {
      otpRecord.isUsed = true;
    }

    // Mark user as verified
    for (const [, user] of usersDb.entries()) {
      if (user.id === userId) {
        user.emailVerified = true;
        break;
      }
    }

    return NextResponse.json({
      message: 'Account activated successfully.',
    });
  } catch (error) {
    console.error('[Auth Verify Email Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
