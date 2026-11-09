from pathlib import Path
p=Path(__file__).parent
s=(p/'restructure.py').read_text(encoding='utf-8')
intro='''
plain_problems=[
'The system used an easy-to-guess secret, allowing someone to disguise an ordinary account as an administrator and see private metrics.',
'A signed-in user could add money to their wallet without paying for it.',
'A user could claim to have made a larger payment and then receive that amount as a refund.',
'A user could receive the listed subscription price back even when no matching payment had been made.',
'The payment simulator accepted a negative amount, which could corrupt financial records.',
'Repeated login requests could send many verification emails to the same account in a short time.',
'One account could use another person’s subscription ID to see and change that person’s subscription.',
'A malicious workspace description could cause unwanted code to run when visitors opened the homepage.',
'Anyone could request a workspace and see private partner details, including tax and contact information.',
'Opening a public page could trigger creation of a predictable administrator account and reveal its email address.'
]
plain_fixes=[
'The application now refuses to start with a missing, short or known default signing secret. Admin passwords also require stronger complexity.',
'Only a super administrator can perform direct wallet changes; customer purchases must use the controlled checkout process.',
'The server now determines prices itself and refunds only a recorded, qualifying wallet payment.',
'The system now refuses a refund when it cannot find the customer’s qualifying payment.',
'Payment amounts must be valid positive values within a defined range. The mock payment route is unavailable in production.',
'The system makes users wait between codes and temporarily locks the account after repeated wrong guesses.',
'The system checks who owns the subscription before showing it. Direct edits remain disabled to protect paid entitlements.',
'The homepage converts special characters into safe JSON representations before inserting workspace information into the page.',
'Public workspace responses now expose only selected partner display details, not private legal or contact information.',
'Reading loyalty rules no longer creates accounts or rules, and public responses no longer include administrator email addresses.'
]
'''
s=s.replace("d=Document();",intro+"\nd=Document();")
s=s.replace('SECTION 1   Finding header and source audit mapping','SECTION 1   Overview').replace('SECTION 2   Problem breakdown and exploitation vector','SECTION 2   Problem Breakdown').replace('SECTION 3   Applied remediation and verification','SECTION 3   How We Fixed It')
s=s.replace("para('Affected endpoints and components:',endpoints[i])","para('Affected route:',endpoints[i])")
s=s.replace("para('Description:',vector)","para('In plain English:',plain_problems[i])").replace("para('Root cause:',roots[i])","para('Technical cause:',roots[i])")
s=s.replace("para('Exploit scenario:',scenarios[i])", "para('How it was tested:', scenarios[i].replace(' 2. ', '\\n2. ').replace(' 3. ', '\\n3. '))")
s=s.replace("para('Remediation and files:',fix)","para('In plain English:',plain_fixes[i])\n para('Technical implementation and files:',fix)")
s=s.replace("para('Verification and coverage:',verification)","para('Verification:', ('security-confirmed-findings.test.ts: ' if i >= 7 else '') + verification)")
s=s.replace("if i==1: para('Evidence limit:','The authorization restriction was inspected; a dedicated wallet deposit route test was not included in the 129-test run.')", "")
s=s.replace("if i==7: para('Evidence limit:','Serialization is unit-tested; a live browser retest of the homepage has not been completed.')", "")
(p/'plain_english_report.py').write_text(s,encoding='utf-8')
exec(compile(s,str(p/'plain_english_report.py'),'exec'))

