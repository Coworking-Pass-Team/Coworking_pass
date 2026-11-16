# QA test accounts

These credentials are public and intended **only for isolated, disposable QA environments**. Do not use them in production or for real data. Set `ALLOW_MASTER_OTP=true` on the QA backend; the local `.env` is not deployed automatically.

| Role and persona | Email | Password | Mock OTP | Balances and permissions |
|---|---|---|---|---|
| Super Admin | admin@muttaka.sa | Password@1324 | 123456 | Platform administration |
| Super Admin | anas.g.algamdi@gmail.com | Password@1324 | 123456 | Platform administration |
| Partner Admin | partner@muttaka.sa | Password@1324 | 123456 | Approved partner and bookable QA venue |
| HR Admin | hr@muttaka.sa | Password@1324 | 123456 | Muttaka Tech Ltd; company balance SAR 5,000 |
| Company Employee | employee@muttaka.sa | Password@1324 | 123456 | Member of Muttaka Tech Ltd |
| Individual Member | user@muttaka.sa | Password@1324 | 123456 | Personal wallet SAR 500; 200 loyalty points |

All accounts are verified and unbanned at reset. The reset deletes existing users and their related records. Run `npx tsx scripts/reset-and-seed-clean-accounts.mjs --confirm-qa-reset` from `backend/` only after confirming `DATABASE_URL` points to the disposable QA database.
