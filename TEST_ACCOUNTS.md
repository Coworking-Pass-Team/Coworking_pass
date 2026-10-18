# Test accounts

Verified accounts for every role, for **local development and testing only**.
The passwords are public, so these accounts must never exist on a shared or production database.
The seed script refuses to run unless `DATABASE_URL` points to `localhost`.

```bash
cd backend
npm run seed:test-accounts      # creates the accounts, or resets them if they already exist
```

- Password for all accounts: `Test@12345`
- Verification code (second login step): `123456`
- Sign in at the member portal (`/`, then "Sign in").

| Role | Email | What is set up |
|---|---|---|
| Individual member | `individual@cwp-test.local` | Wallet SAR 500, 200 loyalty points, an upcoming and a past hourly booking plus an upcoming and a past daily pass at *Test Partner Hub*, three notifications |
| Individual member (empty) | `newmember@cwp-test.local` | Nothing booked yet: use it for first-time flows |
| HR admin (company) | `hr@cwp-test.local` | Company *Test Company Ltd*, shared wallet SAR 5,000, 10 passes, two employees |
| Company employee | `employee1@cwp-test.local`, `employee2@cwp-test.local` | Members of *Test Company Ltd* |
| Venue partner (approved) | `partner@cwp-test.local` | Owns *Test Partner Hub* (private offices + Meeting Room A with a 2-hour package) |
| Venue partner (pending) | `partner.pending@cwp-test.local` | Sign-in is refused until a super admin approves it: use it to test the approval flow |
| Super admin | `superadmin@cwp-test.local` | Full platform access |
| Suspended member | `suspended@cwp-test.local` | Sign-in is refused with the "account suspended" message |

Notes:

- The seed is safe to run repeatedly. The booking history is created once; the individual member's three notifications are reset on every run, so run it again after a test that deletes them.
- The pending partner and the suspended member are refused at sign-in on purpose, so those two cannot be used to open a session.
- These accounts are separate from the platform's real super admin, which is created from the `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` environment variables (see `backend/.env.example`).
