"""Language-specific text (cover, summary, chapter titles) used by build_report.py."""
from pathlib import Path

DOCS = Path(__file__).resolve().parent

FILES = [
    'PRD.md', 'SRS.md', 'System_Architecture.md', 'ERD.md',
    'Financial_Model.md', 'Legal_Policies.md', 'Partner_SLA.md', 'Support_Workflow.md',
]

LANGS = {
    'en': {
        'source': DOCS,
        'output': DOCS / 'Coworking_Pass_Final_Report_EN.docx',
        'chapters': [
            'Chapter 1: Product Requirements Document (PRD)',
            'Chapter 2: Software Requirements Specification (SRS)',
            'Chapter 3: System Architecture & Workflow Engine',
            'Chapter 4: Database Design & ERD',
            'Chapter 5: Financial & Pricing Model',
            'Chapter 6: Legal & Cancellation Policies',
            'Chapter 7: Partner Service Level Agreement (SLA)',
            'Chapter 8: Customer Support & Inquiries Workflow',
        ],
        'subtitle': 'Comprehensive Engineering, Architecture & Requirements Specification Report',
        'tagline': None,
        'labels': (('Version', '2.0'), ('Date', 'September 2026'), ('Status', 'Final project report')),
        'toc_title': 'Table of Contents',
        'toc_hint': 'Right-click here and choose "Update Field" to build the table of contents.',
        'exec_title': 'Executive Summary',
        'exec_intro': [
            'Coworking Pass is a Saudi coworking aggregator. It lets individuals and companies book a specific workspace directly, or use a Universal Pass to move between partner spaces across the Kingdom with a single subscription.',
            'This report consolidates the full project documentation into one document: the product requirements, the software requirements specification, the system architecture, the database design, and the financial, legal, partner and support policies. It reflects the platform as implemented at version 2.0.',
        ],
        'cap_title': 'Key capabilities of version 2.0',
        'capabilities': [
            '**Bilingual platform:** Arabic (default, RTL, Tajawal typography) and English, with workspace names, descriptions, addresses and cities authored in both languages and stored in the database.',
            '**Hub and rooms model:** one venue (hub) holds several rooms or sections — meeting rooms, theaters, offices — each with its own capacity and rates; bookings link to the chosen `sectionId`.',
            '**Session-based availability:** halls and theaters are booked in fixed 2-hour sessions inside venue operating hours; availability is evaluated per session and per room, not per day.',
            '**Financial integrity:** atomic, idempotent wallet debits, a corporate shared-wallet ledger, automatic refund rollback when a cart booking fails, and the 72-hour pass refund policy.',
            '**Security and governance:** role-based access with ownership scoping, permanent database-backed account suspension, cascading deletes and server-enforced hidden spaces.',
            '**Scope decisions:** the Company Workspaces page and the Custom Enterprise pass were removed to keep the B2B flow focused on Team Pass and Business Pass.',
        ],
        'structure_title': 'Report structure',
        'structure_note': 'The database chapter contains the entity-relationship diagram as Mermaid source; diagram blocks are shown as code because Word cannot render Mermaid.',
        'footer': 'Coworking Pass — Final Project Report v2.0',
        'page': 'Page ',
        'code_labels': ('Diagram source (Mermaid)', 'Code'),
    },
}

# The Arabic edition (docs/ar/) is kept local and not tracked by git; its text lives next to the Arabic sources.
_ar_text = DOCS / 'ar' / 'report_text_ar.py'
if _ar_text.exists():
    _scope = {'DOCS': DOCS}
    exec(compile(_ar_text.read_text(encoding='utf-8'), str(_ar_text), 'exec'), _scope)
    LANGS['ar'] = _scope['AR']
