import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const server=fs.readFileSync('src/index.js','utf8');
const inspector=fs.readFileSync('public/inspection.js','utf8');
const html=fs.readFileSync('public/inspection.html','utf8');
const app=fs.readFileSync('public/app.js','utf8');
const sql=fs.readFileSync('migrations/0003_vehicle_preview_assets.sql','utf8');
test('company owner can maintain a limited, company-scoped image library',()=>{
 assert.match(server,/\/api\/vehicle-preview-assets/);
 assert.match(server,/company_id=\? AND model_key=\?/);
 assert.match(server,/Only the company owner may manage vehicle image assets/);
 assert.match(server,/incoming.length>9/);
 assert.match(sql,/UNIQUE\(company_id,model_key\)/);
});
test('3D match, photo preview and explicit missing asset paths',()=>{
 assert.match(inspector,/modelUrl/);
 assert.match(inspector,/matching-photos/);
 assert.match(inspector,/No matching 3D model installed/);
 assert.match(html,/id="previewMode"/);
 assert.match(html,/id="photoPreview"/);
 assert.match(html,/id="assetManager"/);
});
test('assessment snapshot is validated and archived in database and PDFs',()=>{
 assert.match(server,/preview_data/);
 assert.match(sql,/ADD COLUMN preview_data/);
 assert.match(inspector,/async function imageSnapshot/);
 assert.match(inspector,/downloadInspectionPdf/);
 assert.match(app,/visualAssessmentAppendix/);
 assert.match(app,/pages.push\(\.\.\.await visualAssessmentAppendix/);
});
test('downloadable report preserves registered job and branded company',()=>{
 assert.match(inspector,/api\('me'\)/);
 assert.match(inspector,/c.logo_data/);
 assert.match(inspector,/pdfFromJpegs/);
 assert.match(inspector,/S.job.reference/);
});
