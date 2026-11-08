import fs from 'node:fs';
import path from 'node:path';
const uuid = (process.env.PANEL_BEATER_D1_DATABASE_ID || '').trim();
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
  throw new Error('PANEL_BEATER_D1_DATABASE_ID is missing or not a Cloudflare D1 UUID. Configure the GitHub Actions secret for the PANEL BEATER database, NOT the retail database.');
}
const required = ['src/index.js','public/index.html','public/app.js','public/styles.css','public/manifest.webmanifest','public/assets/icon-192.png','public/assets/icon-512.png','migrations/0001_panel_beater_core.sql'];
for (const f of required) if (!fs.existsSync(f)) throw new Error('Required V37 application file missing: '+f+' — upload the V37 public/, src/ and migrations/ files first.');
const root = fs.readFileSync('public/index.html', 'utf8');
if (!root.includes('manifest.webmanifest') || !root.includes('/app.js')) throw new Error('public/index.html is not the new Panel Beater PWA interface.');
const app = fs.readFileSync('public/app.js','utf8');
if (!app.includes('Company Branding') || !app.includes('downloadDoc')) throw new Error('The V37 app.js with company branding and PDF download features is missing.');
const source = fs.readFileSync('src/index.js','utf8');
if (!source.includes('/api/bootstrap') || !source.includes('/api/company')) throw new Error('Cloud backend src/index.js does not contain V37 API.');
const current = fs.readFileSync('wrangler.jsonc','utf8');
const base = JSON.parse(current);
if (base.name !== 'sulmos26-panel-beaterss') throw new Error('Wrong Worker name — refusing to deploy into a different system.');
const out = {...base, name: 'sulmos26-panel-beaterss', main:'src/index.js', assets:{directory:'./public',binding:'ASSETS',run_worker_first:['/api/*']}, d1_databases:[{binding:'DB',database_name:'panel-beater-db',database_id:uuid,migrations_dir:'migrations'}]};
// Keep the generated configuration beside src/, public/ and migrations/.
// Wrangler resolves relative paths from the config directory.
fs.writeFileSync('wrangler.deploy.jsonc',JSON.stringify(out,null,2)+'\n');
console.log('Checked V37 application files, install icons, Worker asset routing, independent D1 configuration. Prepared safe Panel Beater deployment.');
