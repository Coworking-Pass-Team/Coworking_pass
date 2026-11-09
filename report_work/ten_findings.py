from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

out = Path(__file__).parent / 'Security_Remediation_Report.docx'
d = Document(); s = d.sections[0]
s.top_margin = s.bottom_margin = Inches(.7)
s.left_margin = s.right_margin = Inches(.72)
for name in ['Normal', 'Title', 'Heading 1', 'Heading 2']:
    style = d.styles[name]; style.font.name = 'Calibri'; style.font.color.rgb = RGBColor.from_string('0F2240')
d.styles['Normal'].font.size = Pt(10)
d.styles['Normal'].paragraph_format.space_after = Pt(4)
for name, size, color in [('Title', 24, '0F2240'), ('Heading 1', 16, '0F2240'), ('Heading 2', 12, '107A57')]:
    st = d.styles[name]; st.font.size = Pt(size); st.font.bold = True; st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.space_after = Pt(6)
    st.paragraph_format.space_before = Pt(10)
d.core_properties.author = 'Anas Saeed Alghamdi'
d.core_properties.title = 'Official Security Audit Remediation & Closure Report'

def para(t): d.add_paragraph(t)
def head(t, n=1): d.add_heading(t, n)
def table(headers, rows):
    t=d.add_table(rows=1, cols=len(headers)); t.autofit=True; t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for i, values in enumerate([headers]+rows):
        row=t.rows[0] if i==0 else t.add_row()
        for cell, val in zip(row.cells,values):
            cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p=cell.paragraphs[0]; p.paragraph_format.space_after=Pt(0); r=p.add_run(str(val)); r.font.size=Pt(9.5); r.bold=i==0
            if i==0: r.font.color.rgb=RGBColor(255,255,255)
            pr=cell._tc.get_or_add_tcPr(); sh=OxmlElement('w:shd'); sh.set(qn('w:fill'), '0F2240' if i==0 else ('F0F5F6' if i%2 else 'FFFFFF')); pr.append(sh)
            mar=OxmlElement('w:tcMar')
            for edge in ('top','bottom','left','right'):
                e=OxmlElement('w:'+edge); e.set(qn('w:w'),'90'); e.set(qn('w:type'),'dxa'); mar.append(e)
            pr.append(mar)
    borders=OxmlElement('w:tblBorders')
    for edge in ('top','left','bottom','right','insideH','insideV'):
        border=OxmlElement('w:'+edge); border.set(qn('w:val'),'single'); border.set(qn('w:sz'),'4'); border.set(qn('w:color'),'D9D9D9'); borders.append(border)
    t._tbl.tblPr.append(borders)
    d.add_paragraph().paragraph_format.space_after=Pt(1)

d.add_paragraph('Official Security Audit Remediation & Closure Report', 'Title')
para('Muttaka (Coworking Pass Platform)')
para('Student: Anas Saeed Alghamdi  |  ID: 444005852\nUmm Al-Qura University')
para('Audit reference: Penetration Test Report by Tala Sami Alnabati, 28 October – 3 November 2026\nSupplemental reference: Coworking Pass Confirmed Findings, pages 1–3\nReport date: 9 November 2026')
head('1  Executive Summary')
para('The ten reported vulnerabilities have code-level remediations supported by the automated tests and static checks recorded below. The status describes local implementation evidence. Production closure remains subject to database migration, live PostgreSQL concurrency testing, browser verification and deployment approval.')
findings=[
('F-01','Critical','Administrator Role Forgery','A default JWT secret allowed an attacker to alter a B2C token role to SUPER_ADMIN, sign it with change-me and call GET /api/stats.','backend/lib/auth/secrets.ts, verify-token.ts, sessions.ts and instrumentation.ts validate the signing key at startup, reject default or short values and restrict verification to HS256. Production development seed credentials are disabled; Super Admin passwords require at least 12 characters and four character classes.','security-input.test.ts and super-admin.test.ts cover weak keys, password rules and production seed planning.'),
('F-02','Critical','Unbacked Wallet Deposit','A standard bearer token could submit POST /api/wallet with {"userId":"dda8e4d6-...","amount":5000,"type":"DEPOSIT","description":"test deposit"}, creating funds without a gateway receipt.','backend/app/api/wallet/route.ts restricts wallet mutations to SUPER_ADMIN. Customer checkout uses server-side wallet settlement; company deposits are likewise restricted.','security-checkout.test.ts covers debit and insufficient balance; the code-level role restriction is verified by inspection. A dedicated route-level deposit test is not included.'),
('F-03','Critical','Fake Payment and Refund Chain','The report describes a free direct booking, POST /api/payments with {"amount":7777,"method":"VISA","referenceId":"6bc1807a-..."}, then POST /api/refund to obtain 7,777 SAR.','backend/app/api/payments/route.ts returns existing settlements instead of accepting asserted success; booking routes derive prices from database records. backend/lib/security/idempotency.ts and checkout.ts bind the booking, wallet debit and payment to a transaction. Refunds require an owner-bound WALLET settlement.','security-pricing, security-idempotency, security-checkout and security-refund tests cover tampered pricing, replay and unpaid-booking rejection.'),
('F-04','Critical','Subscription Refund Fallback','The previous expression originalPayment?.amount ?? subscription.plan?.price ?? 0 credited the 15,000 SAR catalog price for an unpaid subscription.','backend/app/api/refund/route.ts requires a successful, owner-bound subscription WALLET payment and rejects missing payment; the catalog fallback is removed. Subscription DELETE uses the same refund path.','security-refund.test.ts checks rejection of the 15,000 SAR unpaid subscription and confirms no refund transaction starts.'),
('F-05','Medium','Negative Payment Amount Acceptance','The report submitted -500 SAR to POST /api/mock-payment; a truthiness check accepted the negative value.','backend/lib/security/input.ts validates raw numeric tokens and finite numeric amounts from 1.00 to 100,000.00 SAR before rounding. The production mock route returns 404; non-production simulation does not create ledger entries. A migration adds non-negative finite ledger checks.','security-input.test.ts tests negative, zero, null, numeric strings, NaN, infinity, boundary values and exponent notation. security-idempotency.test.ts checks production mock denial.'),
('F-06','Medium','Login OTP Verification Flooding','The original assessment sent eight login requests in 1.1 seconds; all eight returned 200 and dispatched OTP messages.','backend/lib/auth/otp.ts uses a shared account lock, 60-second issuance cooldown and five-failure, 15-minute lockout. Authentication routes return 429 and retry metadata; frontend/app/Auth/page.tsx displays countdown and lockout timers.','security-otp.test.ts covers concurrent issuance, cross-purpose cooldown, five wrong guesses, lockout expiry and one-time consumption. The frontend timer is type-checked; browser E2E remains pending.')]
findings.extend([
('F-07','Critical','Subscription Object Authorization','The supplemental report used two independent accounts in Burp Suite. An attacker token read and changed the victim subscription expiry via GET and PUT /api/subscriptions/[id], without an ownership check.','backend/app/api/subscriptions/[id]/route.ts checks authentication and persisted userId on GET and PUT; unrelated accounts receive 403. SUPER_ADMIN bypasses ownership only. Purchased subscriptions remain immutable: authorized PUT returns 405, preventing free extensions or status changes. Owners read their records and cancel through the existing refund path.','security-confirmed-findings.test.ts tests GET/PUT denial for unrelated and unauthenticated users, owner/admin reads, and no mutation for authorized PUT. This closes IDOR without reopening entitlement editing.'),
('F-08','High','Stored XSS in Homepage JSON-LD','The supplemental report stored a workspace name/description containing </script><script>...</script> through PUT /api/workspaces/[id]. JSON.stringify emitted literal angle brackets into the homepage script, allowing HTML parser breakout.','frontend/lib/json-ld.ts serializes JSON and Unicode-escapes <, >, &, U+2028 and U+2029. frontend/app/page.tsx uses serializeJsonLd for the script content. Encoding at the output boundary protects existing stored payloads and preserves the original text when JSON is parsed.','Four regression cases cover closing script tags, mixed-case tags, HTML comments, Arabic text and Unicode separators. Tests assert no literal HTML-sensitive characters and exact data round-trip. Homepage integration was inspected; live browser retesting remains a deployment check.'),
('F-09','High','Public Partner Data Disclosure','Anonymous GET /api/workspaces/[id] returned the complete related Partner record, exposing tax identifiers and contact email. The workspace list had the same response exposure.','backend/lib/workspaces/public-partner.ts uses an explicit id/brandName allowlist. Both backend/app/api/workspaces/[id]/route.ts and backend/app/api/workspaces/route.ts replace the nested partner record with this public representation. Workspace city remains available; taxNumber, taxId, crNumber, email and phone are excluded.','Route tests inject sensitive partner fields into database fixtures and assert that detail and list responses contain only the allowed partner fields. A hidden-workspace test confirms anonymous requests still receive 404.'),
('F-10','High','Administrator Provisioning Through Public Reads','The supplemental report found GET /api/loyalty-rules called seedLoyaltyRules on an empty table, formerly provisioning admin@coworkingpass.sa with password and returning proposer/approver email addresses.','backend/app/api/loyalty-rules/route.ts no longer imports or invokes a seed routine. A Prisma field allowlist excludes proposer/approver identities. Empty results return []. The workspace list automatic seed path was also removed. Earlier seed-data.ts hardening already removed default admin creation and requires an existing securely provisioned admin.','Tests verify empty loyalty and workspace reads never invoke seeding or user creation, and confirm the loyalty query selects only rule fields. Current seed helper was inspected to confirm missing administrators cause an error rather than account provisioning.')
])
table(['Finding','Severity','Code status'],[[a,b,'RESOLVED & VERIFIED locally'] for a,b,*_ in findings])
d.add_page_break()
head('2  Detailed Findings')
for a,b,title,vector,fix,verification in findings:
    if a in ('F-04', 'F-07'): d.add_page_break()
    head(f'{a}  {title}  —  {b}',2)
    p=d.add_paragraph(); p.add_run('Root cause and exploit vector. ').bold=True; p.add_run(vector)
    p=d.add_paragraph(); p.add_run('Applied code fix. ').bold=True; p.add_run(fix)
    p=d.add_paragraph(); p.add_run('Verification. ').bold=True; p.add_run(verification)
d.add_page_break()
head('3  Quality Assurance Summary')
table(['Check','Result'],[['Backend automated unit tests','129 passed across 15 test files; 100% of executed tests passed'],['Backend TypeScript','Passed: tsc --noEmit'],['Frontend TypeScript','Passed: tsc --noEmit'],['PostgreSQL migration and race checks','Pending: database-backed staging validation'],['Browser end-to-end and production build','Pending']])
para('The 129-test result includes the previous 111 tests plus 18 supplemental regression tests. Backend npm test and both npm run typecheck commands passed on 9 November 2026. The security unit tests mock database transactions; they do not prove real PostgreSQL lock behavior or production deployment.')
head('4  Operational Scope')
para('Checkout currently supports wallet-funded settlement only. Card/invoice checkout, ordinary self-service top-ups, and client-calculated pass or points discounts remain blocked until verified provider callbacks and server-side entitlement rules are implemented. OTP lockout is account-bound; no separate trusted-edge IP limiter is included.')
head('5  Deployment and Migration Checklist')
para('Migration status: Migration Script Ready; local PostgreSQL migration testing and production deployment on Neon are pending. The prepared SQL adds Payment, WalletTransaction and CompanyWalletTransaction checks. Inspect historical invalid amounts, apply the Prisma migration to staging, regenerate the client, and verify constraints and concurrency before deploying to Neon. prisma db push alone does not install the custom checks.')
para('Generate a fresh JWT_SECRET of at least 32 characters using a cryptographically secure random generator, store it in the deployment secret manager, rotate any exposed key and revoke affected sessions. Audit and disable any historical default administrator accounts; removing a seed path does not remove accounts already provisioned. Configure strong Super Admin credentials and OTP email delivery. Verify catalog rates and membership plan durations before rollout.')
head('6  Formal Sign-off and Approval')
para('Student declaration: I submit the implementation and local verification evidence for supervisor review, acknowledging the remaining deployment checks.')
table(['Student','Supervisor'],[['Anas Saeed Alghamdi\nStudent ID: 444005852\nUmm Al-Qura University','Name: __________________________\nTitle: ___________________________'],['Signature: ______________________\nDate: __________________________','Signature: ______________________\nDate: __________________________']])
para('Supervisor disposition:  [  ] Code remediation accepted   [  ] Revision required\nProduction deployment acceptance:  [  ] Pending   [  ] Accepted after staging verification')
for tree in (d.styles.element,d.element):
    for x in list(tree.iter(qn('w:pBdr'))): x.getparent().remove(x)
d.save(out); print(out)
