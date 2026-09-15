import { NextResponse } from 'next/server';
import { usersDb, otpsDb, hashPassword, generateOtp, StoredUser } from '../_store';

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = usersDb.get(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const userId = `usr_${Date.now()}`;
    const newUser: StoredUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      role: role || 'B2C',
      emailVerified: false,
      createdAt: new Date(),
    };

    usersDb.set(cleanEmail, newUser);

    const otpCode = generateOtp();
    otpsDb.push({
      id: `otp_${Date.now()}`,
      userId,
      email: cleanEmail,
      code: otpCode,
      purpose: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
    });

    console.log(`\n========================================`);
    console.log(`🔑 [EMAIL OTP] Verification Code for ${cleanEmail}: ${otpCode}`);
    console.log(`========================================\n`);

    return NextResponse.json({
      message: 'Account created successfully. Verification code sent to your email.',
      userId,
      otpCode,
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
