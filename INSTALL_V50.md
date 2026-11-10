# SULMOS26 V50 — 3D Inspection Welcome ONLY

## This corrects the scope of the previous V49 popup

The personalised technical-support popup now appears **only when a signed-in user opens 3D Damage Inspection**. It no longer interrupts the main Panel Beater Hub or any other screen. The message uses the signed-in person's first name and shows once per browser-tab session. It can be closed with X, Continue or Escape.

**Do not install the earlier `SULMOS26_RESTORE_GREEN_HUB_REMOVE_ROOT_POS.zip`.** That unrelated patch changes the Retail Hub's GitHub landing page and is NOT needed for this change.

## Install in GitHub repository `mos00000006/sulmos26-panel-beaterss`

Replace these five files **inside the existing `public` folder**:

- `public/app.js` (removes V49's global popup only)
- `public/index.html` (cache refresh for the regular app)
- `public/inspection.js` (adds the popup exclusively to 3D inspection)
- `public/inspection.html` (cache refresh for the inspection screen)
- `public/inspection.css` (styles the inspection-only popup)

Do not upload files to `sulmos26-retail-hub` and do not replace `src/index.js`, migrations, `public/vehicle-outline.js`, existing branded icons, or any POS desk.

Commit to main. Confirm Panel Beater Check is green. Run the existing Panel Beater deployment workflow. In the installed Panel Beater app, sign in: you should see your normal Overview, Customers, Estimates, Invoices and Workshop screens without a popup. Open 3D Damage Inspection: you should see 'Hi, [first name]!' once.

No database changes. No secrets or roles changed. All previous inspection functionality is retained from the V48 inspection patch.

Note: if you have made newer edits to any of these same files since V49/V48, compare before replacing to avoid overwriting them.
