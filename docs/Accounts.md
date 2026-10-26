# Team accounts

One verified account per role, owned by the team, for development and the live QA environment on Vercel.

**This repository is public, so the emails and the shared password are not written here.** They live in
`backend/scripts/team-accounts.json`, which is git-ignored. Ask a teammate for that file.
`backend/scripts/team-accounts.example.json` shows its shape.

Sign-in always takes two steps: the password, then a random 6-digit code sent to the account's email. The code is
valid for 10 minutes. There is no shared test code any more, so every address in the file must be a real mailbox.

```bash
cd backend
npm run seed:accounts                                  # local database: creates the accounts, or resets them
node scripts/seed-accounts.mjs --allow-remote          # the Neon database behind the live QA site (on purpose)
```

- Without `--allow-remote` the script refuses any database that is not on `localhost`.
- Without `team-accounts.json` the script uses the example file, and only on a local database.
- The shared password must meet the password policy (see below), or sign-in will still work but the password
  could never be set again through the reset screen.

| Role | What is set up |
|---|---|
| Super admin | Full platform access |
| Venue partner (approved) | Owns *Test Partner Hub* (private offices and Meeting Room A with a 2-hour package) |
| HR admin | Company *Test Company Ltd*, company wallet SAR 5,000, both employees in the team |
| Company employee 1 | Member of *Test Company Ltd* |
| Company employee 2 | Member of *Test Company Ltd* |
| Individual member | Wallet SAR 500, 200 loyalty points, an upcoming and a past hourly booking plus an upcoming and a past daily pass at *Test Partner Hub*, three notifications |

Notes:

- The seed is safe to run again. The individual member's bookings and notifications are rebuilt on every run, so
  the "upcoming" and "past" bookings always sit at the same distance from today.
- To test how a new employee joins: sign up under *Organization / B2B* → *Company employee* with the HR admin's email,
  then approve the request as the HR admin (team page or dashboard).
- Flows that need a pending partner or a suspended account: create a throwaway account and change it from the
  admin portal.
- These accounts are separate from the platform super admin created from `SUPER_ADMIN_EMAIL` /
  `SUPER_ADMIN_PASSWORD` (see `backend/.env.example`).

## Password policy

Enforced by the server on sign-up and password reset, and shown as a live checklist under the password field:

- at least 8 characters
- a lowercase letter, an uppercase letter, a number and a special character
- no sequential characters: three letters or digits in a row going up or down, such as `123`, `987`, `abc`, `cba`

## Automated tests

Tests cannot read the emailed codes, so they write a code they know into the **local** QA database
(`backend/tests/api-qa/plant-otp.mjs`, `plantOtp` in `backend/tests/api-qa/lib.mjs`). Run them only against the
local stack, with `QA_DATABASE_URL` set to the database the local backend uses, and with an empty
`RESEND_API_KEY` so no real email is sent. See [Testing.md](Testing.md).
