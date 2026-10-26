// Plants a one-time code the caller knows, for browser tests that cannot read the emailed code.
//   node tests/api-qa/plant-otp.mjs <email> <LOGIN|EMAIL_VERIFICATION|PASSWORD_RESET>   -> prints the code
// Local databases only: the backend must be pointed at the same QA_DATABASE_URL.
import { db, plantOtp } from './lib.mjs';
const [email, purpose = 'LOGIN'] = process.argv.slice(2);
if (!email) { console.error('usage: plant-otp.mjs <email> <purpose>'); process.exit(1); }
await db.connect();
const row = (await db.query('select id from "User" where lower(email)=lower($1)', [email])).rows[0];
if (!row) { console.error('no such user'); await db.end(); process.exit(2); }
process.stdout.write(await plantOtp(row.id, purpose));
await db.end();
