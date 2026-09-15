import { NextResponse } from 'next/server';
import { usersDb, otpsDb, hashPassword, generateOtp } from '../_store';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = usersDb.get(cleanEmail);

    if (!user) {
      // Auto-register mock user if not found for seamless local dev
      user = {
        id: `usr_${Date.now()}`,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        passwordHash: hashPassword(password),
        role: 'B2C',
        emailVerified: true,
        createdAt: new Date(),
      };
      usersDb.set(cleanEmail, user);
    }

    const otpCode = generateOtp();
    otpsDb.push({
      id: `otp_${Date.now()}`,
      userId: user.id,
      email: cleanEmail,
      code: otpCode,
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
    });

    console.log(`\n========================================`);
    console.log(`🔑 [LOGIN OTP] Verification Code for ${cleanEmail}: ${otpCode}`);
    console.log(`========================================\n`);

    return NextResponse.json({
      message: 'Verification code sent to your email.',
      userId: user.id,
      otpCode,
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
