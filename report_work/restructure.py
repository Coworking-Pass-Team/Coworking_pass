import ast
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT

root=Path(__file__).parent
node=ast.parse((root/'ten_findings.py').read_text(encoding='utf-8'))
findings=[]
for n in node.body:
    if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='findings' for t in n.targets): findings=ast.literal_eval(n.value)
    if isinstance(n,ast.Expr) and isinstance(n.value,ast.Call) and isinstance(n.value.func,ast.Attribute) and isinstance(n.value.func.value,ast.Name) and n.value.func.value.id=='findings': findings.extend(ast.literal_eval(n.value.args[0]))
endpoints=[
'GET /api/stats; JWT verification and signing; admin credentials and seed routines.',
'POST /api/wallet; wallet credit and settlement logic.',
'POST /api/direct-bookings, /api/payments and /api/refund; checkout and idempotency.',
'GET /api/membership-plans; POST /api/subscriptions and /api/refund; subscription cancellation.',
'POST /api/mock-payment; monetary parsing and ledger constraints.',
'POST /api/auth/login and /api/auth/verify-login; OTP issuance, verification and authentication UI.',
'GET and PUT /api/subscriptions/[id]; subscription ownership and entitlement mutation.',
'PUT /api/workspaces/[id]; GET / (frontend homepage); JSON-LD script.',
'GET /api/workspaces/[id] and GET /api/workspaces; partner relation and public serialization.',
'GET /api/loyalty-rules; public seed logic and proposer/approver response fields.']
roots=[
'The verifier trusted an HS256 key that was a publicly guessable default; possession of that secret allowed a forged role claim to pass signature verification.',
'The deposit path trusted client-selected transaction type and amount without linking the credit to a verified external settlement.',
'The application accepted a client-asserted payment amount and treated the resulting record as an authoritative basis for a wallet refund.',
'The null-coalescing expression originalPayment?.amount ?? subscription.plan?.price ?? 0 substituted the catalog price when proof of payment was absent.',
'The truthiness condition if (!amount) rejects zero but accepts negative numbers, because nonzero negative values are truthy.',
'Login OTP issuance had no effective per-account resend cooldown; repeated requests could repeatedly trigger messages.',
'The former handler authenticated callers but failed to compare the subscription owner with the token subject before reading or updating the record.',
'JSON.stringify produces valid JSON but does not escape HTML script delimiters; inserting it through dangerouslySetInnerHTML lets the HTML parser terminate the script element.',
'The public workspace query included the complete related partner record and the response spread it into the output without a public-field allowlist.',
'An empty-table GET invoked seedLoyaltyRules, formerly creating a predictable administrator account; included proposer and approver relations exposed email addresses.']
scenarios=[
'1. Sign in as a B2C user and copy its token. 2. Change role to SUPER_ADMIN and sign with change-me. 3. Send it as a Bearer token to GET /api/stats; the audit observed administrative data.',
'1. Sign in as a standard user. 2. POST {"userId":"dda8e4d6-...","amount":5000,"type":"DEPOSIT","description":"test deposit"} to /api/wallet. 3. The audit observed a 5,000 SAR credit without payment proof.',
'1. Create a free direct booking and retain its ID. 2. POST {"amount":7777,"method":"VISA","referenceId":"6bc1807a-..."} to /api/payments. 3. Request a refund; the audit observed 7,777 SAR credited.',
'1. Select the 15,000 SAR plan via GET /api/membership-plans. 2. Create an active subscription with no payment. 3. Submit its ID to POST /api/refund; the audit observed a 15,000 SAR credit.',
'1. Submit a mock payment with amount -500. 2. The truthiness check passes. 3. The report recorded a successful response and a negative payment entry.',
'1. Obtain valid login credentials in the audit environment. 2. Send eight login requests in 1.1 seconds. 3. The report recorded eight successful responses and eight OTP emails.',
'1. Obtain tokens for a victim and unrelated attacker. 2. Use the attacker token with the victim subscription ID in GET, then PUT changing expiry. 3. The report recorded successful read and mutation.',
'1. As an authorized workspace editor, store a name or description containing </script><script>alert(1)</script>. 2. Open the homepage. 3. The audit found the literal payload in the JSON-LD source, allowing script breakout.',
'1. Obtain or guess a workspace ID. 2. Send GET /api/workspaces/[id] without credentials. 3. Inspect the nested partner object for tax and contact fields.',
'1. Start with an empty loyalty-rule table. 2. Send unauthenticated GET /api/loyalty-rules. 3. The reported old code seeded an administrator with a known password and exposed email fields.']

d=Document(); sec=d.sections[0]; sec.top_margin=sec.bottom_margin=Inches(.62); sec.left_margin=sec.right_margin=Inches(.7)
normal=d.styles['Normal']; normal.font.name='Calibri'; normal.font.size=Pt(10.5); normal.font.color.rgb=RGBColor.from_string('162943'); normal.paragraph_format.space_after=Pt(5)
for nm,size,color in [('Title',22,'0F2240'),('Heading 1',16,'0F2240'),('Heading 2',12,'0F2240')]:
 s=d.styles[nm]; s.font.name='Calibri'; s.font.size=Pt(size); s.font.bold=True; s.font.color.rgb=RGBColor.from_string(color); s.paragraph_format.space_before=Pt(7); s.paragraph_format.space_after=Pt(5)
for tree in (d.styles.element,d.element):
 for el in list(tree.iter(qn('w:pBdr'))): el.getparent().remove(el)
d.core_properties.author='Anas Saeed Alghamdi'; d.core_properties.title='Official Security Audit Remediation and Closure Report'
def para(label,text):
 p=d.add_paragraph(); p.add_run(label+' ').bold=True; p.add_run(text); return p
def shade(p,color):
 pr=p._p.get_or_add_pPr(); sh=OxmlElement('w:shd'); sh.set(qn('w:fill'),color); pr.append(sh)
def card(title):
 p=d.add_paragraph(); p.paragraph_format.space_before=Pt(5); p.paragraph_format.space_after=Pt(5); r=p.add_run(title); r.bold=True; r.font.color.rgb=RGBColor.from_string('0F2240'); r.font.size=Pt(11); shade(p,'EAF1F3')
def table(headers,rows):
 t=d.add_table(rows=1,cols=len(headers)); t.autofit=True
 for i, vals in enumerate([headers]+rows):
  row=t.rows[0] if i==0 else t.add_row()
  for cell,val in zip(row.cells,vals):
   cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER; p=cell.paragraphs[0]; p.paragraph_format.space_after=Pt(1); r=p.add_run(str(val)); r.font.size=Pt(9.5); r.bold=(i==0)
   if i==0: r.font.color.rgb=RGBColor(255,255,255)
   pr=cell._tc.get_or_add_tcPr(); sh=OxmlElement('w:shd'); sh.set(qn('w:fill'),'0F2240' if i==0 else ('F0F5F6' if i%2 else 'FFFFFF')); pr.append(sh)
   mar=OxmlElement('w:tcMar')
   for side in ('top','bottom','left','right'):
    e=OxmlElement('w:'+side); e.set(qn('w:w'),'75'); e.set(qn('w:type'),'dxa'); mar.append(e)
   pr.append(mar)
  trpr=row._tr.get_or_add_trPr(); trpr.append(OxmlElement('w:cantSplit'))
 return t

d.add_paragraph('Official Security Audit Remediation & Closure Report','Title')
d.add_paragraph('Muttaka (Coworking Pass Platform)\nAnas Saeed Alghamdi  |  Student ID: 444005852\nUmm Al-Qura University')
d.add_heading('Executive Summary',1)
d.add_paragraph('This report maps ten audit findings to the implemented controls and local verification evidence. Code remediation is recorded below; production closure remains subject to deployment, database-backed checks and independent retesting.')
table(['ID','Severity','Source','Code status'],[[f[0],f[1],'A' if i<6 else 'B','RESOLVED locally'] for i,f in enumerate(findings)])
d.add_paragraph('Document A: Penetration_Test_Report_Coworking_Pass.pdf, Tala Sami Alnabati, 28 October–3 November 2026.\nDocument B: Coworking_Pass_Confirmed_Findings.pdf, Burp Suite and source-code review.')
for i,(ident,severity,title,vector,fix,verification) in enumerate(findings):
 d.add_page_break(); d.add_heading(ident+'  '+title,1)
 card('SECTION 1   Finding header and source audit mapping')
 p=para('Severity:',severity+'     |     '); r=p.add_run('RESOLVED (code level)'); r.bold=True; r.font.color.rgb=RGBColor.from_string('107A57')
 para('Source audit:',('Document A — Penetration_Test_Report_Coworking_Pass.pdf; auditor Tala Sami Alnabati.' if i<6 else 'Document B — Coworking_Pass_Confirmed_Findings.pdf; Burp Suite and code audit.'))
 para('Affected endpoints and components:',endpoints[i])
 card('SECTION 2   Problem breakdown and exploitation vector')
 para('Description:',vector)
 para('Root cause:',roots[i])
 para('Exploit scenario:',scenarios[i])
 card('SECTION 3   Applied remediation and verification')
 para('Remediation and files:',fix)
 para('Verification and coverage:',verification)
 if i==1: para('Evidence limit:','The authorization restriction was inspected; a dedicated wallet deposit route test was not included in the 129-test run.')
 if i==6: para('Behavioral limitation:','PUT returns 405 even for owners and SUPER_ADMIN; cross-account GET/PUT is rejected with 403 before mutation.')
 if i==7: para('Evidence limit:','Serialization is unit-tested; a live browser retest of the homepage has not been completed.')
d.add_page_break(); d.add_heading('Quality Assurance Summary',1)
table(['Verification','Result'],[['Backend automated unit tests','129 passed / 15 test files; 100% of executed tests passed'],['Backend and frontend TypeScript','Both npm run typecheck checks passed'],['PostgreSQL migration and real lock behavior','Pending database-backed validation'],['Browser end-to-end and production build','Pending']])
d.add_paragraph('The results reflect the local run on 9 November 2026. Several security tests use database mocks; they do not establish behavior of a deployed database or prove absolute immunity to future defects.')
d.add_heading('Deployment and Migration',1)
d.add_paragraph('The migration script is ready. Local PostgreSQL migration testing and production deployment on Neon are pending. Review existing ledger records, test the SQL checks and concurrent transactions in staging, and apply the migration before release. Rotate exposed JWT secrets using a cryptographically secure random value of at least 32 characters, revoke affected sessions, and audit historical default administrator accounts.')
d.add_heading('Student and Academic Supervisor Sign-off',1)
table(['Student','Academic supervisor'],[['Anas Saeed Alghamdi\nStudent ID: 444005852\nUmm Al-Qura University','Name: __________________________\nTitle: ___________________________'],['Signature: ________________________\nDate: ____________________________','Signature: ________________________\nDate: ____________________________']])
d.add_paragraph('Disposition:  [  ] Remediation accepted   [  ] Revision required\nProduction acceptance:  [  ] Pending   [  ] Accepted after staging verification')
out=root/'Security_Remediation_Report.docx'; d.save(out); print(out)
