SULMOS26 PANEL BEATER V39 - WRANGLER MIGRATIONS PATH FIX

Problem:
Wrangler searched .deploy/migrations because the deployment config was created in .deploy/ while the real migration files live at repository-root migrations/.
That configuration could also misresolve src/ and public/.

Replace these TWO files in your PANEL BEATER repository ONLY:
1) scripts/prepare-deploy.mjs
2) .github/workflows/deploy-panel-beater.yml

Commit both to main. Then open GitHub Actions > Deploy SULMOS26 Panel Beater V38 > Run workflow > main.

The script now generates wrangler.deploy.jsonc at the repository root. The workflow uses this root configuration for BOTH migration and deployment.
The generated file is created during GitHub Actions; do not upload it or hard-code a database ID.

Do not change your three GitHub secrets or your Panel Beater database. Do not upload this to SULMOS26 Retail.

Check that your repository contains migrations/0001_panel_beater_core.sql, public/, and src/.

Validation: JavaScript syntax and a simulated V38 deployment preparation test passed with the verified Panel Beater D1 UUID. Live Cloudflare migration/deployment remains unverified.
