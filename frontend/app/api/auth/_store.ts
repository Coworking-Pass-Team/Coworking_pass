import crypto from 'crypto';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}

export interface StoredOtp {
  id: string;
  userId: string;
  email: string;
  code: string;
  purpose: 'EMAIL_VERIFICATION' | 'LOGIN' | 'PASSWORD_RESET';
  expiresAt: Date;
  isUsed: boolean;
}

// In-memory data store for serverless API routes
const globalAuth = global as unknown as {
  __cp_users?: Map<string, StoredUser>;
  __cp_otps?: StoredOtp[];
};

if (!globalAuth.__cp_users) {
  globalAuth.__cp_users = new Map();
  
  // Seed demo accounts
  const demoUsers: StoredUser[] = [
    {
      id: 'usr_admin',
      name: 'Fahad Al-Husseini',
      email: 'admin@coworkingpass.sa',
      passwordHash: hashPassword('admin123'),
      role: 'SUPER_ADMIN',
      emailVerified: true,
      createdAt: new Date(),
    },
    {
      id: 'usr_b2c',
      name: 'Sarah Al-Otaibi',
      email: 'sarah@example.com',
      passwordHash: hashPassword('password123'),
      role: 'B2C',
      emailVerified: true,
      createdAt: new Date(),
    },
    {
      id: 'usr_org',
      name: 'Mohammad Al-Zahrani',
      email: 'hr@aramco.com',
      passwordHash: hashPassword('password123'),
      role: 'HR_ADMIN',
      emailVerified: true,
      createdAt: new Date(),
    },
    {
      id: 'usr_provider',
      name: 'Khalid Al-Qurashi',
      email: 'partner@spacehub.sa',
      passwordHash: hashPassword('password123'),
      role: 'PARTNER_ADMIN',
      emailVerified: true,
      createdAt: new Date(),
    }
  ];

  demoUsers.forEach(u => globalAuth.__cp_users!.set(u.email.toLowerCase(), u));
}

if (!globalAuth.__cp_otps) {
  globalAuth.__cp_otps = [];
}

export const usersDb = globalAuth.__cp_users;
export const otpsDb = globalAuth.__cp_otps;

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createToken(userId: string, role: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, role, exp: Date.now() + 7 * 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', 'cp_secret_key_2026').update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
