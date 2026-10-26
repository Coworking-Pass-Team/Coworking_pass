import fs from 'node:fs';
import path from 'node:path';

/**
 * The team's accounts and shared password come from the git-ignored backend/scripts/team-accounts.json, or the
 * example file beside it (the repository is public, so the real emails are never committed).
 */
const dir = path.resolve(__dirname, '../../../backend/scripts');
const file = [process.env.TEAM_ACCOUNTS_FILE, path.join(dir, 'team-accounts.json'), path.join(dir, 'team-accounts.example.json')]
  .filter((f): f is string => Boolean(f))
  .find((f) => fs.existsSync(f))!;
const config = JSON.parse(fs.readFileSync(file, 'utf8')) as { password: string; accounts: Record<'superAdmin' | 'partner' | 'hr' | 'employee1' | 'employee2' | 'individual', { email: string; name: string }> };

export const TEAM_PASSWORD = config.password;
export const TEAM = config.accounts;
