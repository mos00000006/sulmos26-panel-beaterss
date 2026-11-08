SULMOS26 PANEL BEATER EDITION — PHASE 1 PROTOTYPE
================================================
This is a self-contained browser prototype and does NOT connect to the existing hardware retail backend or D1 database.

Open index.html in Chrome or Edge. It works without a server.

Working demonstration functions:
- Vehicle intake and job card numbers
- Repair assessments and estimates with parts, labour and VAT demonstration setting
- Workshop production stage tracking
- Printable A4 vehicle intake sheet, repair estimate and workshop job card
- Local browser storage for test data only

IMPORTANT:
- This is NOT suitable for live personal/customer information, insurer claims, or real invoices.
- Data is stored in localStorage; clearing browser data deletes it; it is not secure, shared or backed up.
- No authentication, insurer integration, photo upload, bank payments, VAT compliance verification or cloud sync.
- The existing hardware edition remains unchanged.

NEXT PRODUCTION PHASE
- Separate authenticated backend + isolated D1 database / multi-tenant isolation
- User roles (owner, estimator, service advisor, panel beater, spray painter, parts controller, QC)
- Secure photo storage, insurer claim workflow and approvals
- Customer authorisations and supplement approval
- Parts orders and supplier receiving
- Labour timesheets, stages, quality control and rework
- Customer-branded templates, invoicing and payment integration
- Backups and audit logging
