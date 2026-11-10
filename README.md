# SULMOS26 IT & Telecommunications Edition — Starter v0.1

## Included
- Official SULMOS26 uploaded logo on the company settings screen and branded navigation.
- App icons cropped from the original logo symbol: 192×192, 512×512, and Apple touch icon.
- PWA manifest and offline service worker for HTTPS/localhost hosting.
- Responsive dashboard with statistics.
- Customer register; support ticket log; technician job register; equipment tracking.
- Create/edit/delete/search and browser-local persistence.
- Editable company identity.

## Run locally
To preview with PWA install support, start a local HTTP server inside this directory:

```bash
python -m http.server 8080
```

Open `http://localhost:8080` in Chrome or Edge. You can also upload the *contents* of this folder to a static HTTPS website. On HTTPS or localhost, supported browsers can show **Install App** or use browser menu → Install app. The installed home-screen icon uses the supplied SULMOS26 symbol.

## Important production limitations
This is a usable **single-device starter**, not a production multi-company ERP. Data is in localStorage and can be lost if browser site data is cleared. Do not put customer-sensitive information or passwords into it. The badge “Local demo” indicates no hosted backend. User authentication, tenant isolation, PostgreSQL, full audit log, server synchronization, encrypted credentials, invoicing, integration, field offline sync and automated notifications are NOT implemented. Those require further development and a secure server environment.

## Next build
Set up Node.js + PostgreSQL + Prisma backend, company-scoped authentication/authorization, audit trails, transactional job status handling, proper client data backups, technicians and departments, billing, and optional offline synchronization. Deploy and test against the intended origin before real customer use.
