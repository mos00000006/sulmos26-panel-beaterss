# SULMOS26 Automotive V43 — 3D Damage Inspection

**Install only in** `mos00000006/sulmos26-panel-beaterss` (never the Retail repo).

1. Back up the independent `panel-beater-db` D1 database before migrations.
2. Upload ALL files in this patch to their matching paths. Keep other existing files intact.
3. Commit to `main`; check **Panel Beater Check**.
4. Run **Deploy SULMOS26 Panel Beater V38** on `main` (the workflow keeps its old name). It applies migration `0002_visual_damage.sql` and deploys.
5. Open the panel-beater site, sign in, click **3D Damage Inspection**. Choose an already registered repair job.
6. Confirm colour, click **Show vehicle preview**, rotate using mouse/touch, mark a panel, and **Save assessment**. Refresh to verify it persisted. Print the damage report using the Print button.

## Exact 3D models

A model-specific 3D asset is not included for every car. Without one, the inspector displays a clearly labelled **generic 3D preview**. It does *not* falsely depict a 2019 RAV4. To install a matching model, obtain a properly licensed GLB, verify its real vehicle generation/trim, and add it in the GitHub repo at `public/vehicle-models/toyota/rav4/2019.glb` (adjust the path to make/model/year). The viewer attempts to use a matching installed GLB automatically. Exact-model mesh panel names should match the named component codes for clickable panel selection; the dropdown remains functional for all assets. No third-party vehicle models are bundled.

The 3D viewer downloads Three.js from jsDelivr at runtime, so requires internet and WebGL. If unavailable the damage register still works. Assessment data is saved securely per company and job in D1 with a revision check. Vehicle paint colour is a preview setting; it does not overwrite the registered colour.

Print uses the browser print dialog (Save as PDF available). The damage register does not yet automatically create quotation lines; estimate amounts are not invented from paint/damage selections.
