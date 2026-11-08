SULMOS26 PANEL BEATER V40 — GITHUB TEST FIX

Fixes failing architecture test #4 after installing V40 PDF redesign.

The updated PDF renderer uses company?.logo_data (optional chaining), whereas
an older architecture test only matched company.logo_data.

Replace ONLY tests/architecture.test.mjs in GitHub:
https://github.com/mos00000006/sulmos26-panel-beaterss/edit/main/tests/architecture.test.mjs

Do NOT replace public/app.js or backend for this fix. Keep your V40 app.js.
Commit to main, confirm Panel Beater Check passes, then run deployment.

Local verification: 8 / 8 tests pass using the V40 public/app.js and V37 backend.
