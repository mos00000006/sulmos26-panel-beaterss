SULMOS26 PANEL BEATER V38 — REPAIR THE OLD PROTOTYPE DEPLOYMENT

Why the screen still says PROTOTYPE:
- Your repository still has the old root-level index.html, AND
- wrangler.jsonc in GitHub still has REPLACE_WITH_NEW_PANEL_BEATER_D1_DATABASE_UUID.
The previous green GitHub CHECK does not mean the new Worker was deployed.

Files in this ZIP:
.github/workflows/deploy-panel-beater.yml  <- new manual GitHub deployment
scripts/prepare-deploy.mjs              <- validates correct files and safe D1 ID
public/index.html                       <- modern app entry + PWA links (cache refresh)
public/manifest.webmanifest             <- installed app name and icons
public/assets/icon-192.png             <- Windows/mobile icon
public/assets/icon-512.png             <- Windows/mobile icon
public/assets/sulmos26-logo.webp        <- original SULMOS26 logo

1. Upload THESE files into the SAME relative folders in:
   github.com/mos00000006/sulmos26-panel-beaterss
   Do NOT upload them into sulmos26-retail-hub.
2. Confirm the previously uploaded V37 app code exists:
   public/app.js, public/styles.css, src/index.js,
   migrations/0001_panel_beater_core.sql
3. Cloudflare > Storage & databases > D1: create/find the PANEL BEATER database
   named panel-beater-db. Never use the retail sulmos26-db.
4. GitHub repo Settings > Secrets and variables > Actions > New repository secret.
   Enter the actual D1 database UUID under PANEL_BEATER_D1_DATABASE_ID.
   Also add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID for this repository.
   (Secrets from a different repository DO NOT transfer automatically.)
5. Cloudflare Worker sulmos26-panel-beaterss > Settings > Variables and Secrets:
   SETUP_KEY must be a private random string of at least 32 characters.
6. Open GitHub Actions > Deploy SULMOS26 Panel Beater V38 > Run workflow > main.
   It checks code, applies the DB schema, and deploys the src/index.js Worker
   with assets served from public/ (NOT the old root index.html).
7. Check the deploy job is green. Open
   https://sulmos26-panel-beaterss.moyanamoses006.workers.dev/
   in a normal browser tab, Ctrl+Shift+R.
8. Verify OLD "PROTOTYPE" screen is GONE; new branding and initial owner setup appear.
   If old site persists, check Cloudflare Worker Deployments for latest version.
9. Install app using Chrome/Edge install icon. If old shortcut persists, uninstall
   OLD installed prototype and install the new site again.

IMPORTANT: This ZIP repairs DEPLOYMENT and ICONS. It does not include the entire
V37 API and front-end because they already exist in the previous V37 ZIP. If the
V37 files are absent, prepare-deploy fails safely rather than deploying the old demo.

This patch is designed to avoid creating a second Worker and avoid any access to
SULMOS26 Retail. Cloudflare Git integration may still attempt its own deploy
using the placeholder wrangler.jsonc; the verified GitHub Action deploy above
uses the correct ID from the secret.
