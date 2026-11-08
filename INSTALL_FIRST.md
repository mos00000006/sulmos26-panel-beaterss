# SULMOS26 Panel Beater Edition — V37 All-Phases Patch

## What this package contains
Cloudflare Worker (src/index.js), responsive PWA (public/), independent D1 SQLite schema (migrations/), GitHub check workflow and tests. Features: company onboarding and brand/logo, customers/vehicles, vehicle intake, repair estimates and approvals, branded PDF estimates and invoices, payment recording, workshop job stages, technicians and QC, damage photos, job paperwork, reporting, audit trail, mobile invoice download.

## Before you install
- This is a NEW edition, **not a patch for sulmos26-retail-hub**. Use only GitHub repo `mos00000006/sulmos26-panel-beaterss` (as shown in the Cloudflare screenshot), or whichever repo your panel-beater Worker is connected to.
- Keep backup of current prototype repository files. Do not use production customer data before end-to-end verification, access testing, and accountant review of VAT invoices.
- The software is a functional cloud-connected version; bank/card terminal verification, insurer integrations, backup/restore, secure production file storage, POPIA readiness and formal tax-compliance review are NOT complete.

## Install, step by step
1. In Cloudflare dashboard choose **Storage & databases → D1 SQL Database → Create database**. Name it `panel-beater-db`. Do NOT use or alter the retail `sulmos26-db` database.
2. Copy the newly created D1 database UUID from Cloudflare.
3. Upload this package's application source files/folders to the **Panel Beater GitHub repository root**. Replace the previous demo `index.html` with the new `public/index.html`; do not keep the old root-level `index.html` (Cloudflare static asset path is now `public/`). Include the hidden `.github` folder workflow.
4. Edit `wrangler.jsonc`, replace `REPLACE_WITH_NEW_PANEL_BEATER_D1_DATABASE_UUID` with the UUID from Step 2. Preserve name `sulmos26-panel-beaterss` if you want to update the existing Worker instead of creating a second one.
5. In Cloudflare **Workers & Pages → sulmos26-panel-beaterss → Settings → Variables and Secrets**, add a **secret** named `SETUP_KEY`, with your own securely generated random string of at least 32 characters. Never add its real value to GitHub, messages, or screen captures.
6. In GitHub, commit. **Panel Beater Check** should pass. Cloudflare Git integration should deploy the Worker, using `npx wrangler deploy`. If automatic deployment fails, view its deployment log and correct the Wrangler configuration before proceeding.
7. Apply database schema to the NEW remote database **before using the app**. Recommended from a terminal in the repo with Wrangler authenticated: `npx wrangler d1 migrations apply panel-beater-db --remote`. (Cloudflare dashboard D1 console also supports running SQL from `migrations/0001_panel_beater_core.sql`; do not run against your retail database.)
8. Visit your existing Panel Beater Worker URL. On first setup, enter company name, owner, username, strong password and your `SETUP_KEY`. This installs the FIRST company. Then sign in and open **Company Branding** to upload its logo and complete contact/invoice details.
9. For additional companies, the **Staff & Access** page provides a controlled **Add another workshop** form; it requires the platform installation secret. Each company's records are scoped to its own company ID. Keep the secret with the platform administrator, not customer staff.
10. To install on phone/Windows, open the Worker website in Chrome or Edge and choose **Install app / Add to Home Screen**. The PWA icon uses SULMOS26 branding. Customer-facing PDFs use their own uploaded logo.

## Acceptance test before real use
A) Create test customer and vehicle; create intake job and download intake PDF.
B) Create repair estimate with parts, labour and paint line items; confirm totals; approve as authorised manager; download estimate PDF.
C) Issue invoice from approved estimate; download branded PDF on desktop and phone; send the downloaded file manually via WhatsApp/email.
D) Confirm non-authorised roles cannot access invoices or other companies' data; confirm technicians see assigned jobs only.
E) Record a TEST verified payment with a unique reference; check outstanding amount; check job progress, QC and customer collection forms.
F) Confirm PWA install icon, logo and company data isolation. Independently review invoice/VAT compliance before real financial use.

## Key boundaries
- Download Invoice generates a PDF directly in the browser; the app does NOT send WhatsApp/email automatically.
- Company branding appears on downloaded paperwork; installed app icon remains SULMOS26-branded.
- Invoicing is functional, but full SARS-specific tax-invoice validation, corrections/credit notes, reversals and bank terminal integration are not yet certified/implemented.
- Photo evidence is stored in D1 as compressed data for prototype usage and is limited per job; scale-out object storage with retention and backup is recommended before production.
- No cloud deployment, D1 binding, secret or migration is performed automatically just by uploading this ZIP.
