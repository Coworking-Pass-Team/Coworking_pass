import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * One-time codes are random and emailed, so browser tests plant a code they know in the local QA database
 * (backend/tests/api-qa/plant-otp.mjs) and type it into the screen. QA_DATABASE_URL must point at the database
 * the local backend uses.
 */
const SCRIPT = path.resolve(__dirname, '../../../backend/tests/api-qa/plant-otp.mjs');

export function plantOtp(email: string, purpose: 'LOGIN' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' = 'LOGIN'): string {
  return execFileSync('node', [SCRIPT, email, purpose], { cwd: path.dirname(SCRIPT), encoding: 'utf8', env: process.env }).trim();
}
