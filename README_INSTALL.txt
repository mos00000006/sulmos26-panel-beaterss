SULMOS26 V41 — PDF AND COMPANY LOGO REPAIR

1. In the separate repository mos00000006/sulmos26-panel-beaterss, replace ONLY public/app.js and public/index.html with the files from this ZIP.
2. Commit both to main. Confirm Panel Beater Check is green.
3. Run the GitHub Actions Deploy SULMOS26 Panel Beater V38 workflow. A check-only or Pages build does not update the active Workers URL.
4. Open the Worker website in a NEW private/incognito Chrome window and sign in.
5. Open Company Branding, select your JPG/PNG logo, and click Save Company Branding. Wait for the saved-logo preview to appear.
6. Reload the page and check that the logo preview is STILL there. If not, the database logo was not saved; please report that.
7. Download a NEW estimate PDF. The new V41 template is loaded with app.js?v=41-logo-pdf.

No database migration, secrets or Retail file changes. If the live PDF still has old styling despite the two committed files, confirm the GitHub DEPLOY workflow succeeded and the browser fetched the new script.
