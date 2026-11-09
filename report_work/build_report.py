from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'Security_Fixes_Verification_Report.docx'
NAVY, GREEN, INK, MUTED = '0F2240', '107A57', '253349', '526175'
doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Inches(8.27), Inches(11.69)
sec.top_margin, sec.bottom_margin = Inches(.68), Inches(.65)
sec.left_margin = sec.right_margin = Inches(.72)
sec.header_distance = sec.footer_distance = Inches(.28)

for name in ['Normal', 'Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Heading 3']:
    st = doc.styles[name]
    st.font.name = 'Calibri'
    st.font.color.rgb = RGBColor.from_string(INK)
    st.paragraph_format.widow_control = True
normal = doc.styles['Normal']
normal.font.size = Pt(10.5)
normal.paragraph_format.line_spacing = 1.13
normal.paragraph_format.space_after = Pt(7)
for name, size, color in [('Title', 25, NAVY), ('Heading 1', 17, NAVY), ('Heading 2', 11.5, GREEN), ('Heading 3', 10.5, NAVY)]:
    st = doc.styles[name]
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.space_before = Pt(11 if name != 'Title' else 4)
    st.paragraph_format.space_after = Pt(6 if name != 'Title' else 12)
    st.paragraph_format.keep_with_next = True
doc.styles['Subtitle'].font.size = Pt(13)
doc.styles['Subtitle'].font.color.rgb = RGBColor.from_string(GREEN)

doc.core_properties.title = 'Security Vulnerability Remediation & Verification Report'
doc.core_properties.subject = 'Muttaka (Coworking Pass Platform) security remediation and local verification'
doc.core_properties.author = 'Anas Saeed Alghamdi'
doc.core_properties.keywords = 'Muttaka, security, remediation, verification, Umm Al-Qura University'
doc.core_properties.comments = 'Prepared for academic and field project supervisor review. Approval fields are intentionally unsigned.'

h = sec.header.paragraphs[0]
h.text = 'MUTTAKA  /  SECURITY ASSURANCE'
h.runs[0].font.size = Pt(8)
h.runs[0].font.bold = True
h.runs[0].font.color.rgb = RGBColor.from_string(NAVY)
h.paragraph_format.space_after = Pt(0)
f = sec.footer.paragraphs[0]
f.alignment = WD_ALIGN_PARAGRAPH.RIGHT
r = f.add_run('MTC-SEC-2026-11-08  |  Version 1.0  |  Page ')
r.font.size = Pt(8)
r.font.color.rgb = RGBColor.from_string(MUTED)
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); f._p.append(field)

def p(text, boldlead=None):
    para = doc.add_paragraph()
    if boldlead:
        para.add_run(boldlead).bold = True
        para.add_run(text)
    else:
        para.add_run(text)
    return para

def heading(text, level=1):
    return doc.add_heading(text, level)

def small(text):
    para = p(text)
    for run in para.runs:
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor.from_string(MUTED)
    return para

def label(text):
    para = p(text)
    para.paragraph_format.space_after = Pt(9)
    for r in para.runs:
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor.from_string(GREEN)

def table(headers, rows, widths, size=9.3):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for c, width in zip(t.columns, widths): c.width = Inches(width)
    pr = t._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for side in ['top','left','bottom','right','insideH','insideV']:
        e = OxmlElement('w:' + side); e.set(qn('w:val'), 'single'); e.set(qn('w:sz'), '4'); e.set(qn('w:color'), 'D9D9D9'); borders.append(e)
    pr.append(borders)
    for i, values in enumerate([headers] + rows):
        row = t.rows[0] if i == 0 else t.add_row()
        cant = OxmlElement('w:cantSplit'); row._tr.get_or_add_trPr().append(cant)
        if i == 0:
            repeat = OxmlElement('w:tblHeader'); row._tr.get_or_add_trPr().append(repeat)
        for j, (cell, text) in enumerate(zip(row.cells, values)):
            cell.width = Inches(widths[j])
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            tc = cell._tc.get_or_add_tcPr()
            fill = OxmlElement('w:shd'); fill.set(qn('w:fill'), NAVY if i == 0 else ('F1F5F8' if i % 2 else 'FFFFFF')); tc.append(fill)
            margins = OxmlElement('w:tcMar')
            for side in ['top','left','bottom','right']:
                m = OxmlElement('w:' + side); m.set(qn('w:w'), '110'); m.set(qn('w:type'), 'dxa'); margins.append(m)
            tc.append(margins)
            para = cell.paragraphs[0]
            para.paragraph_format.space_after = Pt(0)
            para.paragraph_format.line_spacing = 1.08
            r = para.add_run(str(text)); r.font.name = 'Calibri'; r.font.size = Pt(size)
            r.font.bold = (i == 0)
            r.font.color.rgb = RGBColor.from_string('FFFFFF' if i == 0 else INK)
            if headers[j] in ['ID', 'Passed', 'Result']:
                para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return t

def code(lines):
    para = doc.add_paragraph()
    para.paragraph_format.space_before = Pt(3)
    para.paragraph_format.space_after = Pt(8)
    para.paragraph_format.keep_together = True
    shade = OxmlElement('w:shd'); shade.set(qn('w:fill'), 'F1F5F8'); para._p.get_or_add_pPr().append(shade)
    r = para.add_run(lines); r.font.name = 'Consolas'; r.font.size = Pt(9)
    return para

def newpage(title, status=None):
    para = heading(title)
    para.paragraph_format.page_break_before = True
    if status: label(status)

# PAGE 1
doc.add_paragraph('Security Vulnerability Remediation & Verification Report', 'Title')
doc.add_paragraph('Muttaka (Coworking Pass Platform)', 'Subtitle')
p('Anas Saeed Alghamdi  |  Student ID: 444005852', boldlead=None)
small('Umm Al-Qura University\nPrepared for the academic / field project supervisor\nReport date: 8 November 2026  |  Report reference: MTC-SEC-2026-11-08')
heading('1  Executive Summary')
p('The four security findings raised during the supervisor audit have been addressed in the application code and supported by local automated verification. The remediation strengthens administrator authentication, rejects manipulated monetary inputs, makes checkout pricing and wallet settlement server-controlled, and adds persistent OTP abuse protection.')
p('The recorded verification run passed 109 automated tests across 13 test suites. Backend and frontend TypeScript checks also passed. These results support technical closure at the implementation and local-verification stage. Production acceptance remains conditional on the Neon database migration and staging validation described in this report.')
table(['ID', 'Audit finding', 'Technical status'], [
 ['SEC-01', 'Weak admin security and default secrets', 'Remediated\nLocal checks passed'],
 ['SEC-02', 'Negative payment and decimal manipulation', 'Remediated\nSQL migration prepared'],
 ['SEC-03', 'Payment and pricing security', 'Remediated\nWallet-only settlement'],
 ['SEC-04', 'OTP brute-force and flooding', 'Remediated\nAccount cooldown and lockout'],
], [.67, 3.52, 2.64])
heading('Scope and acceptance boundary', 2)
p('The evidence covers the Next.js App Router and TypeScript application, Prisma data access, PostgreSQL migration source, and the OTP frontend controls. Database transactions are mocked in the unit tests. Live PostgreSQL concurrency, migration compatibility, browser end-to-end behavior and a production build have not yet been verified.')
small('Approval status: submitted for supervisor review. No approval or signature is implied by this report.')

# PAGE 2
newpage('2  Detailed Technical Breakdown')
heading('SEC-01  Administrator Security and Secrets', 2)
label('IMPLEMENTATION REMEDIATED  |  LOCAL VERIFICATION PASSED')
heading('Problem statement', 2)
p('A missing or predictable JWT signing key could undermine session-token trust. Public seed credentials could also expose a privileged administrator account, particularly if development provisioning were enabled in a production deployment.')
heading('Root cause', 2)
p('Token signing and verification relied on environment values without fail-closed validation. Legacy seed paths contained a known administrator password, and Super Admin provisioning did not consistently enforce a sufficiently strong password composition policy.')
heading('Implemented solution', 2)
p('A shared secret validator now rejects undefined keys, keys shorter than 32 characters, insecure placeholders and obviously repetitive values. Both token signing and verification use the validated value; verification is restricted to HS256. Startup instrumentation loads the verifier outside the best-effort schema-sync exception handler, so invalid JWT configuration aborts startup.')
p('Production rejects development administrator provisioning and the demo-account seed script. Loyalty-rule seeding no longer creates a fallback administrator. Provisioning revokes the legacy public password where applicable, and the migration revokes existing administrator sessions and pending OTPs.')
p('Super Admin provisioning, login and password reset enforce a minimum of 12 characters containing uppercase letters, lowercase letters, numbers and symbols. A 72-byte ceiling avoids bcrypt password truncation. This is a length and composition requirement; it is not a measured guarantee of password entropy.')
heading('Verification tests', 2)
table(['Test condition', 'Verified behavior'], [
 ['Missing, short or default JWT key', 'Validator rejects configuration with an error.'],
 ['Weak administrator password', 'Provisioning policy rejects passwords missing required length or character classes.'],
 ['Valid secret and administrator password', 'Positive controls are accepted.'],
 ['Production development-seed selection', 'Administrator plan excludes the development default.'],
], [2.66, 4.17])
heading('Implementation evidence', 2)
small('backend/lib/auth/secrets.ts; verify-token.ts; sessions.ts; admin-password.ts; super-admin.ts\nbackend/instrumentation.ts; backend/scripts/seed-accounts.mjs\nTests: security-input.test.ts and super-admin.test.ts')
p('Closure assessment: the weak/default credential paths are closed in the implementation. Production deployment must supply a new random JWT key and approved administrator credentials before startup.', boldlead=None)

# PAGE 3
newpage('SEC-02  Negative Payment and Decimal Manipulation', 'IMPLEMENTATION REMEDIATED  |  DATABASE ACTIVATION PENDING')
heading('Problem statement', 2)
p('Negative, non-finite or otherwise malformed monetary values could produce invalid wallet movements or payment records. Uncontrolled numeric coercion and rounding could also conceal input formats that should be rejected.')
heading('Root cause', 2)
p('Financial routes applied inconsistent validation to client-supplied amounts. Parsing JSON before inspecting its numeric representation also removes the distinction between an ordinary number such as 100 and scientific notation such as 1e2. Database ledger tables lacked the additional check constraints delivered with this patch.')
heading('Implemented solution', 2)
p('financialBody() examines numeric JSON tokens before parsing. Quoted strings are handled separately, so descriptive text containing an exponent-like sequence is not incorrectly rejected. Numeric exponent notation, malformed JSON, non-object payloads and invalid amount types produce HTTP 400 responses.')
p('The shared money() validator accepts only finite JSON numbers in the inclusive range of 1.00 to 100,000.00 SAR. Bounds are checked before rounding; accepted amounts are rounded to two decimal places. Numeric strings, null, NaN, infinities, zero and negative values are rejected.')
p('The migration adds non-negative, finite-amount CHECK constraints to Payment, WalletTransaction and CompanyWalletTransaction. Historical zero-value records remain permissible at the database layer, while new monetary requests require at least SAR 1. Invalid existing ledger rows must be reconciled before migration; financial history is not silently rewritten.')
heading('Verification tests', 2)
table(['Representative input', 'Verified result'], [
 ['-100, 0, 0.999, null and "100"', 'Rejected by monetary validation.'],
 ['NaN, Infinity and 100000.01', 'Rejected as non-finite or out of range.'],
 ['{"amount":1e2} and {"amount":1E+2}', 'Rejected before JSON representation is lost.'],
 ['1.005 and 18.126', 'Rounded to 1.01 and 18.13 SAR.'],
 ['1.00 and 100000.00', 'Accepted at the inclusive boundaries.'],
], [3.1, 3.73])
heading('Implementation evidence and closure', 2)
small('backend/lib/security/input.ts\nbackend/prisma/migrations/20261108090000_security_hardening/migration.sql\nTests: security-input.test.ts and security-checkout.test.ts')
p('Application validation is verified locally. The SQL constraints are prepared in migration source but have not been installed or tested on Neon. Direct database rejection tests are a mandatory deployment acceptance step.')

# PAGE 4
newpage('SEC-03  Payment and Pricing Security', 'IMPLEMENTATION REMEDIATED  |  WALLET-ONLY CHECKOUT')
heading('Problem statement', 2)
p('Client-controlled prices and payment-success assertions could bypass legitimate payment. Retried operations could repeat a charge.')
heading('Root cause', 2)
p('Mock endpoints and separate booking/payment/wallet calls lacked a single authoritative settlement boundary and durable request-replay protection.')
heading('Implemented solution', 2)
p('Direct-booking prices now derive from stored section day, month or year rates, validated duration units and seats. Hourly prices use the section hourly rate and actual start/end interval, or a matching section package price. Subscription prices and terms come from MembershipPlan records. Client display text and submitted totals cannot replace the authoritative price.')
p('Idempotency-Key is mandatory for the protected checkout POST routes. Keys are scoped to the authenticated caller and operation. PostgreSQL transaction advisory locks serialize matching requests. The request fingerprint and response are stored with the transaction: identical retries replay the saved result; reuse with a different payload returns HTTP 409.')
p('Booking or subscription creation, wallet debit, successful WALLET payment and idempotency result commit in one Prisma transaction. Insufficient balance rolls back the booking. Company wallets use conditional balance decrements; personal wallets retain the existing company-credit spending controls.')
p('Public payment registration can only return an existing settlement. Production mock-payment and simulated gateway-refund routes return HTTP 404. Development mock payments cannot credit real ledgers. Purchased subscription fields are protected from client updates, and refunds require an actual original payment.')
heading('Verification tests', 2)
table(['Scenario', 'Verified result'], [
 ['Client sends a low price / total', 'Direct, hourly and subscription routes use database-derived prices.'],
 ['Concurrent identical retry', 'Handler executes once; saved response is replayed.'],
 ['Same key, different payload / caller', 'Conflicting payload returns 409; caller scope is isolated.'],
 ['Insufficient wallet balance', 'Settlement throws before a successful payment is recorded.'],
 ['Production mock-payment request', 'Endpoint returns HTTP 404.'],
], [2.88, 3.95])
heading('Operational effect and closure', 2)
p('Wallet-funded checkout is the supported settlement path. Card/invoice payment, ordinary self-service wallet top-ups and browser-calculated pass/points discounts remain blocked until verified provider callbacks or server-side entitlement rules are implemented. This restriction is a deliberate mitigation, not a completed payment-provider integration.')
small('Evidence: backend/lib/security/idempotency.ts and checkout.ts; direct-bookings, hourly-bookings, subscriptions and payments routes. Tests: security-pricing.test.ts, security-idempotency.test.ts and security-checkout.test.ts. Real PostgreSQL concurrency validation remains pending.')

# PAGE 5
newpage('SEC-04  OTP Brute-Force and Flooding Protection', 'IMPLEMENTATION REMEDIATED  |  ACCOUNT-BOUND ENFORCEMENT')
heading('Problem statement', 2)
p('Repeated OTP requests could flood an account with messages, while automated guesses could target the six-digit verification code. Concurrent requests across application instances could bypass protections based on unsynchronized counters.')
heading('Root cause', 2)
p('The previous resend interval and verification flow did not provide the required persistent 60-second cooldown and 15-minute account lockout. Failure increments, code replacement and code consumption required a shared atomic control to remain consistent across workers.')
heading('Implemented solution', 2)
p('OTP issuance and verification now share a PostgreSQL transaction advisory lock per account. The OtpThrottle record stores the last issuance time, consecutive failures and lockout deadline. A new code cannot be issued within 60 seconds, including across different OTP purposes.')
p('Five consecutive incorrect submissions invalidate pending codes and lock both verification and new issuance for 15 minutes. Requesting a new code does not clear the failure count. A correct consumed code can be used only once. Lockout responses use HTTP 429 with Retry-After and structured retryAfter/code fields.')
p('The frontend OTP screen displays the resend countdown, consumes backend throttle responses, shows remaining lockout time and disables resend/verification while locked. The lockout deadline persists in session storage across reloads. Clearing browser state cannot bypass backend enforcement. Production also refuses to log OTP codes as a substitute for configured email delivery.')
heading('Verification tests', 2)
table(['Scenario', 'Verified result'], [
 ['Concurrent requests for a fresh OTP', 'One issuance succeeds; the other observes cooldown.'],
 ['Resend across OTP purposes', 'The same account cooldown remains in force.'],
 ['Five concurrent wrong guesses', 'Codes are invalidated and a 900-second lockout is returned.'],
 ['New code after four failures', 'The next wrong attempt still triggers lockout.'],
 ['Correct code replay / lockout expiry', 'A consumed code works once; a new code works after expiry.'],
], [2.89, 3.94])
heading('Implementation evidence and closure', 2)
small('backend/lib/auth/otp.ts and the authentication issue/verify routes\nfrontend/app/Auth/page.tsx; frontend/lib/api-config.ts\nTests: security-otp.test.ts; frontend and backend TypeScript checks')
p('Account-level abuse protection is verified in local unit tests. A separate trusted-edge IP limiter is not included. Frontend timer behavior is implemented and type-checked; browser end-to-end validation and real database race testing remain deployment acceptance tasks.')

# PAGE 6
newpage('3  Quality Assurance Summary')
p('The recorded local verification run completed on 8 November 2026. All 109 automated tests passed across 13 test suites (test files), comprising 52 new security tests and 57 existing regression tests. The following results are the evidence for implementation-stage closure.')
table(['Quality gate', 'Result', 'Evidence / scope'], [
 ['Automated unit tests', 'PASS', '109 passed; 13 test suites; backend npm test.'],
 ['Backend TypeScript', 'PASS', 'npm run typecheck completed without type errors.'],
 ['Frontend TypeScript', 'PASS', 'npm run typecheck completed without type errors.'],
 ['Patch whitespace check', 'PASS', 'git diff --check completed successfully.'],
 ['Prisma client generation', 'COMPLETE', 'Client regenerated for the schema additions.'],
 ['Neon migration and live constraints', 'PENDING', 'Migration source prepared; no production application.'],
 ['PostgreSQL concurrency / browser E2E', 'PENDING', 'Not established by mocked database unit tests.'],
 ['Production build and deployment', 'PENDING', 'No production build or deployment executed.'],
], [2.13, .86, 3.84])
heading('Automated test inventory', 2)
table(['Test suite', 'Passed', 'Test suite', 'Passed'], [
 ['security-input', '36', 'security-otp', '4'],
 ['security-idempotency', '4', 'security-checkout', '4'],
 ['security-pricing', '4', 'super-admin', '5'],
 ['password-policy', '19', 'sessions-credit', '4'],
 ['otp-mailer', '6', 'capacity', '5'],
 ['fair-use', '4', 'operating-hours', '10'],
 ['cr-number', '4', 'TOTAL', '109'],
], [2.64, .62, 2.95, .62], size=9)
heading('Evidence interpretation', 2)
p('The unit tests use mocked transaction clients to verify validation, pricing, replay/conflict handling and OTP state transitions. They do not independently demonstrate PostgreSQL lock behavior, migration compatibility or runtime UI synchronization. Those boundaries are explicitly retained in the deployment acceptance plan.')
small('Evidence record: SECURITY_PATCH.md; backend/tests/security-*.test.ts; the existing backend test suites; and the successful test/type-check command outputs recorded during remediation. This report does not certify unrelated platform routes or imply an independent production penetration test.')

# PAGE 7
newpage('4  Deployment Recommendations')
heading('Database and configuration readiness', 2)
p('1. Reconcile negative or non-finite historical ledger values in staging. Verify catalog rates and set each MembershipPlan.durationDays to its actual term; the new field defaults to 30 days.')
p('2. Apply the reviewed Prisma migration against an isolated staging database first, using the deployment environment for DATABASE_URL. Do not substitute prisma db push: it does not install the custom SQL CHECK constraints. Regenerate the client and repeat verification before production rollout.')
small('Migration: backend/prisma/migrations/20261108090000_security_hardening/migration.sql')
code('cd backend\nnpx prisma migrate deploy\nnpx prisma generate')
p('3. Generate a new random JWT signing key, store it in the deployment secret manager as JWT_SECRET, and configure strong Super Admin credentials and OTP email delivery. Do not commit the generated key. Rotate any exposed/default key and revoke affected sessions.')
code('node -e "console.log(require(\'crypto\').randomBytes(48)\n  .toString(\'base64url\'))"')
small('Run the generation command as one line. The report intentionally contains no usable secret.')
heading('Release acceptance', 2)
p('4. Verify real simultaneous retries, conflicting keys, insufficient-balance rollback, direct SQL constraint rejection, OTP cooldown/lockout, cancellation/refunds and the browser wallet flow. Run the production build. Deploy the matching database, backend and frontend only after these checks pass. Retain wallet-only restrictions until secure integrations are accepted.')
heading('5  Formal Sign-off and Approval')
p('Student declaration: I submit the implemented remediation and recorded local verification evidence for review. I acknowledge the pending deployment acceptance steps and the checkout restrictions stated in this report.')
table(['Student', 'Supervisor'], [
 ['Anas Saeed Alghamdi\nStudent ID: 444005852\nUmm Al-Qura University', 'Name: __________________________\nTitle: ___________________________\nDepartment: _____________________'],
 ['Signature: ______________________\nDate: __________________________', 'Signature: ______________________\nDate: __________________________'],
], [3.415, 3.415], size=9.5)
p('Supervisor disposition:  [  ] Implementation closure accepted   [  ] Revision required')
p('Production release acceptance:  [  ] Pending   [  ] Accepted after deployment verification')
small('Comments / conditions: __________________________________________________________\n_____________________________________________________________________________')

ROOT.mkdir(parents=True, exist_ok=True)
# Keep the more detailed payment finding together without reducing type size.
payment_section = False
for para in doc.paragraphs:
    if para.text.startswith('SEC-03  '): payment_section = True
    if para.text.startswith('SEC-04  '): payment_section = False
    if payment_section and para.style.name == 'Normal':
        para.paragraph_format.line_spacing = 1.05
        para.paragraph_format.space_after = Pt(5)
# Remove any inherited paragraph rules from the bundled Word template.
for tree in [doc.styles.element, doc.element]:
    for border in list(tree.iter(qn('w:pBdr'))):
        border.getparent().remove(border)
doc.save(OUT)
print(OUT)
