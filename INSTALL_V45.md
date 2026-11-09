# SULMOS26 Automotive V45 — all 3 phases (real vehicle preview)

## Scope
Applies ONLY to the separate GitHub repository `mos00000006/sulmos26-panel-beaterss`.
Preserves existing V42 PDF styling and V44 inspection functionality.

### Phase 1: Vehicle Preview Library
Company owners can upload 1–9 licensed vehicle photographs (front, side, rear, top and intermediate angles) for an exact vehicle make/model/year. Assets are saved in tenant-isolated D1 records. There are no embedded Toyota manufacturer assets.

### Phase 2: 3D & 360-degree photo inspection
- Job selector reads make/model/year and asks for colour.
- Exact supplied `.glb` model has mouse/touch rotation/zoom and clickable panel meshes **only if model mesh names match the supported panel list**.
- Otherwise 360-style image carousel with multiple owner-uploaded photos; image angles switch instead of freely rotating.
- No fake cube/car substitute. Colour picker applies to supported 3D body materials, **not to photographs**.
- Damage rows, severity, repair action and notes saved against the job with revision checking.

### Phase 3: Inspection PDFs and repair-document appendix
- Download professional branded damage assessment PDF, optionally showing current vehicle view.
- After saving the inspection, generated repair-estimate and job-card PDFs append a vehicle condition page with saved preview and damage list.
- The snapshot is saved per job in D1. If no picture exists, report still records damage descriptions.

## Upload these files to GitHub (`main`)

- `src/index.js` (preserves existing API, adds company-owned vehicle assets and snapshot validation)
- `migrations/0003_vehicle_preview_assets.sql`
- `public/inspection.html`, `public/inspection.css`, `public/inspection.js`
- `public/app.js`, `public/index.html`
- `tests/vehicle-preview-v45.test.mjs`
- `package.json`

1. Back up your **panel-beater-db** D1 database (not Retail). Confirm that your repository includes migrations 0001 and 0002 and V44 changes.
2. Copy the files into these exact paths, preserving the folder names. Do not put them inside a nested V45 folder.
3. Commit to `main`. GitHub Actions will run the check and deploy workflow. The workflow applies migration 0003 automatically if existing migrations 0001 and 0002 were applied.
4. Confirm green deployment. Open your V45 Panel Beater URL and refresh (Ctrl+Shift+R). Open **3D Damage Inspection**, select a registered job and choose colour.
5. Owner: click **Manage vehicle images**, select a photo angle and source image, click **Add image to pack**, then **Save photo pack**. The upload is shared only with that workshop's accounts.
6. Select **Vehicle photographs** mode or **Best available**, then click **Show vehicle preview**.
7. Choose panel/severity/action/notes -> Add -> **Save assessment to repair job**. Click **Download PDF** for the branded inspection report. Existing estimate/job card PDF downloads will include the saved preview as an appendix.

### Exact 3D assets (.glb)
A correct, licensed matching GLB can be installed at:
`public/vehicle-models/toyota/rav4/2019.glb`
For a session-only preview, select the matching GLB under the 3D viewer's upload field. Session-only model files are not persisted. Recheck body style/trim before marking body panels.

No actual Toyota RAV4 `.glb` is included, and the system does **not** generate 3D files from a make/model/year label. For photograph mode, upload your own or properly licensed vehicle photographs. Do not misrepresent a different trim or generation as an exact match. The selected colour doesn't magically recolour photographs.

### Rights and security
Only an owner can manage shared photos; all photo and saved assessment records are company scoped. Upload model/library images only if you have appropriate rights. For real client data, independently validate database backups, customer consent for job photographs, privacy controls, and financial document compliance.

### Local validation performed
Node JavaScript syntax checks (backend, app, inspector), 15 automated tests, and SQLite migrations 0001–0003 passed. Browser automation could not be run due to restricted browser navigation in the execution environment; live Cloudflare and mobile checks remain required.
