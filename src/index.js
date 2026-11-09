/* SULMOS26 Automotive — isolated multi-company Cloudflare D1 API. */
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const reply=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...HEADERS,...extra}});
const error=(message,status=400)=>reply({error:message},status);
const now=()=>new Date().toISOString();
const id=()=>crypto.randomUUID();
const str=(v,n=200)=>typeof v==='string'?v.trim().slice(0,n):'';
const arr=v=>Array.isArray(v)?v:[];
const int=(v,max=1e9)=>Number.isSafeInteger(Number(v))&&Number(v)>=0&&Number(v)<=max?Number(v):null;
const role=(u,...roles)=>!!u&&roles.includes(u.role);
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
async function digest(t){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))}
async function hashPass(pass,salt){let data=new TextEncoder().encode(pass);const stages=[];for(let i=0;i<2;i++){const key=await crypto.subtle.importKey('raw',data,'PBKDF2',false,['deriveBits']);data=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode('sulmos26-auto-v1:'+salt+':'+i),iterations:90000},key,256));stages.push(data)}return hex(data)}
function validOrigin(req){const o=req.headers.get('origin');if(o&&o!==new URL(req.url).origin)return false;const s=req.headers.get('sec-fetch-site');return !s||s==='same-origin'||s==='none'}
function cookie(token){return `sulmos_auto_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`}
const expired='sulmos_auto_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
async function session(req,db){const token=req.headers.get('cookie')?.match(/(?:^|;\s*)sulmos_auto_session=([a-f0-9]{64})/)?.[1];if(!token)return null;return db.prepare('SELECT u.id,u.company_id,u.name,u.username,u.role,u.active FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').bind(await digest(token),now()).first()}
async function log(db,u,action,entity,entityId,details=''){await db.prepare('INSERT INTO audit(id,company_id,actor_id,action,entity,entity_id,details,at) VALUES(?,?,?,?,?,?,?,?)').bind(id(),u.company_id,u.id,action,entity,entityId,details,now()).run()}
async function nextRef(db,cid,kind,prefix){const row=await db.prepare('INSERT INTO sequences(company_id,kind,n) VALUES(?,?,1) ON CONFLICT(company_id,kind) DO UPDATE SET n=n+1 RETURNING n').bind(cid,kind).first();return `${prefix}-${String(row.n).padStart(6,'0')}`}
const csvSafe=s=>String(s||'').slice(0,200);
const cents=v=>{const n=Number(v);return Number.isSafeInteger(n)&&n>=0&&n<=100000000000?n:null};
const qtyMilli=v=>{const n=Number(v);return Number.isFinite(n)&&n>0&&n<=100000&&Math.abs(Math.round(n*1000)-n*1000)<0.00001?Math.round(n*1000):null};
async function companyScoped(db,table,cid,entityId){return db.prepare(`SELECT * FROM ${table} WHERE company_id=? AND id=?`).bind(cid,entityId).first()}
function can(u,action){const roles={write:['owner','manager','reception','estimator'],estimate:['owner','manager','estimator'],approve:['owner','manager'],workshop:['owner','manager','workshop','technician'],invoice:['owner','manager','accounts'],payments:['owner','manager','accounts'],staff:['owner'],settings:['owner']};return role(u,...(roles[action]||[]))}
const stages=['received','assessment','awaiting_approval','approved','parts_ordered','stripping','panel_beating','preparation','painting','assembly','quality_check','ready','collected'];
async function route(req,env){
 const url=new URL(req.url),p=url.pathname,db=env.DB;
 if(!p.startsWith('/api/'))return env.ASSETS.fetch(req);
 if(!db)return error('Panel Beater D1 database is not connected. Configure the independent database binding.',503);
 if(req.method!=='GET'&&(!validOrigin(req)||!req.headers.get('content-type')?.includes('application/json')))return error('Invalid request origin or content type',403);
 const body=req.method==='GET'?{}:await req.json().catch(()=>null);
 if(req.method!=='GET'&&!body)return error('Expected valid JSON');
 if(p==='/api/bootstrap'&&req.method==='GET'){
  const count=await db.prepare('SELECT COUNT(*) n FROM companies').first();const user=await session(req,db);return reply({setup_required:!Number(count?.n),user:user?{id:user.id,name:user.name,role:user.role,company_id:user.company_id}:null});
 }
 if(p==='/api/setup'&&req.method==='POST'){
  const count=await db.prepare('SELECT COUNT(*) n FROM companies').first();if(Number(count?.n))return error('Setup has already been completed',403);
  const key=str(req.headers.get('x-setup-key'),256);if(!env.SETUP_KEY||env.SETUP_KEY.length<32||key!==env.SETUP_KEY)return error('Owner installation key is invalid',403);
  const name=str(body.company_name,150),person=str(body.owner_name,150),username=str(body.username,80).toLowerCase(),password=str(body.password,150);
  if(!name||!person||!username.match(/^[a-z0-9._-]{3,80}$/)||password.length<12)return error('Enter company, owner, username and password (12+ characters)');
  const cid=id(),uid=id(),salt=id(),ph=await hashPass(password,salt),ts=now();
  await db.batch([
   db.prepare('INSERT INTO companies(id,legal_name,trading_name,created_at) VALUES(?,?,?,?)').bind(cid,name,name,ts),
   db.prepare('INSERT INTO users(id,company_id,name,username,password_salt,password_hash,role,active,created_at) VALUES(?,?,?,?,?,?,?,1,?)').bind(uid,cid,person,username,salt,ph,'owner',ts)
  ]);
  return reply({ok:true},201);
 }
 if(p==='/api/login'&&req.method==='POST'){
  const username=str(body.username,80).toLowerCase(),password=str(body.password,150);if(!username||!password)return error('Enter username and password');
  const identifier=await digest('login:'+username);let attempts=await db.prepare('SELECT * FROM login_attempts WHERE identifier=?').bind(identifier).first();if(attempts?.blocked_until&&attempts.blocked_until>now())return error('Too many attempts. Try later.',429);
  const u=await db.prepare('SELECT * FROM users WHERE username=? AND active=1').bind(username).first();const h=await hashPass(password,u?.password_salt||'unknown_user');
  if(!u||h!==u.password_hash){const n=(attempts?.attempts||0)+1;await db.prepare('INSERT INTO login_attempts(identifier,attempts,blocked_until,updated_at) VALUES(?,?,?,?) ON CONFLICT(identifier) DO UPDATE SET attempts=excluded.attempts,blocked_until=excluded.blocked_until,updated_at=excluded.updated_at').bind(identifier,n,n>=6?new Date(Date.now()+900000).toISOString():'',now()).run();return error('Invalid username or password',401)}
  await db.prepare('DELETE FROM login_attempts WHERE identifier=?').bind(identifier).run();const token=hex(crypto.getRandomValues(new Uint8Array(32)));await db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await digest(token),u.id,new Date(Date.now()+43200000).toISOString(),now()).run();return reply({ok:true,user:{name:u.name,role:u.role}},200,{'set-cookie':cookie(token)});
 }
 if(p==='/api/logout'&&req.method==='POST'){const token=req.headers.get('cookie')?.match(/sulmos_auto_session=([a-f0-9]{64})/)?.[1];if(token)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();return reply({ok:true},200,{'set-cookie':expired})}
 const u=await session(req,db);if(!u)return error('Sign in required',401);
 const cid=u.company_id;
 if(p==='/api/visual-assessment'&&(req.method==='GET'||req.method==='PUT')){
  const jobId=str(req.method==='GET'?url.searchParams.get('job_id'):body.job_id,60);
  const job=await companyScoped(db,'jobs',cid,jobId);
  if(!job)return error('Repair job not found',404);
  if(u.role==='technician'&&job.technician_id!==u.id)return error('This job is not assigned to you',403);
  if(req.method==='GET'){
   const record=await db.prepare('SELECT id,job_id,vehicle_colour,vehicle_model_key,damage_json,revision,updated_at FROM visual_assessments WHERE company_id=? AND job_id=?').bind(cid,jobId).first();
   const veh=await companyScoped(db,'vehicles',cid,job.vehicle_id);
   return reply({assessment:record||null,vehicle:veh?{make:veh.make,model:veh.model,year:veh.year,colour:veh.colour,registration:veh.registration}:null,job:{id:job.id,reference:job.reference}});
  }
  if(!role(u,'owner','manager','estimator','reception','workshop'))return error('Assessment editing permission required',403);
  const veh=await companyScoped(db,'vehicles',cid,job.vehicle_id);
  const colour=str(body.vehicle_colour,40);if(!colour||!/^[\w #()/-]{1,40}$/.test(colour))return error('Enter a valid vehicle colour');
  const allowedPanels=['front_bumper','rear_bumper','bonnet','roof','boot','left_front_fender','right_front_fender','left_front_door','right_front_door','left_rear_door','right_rear_door','left_rear_quarter','right_rear_quarter','left_headlamp','right_headlamp','left_tail_lamp','right_tail_lamp','windscreen','rear_glass'];
  const severities=['minor','moderate','severe','replace'];const actions=['repair','replace','respray','inspect'];
  const damage=arr(body.damage);if(damage.length>allowedPanels.length)return error('Too many damage panels');
  const seen=new Set(),validated=[];
  for(const d of damage){const panel=str(d.panel,50),severity=str(d.severity,20),action=str(d.action,20),note=str(d.note,500);if(!allowedPanels.includes(panel)||!severities.includes(severity)||!actions.includes(action)||seen.has(panel))return error('Invalid damage panel or action');seen.add(panel);validated.push({panel,severity,action,note})}
  const revision=int(body.revision,1000000);if(revision===null)return error('Invalid assessment revision');
  const modelKey=[str(veh?.make,60),str(veh?.model,80),String(veh?.year||'')].map(x=>x.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')).join('/');
  const existing=await db.prepare('SELECT revision FROM visual_assessments WHERE company_id=? AND job_id=?').bind(cid,jobId).first();
  const ts=now(),payload=JSON.stringify(validated);
  if(!existing){if(revision!==0)return error('Assessment has changed; reload before saving',409);
   await db.prepare('INSERT OR IGNORE INTO visual_assessments(id,company_id,job_id,vehicle_colour,vehicle_model_key,damage_json,revision,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,1,?,?,?,?)').bind(id(),cid,jobId,colour,modelKey,payload,u.id,u.id,ts,ts).run();
  }else{const result=await db.prepare('UPDATE visual_assessments SET vehicle_colour=?,vehicle_model_key=?,damage_json=?,revision=revision+1,updated_by=?,updated_at=? WHERE company_id=? AND job_id=? AND revision=?').bind(colour,modelKey,payload,u.id,ts,cid,jobId,revision).run();if(result.meta?.changes!==1)return error('Assessment was edited by another user. Reload before saving.',409)}
  await log(db,u,'visual_assessment.save','job',jobId,JSON.stringify({panels:validated.length}));return reply({ok:true});
 }
 if(p==='/api/me'&&req.method==='GET'){const c=await db.prepare('SELECT * FROM companies WHERE id=?').bind(cid).first();return reply({user:{id:u.id,name:u.name,role:u.role,username:u.username},company:c})}
 if(p==='/api/company'&&req.method==='PUT'){
  if(!can(u,'settings'))return error('Owner permission required',403);
  const fields=['legal_name','trading_name','registration_no','vat_no','address','phone','email','bank_details','terms','accent'];const obj={};for(const k of fields)obj[k]=str(body[k],k==='terms'||k==='bank_details'?1000:200);
  if(!obj.legal_name||!obj.trading_name)return error('Company name required');
  const mode=body.vat_mode==='vat_vendor'&&obj.vat_no?'vat_vendor':'non_vat';
  const logo=str(body.logo_data,280000);if(logo&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logo))return error('Invalid company logo');
  await db.prepare(`UPDATE companies SET legal_name=?,trading_name=?,registration_no=?,vat_no=?,vat_mode=?,address=?,phone=?,email=?,bank_details=?,terms=?,accent=?,logo_data=? WHERE id=?`)
   .bind(obj.legal_name,obj.trading_name,obj.registration_no,obj.vat_no,mode,obj.address,obj.phone,obj.email,obj.bank_details,obj.terms,obj.accent||'#e9aa16',logo,cid).run();await log(db,u,'company.update','company',cid);return reply({ok:true});
 }
 if(p==='/api/companies/provision'&&req.method==='POST'){
  if(!role(u,'owner')||!env.SETUP_KEY||env.SETUP_KEY.length<32||req.headers.get('x-setup-key')!==env.SETUP_KEY)return error('Platform installation key and owner permission required',403);
  const name=str(body.company_name,150),owner=str(body.owner_name,120),username=str(body.username,80).toLowerCase(),pass=str(body.password,150);
  if(!name||!owner||!username.match(/^[a-z0-9._-]{3,80}$/)||pass.length<12)return error('Provide new company, owner, unique username and strong password');
  const newCid=id(),uid=id(),salt=id(),ts=now();await db.batch([
   db.prepare('INSERT INTO companies(id,legal_name,trading_name,created_at) VALUES(?,?,?,?)').bind(newCid,name,name,ts),
   db.prepare('INSERT INTO users(id,company_id,name,username,password_salt,password_hash,role,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(uid,newCid,owner,username,salt,await hashPass(pass,salt),'owner',ts)
  ]);await log(db,u,'company.provision','company',newCid);return reply({ok:true,company_id:newCid},201);
 }
 if(p==='/api/users'&&req.method==='GET'){if(!can(u,'staff')&&!role(u,'manager'))return error('Permission denied',403);const r=await db.prepare('SELECT id,name,username,role,active,created_at FROM users WHERE company_id=? ORDER BY created_at DESC').bind(cid).all();return reply({items:r.results||[]})}
 if(p==='/api/users'&&req.method==='POST'){
  if(!can(u,'staff'))return error('Owner permission required',403);const name=str(body.name,120),username=str(body.username,80).toLowerCase(),password=str(body.password,150),r=str(body.role,30);if(!name||!/^[a-z0-9._-]{3,80}$/.test(username)||password.length<12||!['manager','reception','estimator','workshop','technician','accounts'].includes(r))return error('Invalid staff fields or password');const salt=id(),uid=id();await db.prepare('INSERT INTO users(id,company_id,name,username,password_salt,password_hash,role,active,created_at) VALUES(?,?,?,?,?,?,?,1,?)').bind(uid,cid,name,username,salt,await hashPass(password,salt),r,now()).run();await log(db,u,'staff.add','user',uid,r);return reply({id:uid},201);
 }
 if(p==='/api/customers'&&req.method==='GET'){if(!role(u,'owner','manager','reception','estimator','workshop'))return error('Permission denied',403);const r=await db.prepare('SELECT * FROM customers WHERE company_id=? ORDER BY created_at DESC LIMIT 500').bind(cid).all();return reply({items:r.results||[]})}
 if(p==='/api/customers'&&req.method==='POST'){
  if(!can(u,'write'))return error('Permission denied',403);const name=str(body.name,150),phone=str(body.phone,50),email=str(body.email,150),address=str(body.address,300),type=body.customer_type==='company'?'company':'individual';if(!name)return error('Customer name required');const key=id();await db.prepare('INSERT INTO customers(id,company_id,name,phone,email,address,customer_type,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(key,cid,name,phone,email,address,type,now()).run();await log(db,u,'customer.add','customer',key);return reply({id:key},201);
 }
 if(p==='/api/vehicles'&&req.method==='GET'){if(!role(u,'owner','manager','reception','estimator','workshop'))return error('Permission denied',403);const r=await db.prepare('SELECT v.*,c.name customer_name FROM vehicles v JOIN customers c ON c.id=v.customer_id WHERE v.company_id=? ORDER BY v.created_at DESC LIMIT 500').bind(cid).all();return reply({items:r.results||[]})}
 if(p==='/api/vehicles'&&req.method==='POST'){
  if(!can(u,'write'))return error('Permission denied',403);const cust=await companyScoped(db,'customers',cid,str(body.customer_id,40));if(!cust)return error('Select customer from your business');const reg=str(body.registration,40).toUpperCase(),vin=str(body.vin,40),make=str(body.make,80),model=str(body.model,80),year=int(body.year,2100),mileage=int(body.mileage,999999999);if(!reg||!make)return error('Registration and make required');const key=id();await db.prepare('INSERT INTO vehicles(id,company_id,customer_id,registration,vin,make,model,year,colour,mileage,engine_no,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(key,cid,cust.id,reg,vin,make,model,year||null,str(body.colour,50),mileage||0,str(body.engine_no,60),now()).run();await log(db,u,'vehicle.add','vehicle',key);return reply({id:key},201);
 }
 if(p==='/api/jobs'&&req.method==='GET'){const r=u.role==='technician'?await db.prepare('SELECT j.*,v.registration,v.make,v.model,c.name customer_name,c.phone customer_phone FROM jobs j JOIN vehicles v ON v.id=j.vehicle_id JOIN customers c ON c.id=j.customer_id WHERE j.company_id=? AND j.technician_id=? ORDER BY j.received_at DESC LIMIT 500').bind(cid,u.id).all():await db.prepare('SELECT j.*,v.registration,v.make,v.model,c.name customer_name,c.phone customer_phone FROM jobs j JOIN vehicles v ON v.id=j.vehicle_id JOIN customers c ON c.id=j.customer_id WHERE j.company_id=? ORDER BY j.received_at DESC LIMIT 500').bind(cid).all();return reply({items:r.results||[]})}
 if(p==='/api/jobs'&&req.method==='POST'){
  if(!can(u,'write'))return error('Permission denied',403);const v=await companyScoped(db,'vehicles',cid,str(body.vehicle_id,40));if(!v)return error('Vehicle not found');const jid=id(),ref=await nextRef(db,cid,'job','JOB'),ts=now(),damage=str(body.damage,2500);await db.batch([
   db.prepare('INSERT INTO jobs(id,company_id,customer_id,vehicle_id,reference,damage,intake_notes,accessories,fuel_level,insurer,claim_no,excess_cents,received_at,expected_at,stage,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(jid,cid,v.customer_id,v.id,ref,damage,str(body.intake_notes,1500),str(body.accessories,500),str(body.fuel_level,40),str(body.insurer,150),str(body.claim_no,100),cents(body.excess_cents)||0,ts,str(body.expected_at,40),'received',u.id),
   db.prepare('INSERT INTO job_events(id,company_id,job_id,stage,note,actor_id,at) VALUES(?,?,?,?,?,?,?)').bind(id(),cid,jid,'received','Vehicle intake captured',u.id,ts)
  ]);await log(db,u,'job.create','job',jid,ref);return reply({id:jid,reference:ref},201);
 }
 const jobStage=p.match(/^\/api\/jobs\/([a-f0-9-]+)\/stage$/);
 if(jobStage&&req.method==='POST'){
  if(!can(u,'workshop')&&!role(u,'reception'))return error('Workshop permission required',403);const j=await companyScoped(db,'jobs',cid,jobStage[1]);if(!j)return error('Job not found',404);if(u.role==='technician'&&j.technician_id!==u.id)return error('Job not assigned to this technician',403);const next=str(body.stage,60);if(!stages.includes(next))return error('Invalid stage');if(next==='collected'&&!role(u,'owner','manager','reception'))return error('Handover requires owner, manager or reception',403);
  if(next==='collected'&&j.stage!=='ready')return error('Quality check and Ready status required before handover',409);
  if(!role(u,'owner','manager')&&stages.indexOf(next)<stages.indexOf(j.stage))return error('Only management can move jobs backwards',403);
  if(next==='ready'&&!str(j.qc_checks,500))return error('Record quality-control checks before marking ready',409);
  const ts=now(),collector=str(body.handed_to,120);if(next==='collected'&&!collector)return error('Enter person collecting vehicle');
  const result=await db.prepare('UPDATE jobs SET stage=?,qc_notes=COALESCE(NULLIF(?,\'\'),qc_notes),handed_to=CASE WHEN ?=\'collected\' THEN ? ELSE handed_to END,handed_at=CASE WHEN ?=\'collected\' THEN ? ELSE handed_at END WHERE id=? AND company_id=? AND stage=?').bind(next,str(body.note,500),next,collector,next,ts,j.id,cid,j.stage).run();if(result.meta.changes!==1)return error('Job updated by another user. Refresh',409);
  await db.prepare('INSERT INTO job_events(id,company_id,job_id,stage,note,actor_id,at) VALUES(?,?,?,?,?,?,?)').bind(id(),cid,j.id,next,str(body.note,500),u.id,ts).run();await log(db,u,'job.stage','job',j.id,next);return reply({ok:true});
 }
 const assign=p.match(/^\/api\/jobs\/([a-f0-9-]+)\/assign$/);
 if(assign&&req.method==='POST'){
  if(!role(u,'owner','manager','workshop'))return error('Workshop supervisor permission required',403);
  const j=await companyScoped(db,'jobs',cid,assign[1]);if(!j)return error('Job not found',404);
  const tech=await companyScoped(db,'users',cid,str(body.technician_id,40));
  if(!tech||!tech.active||!['technician','workshop','manager'].includes(tech.role))return error('Select an active technician in this business');
  await db.prepare('UPDATE jobs SET technician_id=? WHERE id=? AND company_id=?').bind(tech.id,j.id,cid).run();await log(db,u,'job.assign','job',j.id,tech.name);return reply({ok:true});
 }
 const qc=p.match(/^\/api\/jobs\/([a-f0-9-]+)\/qc$/);
 if(qc&&req.method==='POST'){if(!can(u,'workshop'))return error('Workshop permission required',403);const j=await companyScoped(db,'jobs',cid,qc[1]);if(!j)return error('Job not found',404);if(u.role==='technician'&&j.technician_id!==u.id)return error('Job not assigned to this technician',403);const checks=arr(body.checks).filter(x=>typeof x==='string').slice(0,30);if(!checks.length)return error('Select QC checks');await db.prepare('UPDATE jobs SET qc_checks=?,qc_notes=? WHERE company_id=? AND id=?').bind(JSON.stringify(checks),str(body.note,1000),cid,j.id).run();await log(db,u,'job.qc','job',j.id);return reply({ok:true})}
 if(p==='/api/job-events'&&req.method==='GET'){const job=await companyScoped(db,'jobs',cid,str(url.searchParams.get('job_id'),60));if(!job)return error('Job not found',404);if(u.role==='technician'&&job.technician_id!==u.id)return error('Job not assigned',403);const r=await db.prepare('SELECT e.*,u.name actor_name FROM job_events e JOIN users u ON u.id=e.actor_id WHERE e.company_id=? AND e.job_id=? ORDER BY e.at DESC').bind(cid,job.id).all();return reply({items:r.results||[]})}
 if(p==='/api/photos'&&req.method==='GET'){const job=await companyScoped(db,'jobs',cid,str(url.searchParams.get('job_id'),60));if(!job)return error('Job not found',404);if(u.role==='technician'&&job.technician_id!==u.id)return error('Job not assigned',403);const r=await db.prepare('SELECT id,name,data,created_at FROM photos WHERE company_id=? AND job_id=? ORDER BY created_at DESC LIMIT 12').bind(cid,job.id).all();return reply({items:r.results||[]})}
 if(p==='/api/photos'&&req.method==='POST'){
  if(!can(u,'write')&&!can(u,'workshop'))return error('Permission denied',403);const job=await companyScoped(db,'jobs',cid,str(body.job_id,60));if(!job)return error('Job not found',404);if(u.role==='technician'&&job.technician_id!==u.id)return error('Job not assigned',403);const data=str(body.data,205000);if(data.length>200000||!/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(data))return error('Upload a compressed JPEG under 150 KB');const count=await db.prepare('SELECT COUNT(*) n FROM photos WHERE company_id=? AND job_id=?').bind(cid,job.id).first();if(count.n>=12)return error('Maximum 12 photos per job');const key=id();await db.prepare('INSERT INTO photos(id,company_id,job_id,name,data,uploaded_by,created_at) VALUES(?,?,?,?,?,?,?)').bind(key,cid,job.id,str(body.name,80)||'Damage photo',data,u.id,now()).run();return reply({id:key},201)
 }
 if(p==='/api/estimates'&&req.method==='GET'){if(!role(u,'owner','manager','estimator','reception','accounts'))return error('Permission denied',403);const r=await db.prepare('SELECT e.*,j.reference job_reference,v.registration,c.name customer_name FROM estimates e JOIN jobs j ON j.id=e.job_id JOIN vehicles v ON v.id=j.vehicle_id JOIN customers c ON c.id=j.customer_id WHERE e.company_id=? ORDER BY e.created_at DESC LIMIT 500').bind(cid).all();return reply({items:r.results||[]})}
 if(p==='/api/estimates'&&req.method==='POST'){
  if(!can(u,'estimate'))return error('Estimator permission required',403);const j=await companyScoped(db,'jobs',cid,str(body.job_id,60));if(!j)return error('Job not found',404);
  const ls=arr(body.lines).slice(0,100);if(!ls.length)return error('Add at least one estimate line');let subtotal=0;const items=[];
  for(const l of ls){const cat=str(l.category,50),desc=str(l.description,250),qty=qtyMilli(l.qty),unit=cents(l.unit_cents);if(!desc||!qty||unit===null||!['parts','panel_labour','paint_labour','materials','subcontract','other'].includes(cat))return error('Invalid estimate line');const line=Math.round(qty*unit/1000);subtotal+=line;items.push({category:cat,description:desc,qty_milli:qty,unit_cents:unit,line_cents:line})}
  if(subtotal>1e11)return error('Estimate total too high');const c=await db.prepare('SELECT vat_mode FROM companies WHERE id=?').bind(cid).first();const vatRate=c.vat_mode==='vat_vendor'?15:0,vat=Math.round(subtotal*vatRate/100);const eid=id(),ref=await nextRef(db,cid,'estimate','EST'),ts=now();
  const statements=[db.prepare('INSERT INTO estimates(id,company_id,job_id,reference,assessment,vat_rate,subtotal_cents,vat_cents,total_cents,status,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(eid,cid,j.id,ref,str(body.assessment,1500),vatRate,subtotal,vat,subtotal+vat,'submitted',u.id,ts),...items.map(x=>db.prepare('INSERT INTO estimate_lines(id,estimate_id,category,description,qty_milli,unit_cents,line_cents) VALUES(?,?,?,?,?,?,?)').bind(id(),eid,x.category,x.description,x.qty_milli,x.unit_cents,x.line_cents))];await db.batch(statements);await log(db,u,'estimate.create','estimate',eid,ref);return reply({id:eid,reference:ref,total_cents:subtotal+vat},201);
 }
 const estimateAction=p.match(/^\/api\/estimates\/([a-f0-9-]+)\/(approve|decline)$/);
 if(estimateAction&&req.method==='POST'){if(!can(u,'approve'))return error('Manager approval required',403);const e=await companyScoped(db,'estimates',cid,estimateAction[1]);if(!e)return error('Estimate not found',404);if(e.status!=='submitted')return error('Estimate already decided',409);const next=estimateAction[2]==='approve'?'approved':'declined';const r=await db.prepare('UPDATE estimates SET status=?,approved_by=?,approved_at=? WHERE id=? AND company_id=? AND status=\'submitted\'').bind(next,u.id,now(),e.id,cid).run();if(r.meta.changes!==1)return error('Already decided',409);await log(db,u,'estimate.'+next,'estimate',e.id,str(body.note,250));return reply({ok:true})}
 if(p==='/api/estimate-lines'&&req.method==='GET'){if(!role(u,'owner','manager','estimator','reception','accounts'))return error('Permission denied',403);const e=await companyScoped(db,'estimates',cid,str(url.searchParams.get('estimate_id'),60));if(!e)return error('Estimate not found',404);const r=await db.prepare('SELECT category,description,qty_milli,unit_cents,line_cents FROM estimate_lines WHERE estimate_id=?').bind(e.id).all();return reply({items:r.results||[]})}
 if(p==='/api/invoices'&&req.method==='GET'){if(!role(u,'owner','manager','accounts'))return error('Permission denied',403);const r=await db.prepare('SELECT i.*,e.reference estimate_reference,j.reference job_reference,c.name customer_name,v.registration FROM invoices i JOIN estimates e ON e.id=i.estimate_id JOIN jobs j ON j.id=i.job_id JOIN customers c ON c.id=j.customer_id JOIN vehicles v ON v.id=j.vehicle_id WHERE i.company_id=? ORDER BY i.issued_at DESC LIMIT 500').bind(cid).all();return reply({items:r.results||[]})}
 if(p==='/api/invoices'&&req.method==='POST'){
  if(!can(u,'invoice'))return error('Accounts permission required',403);const e=await companyScoped(db,'estimates',cid,str(body.estimate_id,60));if(!e||e.status!=='approved')return error('Approved estimate required');const exists=await db.prepare('SELECT id FROM invoices WHERE estimate_id=?').bind(e.id).first();if(exists)return error('An invoice already exists for this estimate',409);
  const ref=await nextRef(db,cid,'invoice','INV'),iid=id(),ts=now();const lines=await db.prepare('SELECT * FROM estimate_lines WHERE estimate_id=?').bind(e.id).all();const statements=[db.prepare('INSERT INTO invoices(id,company_id,estimate_id,job_id,reference,subtotal_cents,vat_cents,total_cents,issued_at,issued_by) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(iid,cid,e.id,e.job_id,ref,e.subtotal_cents,e.vat_cents,e.total_cents,ts,u.id),...arr(lines.results).map(l=>db.prepare('INSERT INTO invoice_lines(id,invoice_id,category,description,qty_milli,unit_cents,line_cents) VALUES(?,?,?,?,?,?,?)').bind(id(),iid,l.category,l.description,l.qty_milli,l.unit_cents,l.line_cents))];try{await db.batch(statements)}catch(ex){if(String(ex).includes('UNIQUE'))return error('Invoice already exists',409);throw ex}await log(db,u,'invoice.issue','invoice',iid,ref);return reply({id:iid,reference:ref},201)
 }
 if(p==='/api/invoice-detail'&&req.method==='GET'){if(!role(u,'owner','manager','accounts'))return error('Permission denied',403);
  const inv=await companyScoped(db,'invoices',cid,str(url.searchParams.get('id'),60));if(!inv)return error('Invoice not found',404);
  const row=await db.prepare(`SELECT i.*,e.reference estimate_reference,e.vat_rate,e.assessment,j.reference job_reference,j.damage,j.insurer,j.claim_no,v.registration,v.make,v.model,v.vin,v.year,v.colour,c.name customer_name,c.address customer_address,c.phone customer_phone,c.email customer_email FROM invoices i JOIN estimates e ON e.id=i.estimate_id JOIN jobs j ON j.id=i.job_id JOIN vehicles v ON v.id=j.vehicle_id JOIN customers c ON c.id=j.customer_id WHERE i.id=? AND i.company_id=?`).bind(inv.id,cid).first();const l=await db.prepare('SELECT category,description,qty_milli,unit_cents,line_cents FROM invoice_lines WHERE invoice_id=?').bind(inv.id).all();const comp=await db.prepare('SELECT * FROM companies WHERE id=?').bind(cid).first();return reply({invoice:row,lines:l.results||[],company:comp});
 }
 if(p==='/api/estimate-detail'&&req.method==='GET'){if(!role(u,'owner','manager','estimator','reception','accounts'))return error('Permission denied',403);
  const e=await companyScoped(db,'estimates',cid,str(url.searchParams.get('id'),60));if(!e)return error('Estimate not found',404);const row=await db.prepare(`SELECT e.*,j.reference job_reference,j.damage,j.insurer,j.claim_no,v.registration,v.make,v.model,v.vin,v.year,c.name customer_name,c.address customer_address,c.phone customer_phone,c.email customer_email FROM estimates e JOIN jobs j ON j.id=e.job_id JOIN vehicles v ON v.id=j.vehicle_id JOIN customers c ON c.id=j.customer_id WHERE e.id=? AND e.company_id=?`).bind(e.id,cid).first();const l=await db.prepare('SELECT category,description,qty_milli,unit_cents,line_cents FROM estimate_lines WHERE estimate_id=?').bind(e.id).all();const comp=await db.prepare('SELECT * FROM companies WHERE id=?').bind(cid).first();return reply({estimate:row,lines:l.results||[],company:comp})
 }
 if(p==='/api/payments'&&req.method==='POST'){
  if(!can(u,'payments'))return error('Accounts permission required',403);const inv=await companyScoped(db,'invoices',cid,str(body.invoice_id,60)),amount=cents(body.amount_cents),method=str(body.method,20),reference=str(body.reference,100);if(!inv)return error('Invoice not found',404);if(!amount||!['cash','card','eft'].includes(method)||!reference)return error('Valid payment, method and independent proof/reference required');
  // Atomic conditional insert + total recompute; no separate unchecked insert permitted.
  const pid=id();const result=await db.batch([
   db.prepare('INSERT INTO payments(id,company_id,invoice_id,method,amount_cents,reference,actor_id,received_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM invoices WHERE id=? AND company_id=? AND total_cents-paid_cents>=?)').bind(pid,cid,inv.id,method,amount,reference,u.id,now(),inv.id,cid,amount),
   db.prepare("UPDATE invoices SET paid_cents=COALESCE((SELECT SUM(amount_cents) FROM payments WHERE invoice_id=?),0),status=CASE WHEN COALESCE((SELECT SUM(amount_cents) FROM payments WHERE invoice_id=?),0)>=total_cents THEN 'paid' WHEN COALESCE((SELECT SUM(amount_cents) FROM payments WHERE invoice_id=?),0)>0 THEN 'partial' ELSE 'unpaid' END WHERE id=? AND company_id=?").bind(inv.id,inv.id,inv.id,inv.id,cid)
  ]);if(result[0].meta?.changes!==1)return error('Payment exceeds outstanding balance or was already processed',409);await log(db,u,'payment.record','invoice',inv.id,reference);return reply({ok:true})
 }
 if(p==='/api/reports'&&req.method==='GET'){
  if(!role(u,'owner','manager','accounts'))return error('Reporting permission required',403);
  const [j,e,i,paid,workshop,technicians]=await db.batch([
   db.prepare('SELECT COUNT(*) n FROM jobs WHERE company_id=?').bind(cid),db.prepare('SELECT COUNT(*) n,COALESCE(SUM(total_cents),0) v FROM estimates WHERE company_id=?').bind(cid),db.prepare('SELECT COUNT(*) n,COALESCE(SUM(total_cents),0) v,COALESCE(SUM(total_cents-paid_cents),0) outstanding FROM invoices WHERE company_id=?').bind(cid),db.prepare('SELECT COALESCE(SUM(amount_cents),0) v FROM payments WHERE company_id=?').bind(cid),db.prepare('SELECT stage,COUNT(*) n FROM jobs WHERE company_id=? GROUP BY stage ORDER BY n DESC').bind(cid),db.prepare('SELECT u.name,COUNT(*) jobs FROM jobs j JOIN users u ON u.id=j.technician_id WHERE j.company_id=? GROUP BY u.name').bind(cid)
  ]);return reply({jobs:j.results?.[0],estimates:e.results?.[0],invoices:i.results?.[0],payments:paid.results?.[0],stages:workshop.results||[],technicians:technicians.results||[]})
 }
 if(p==='/api/audit'&&req.method==='GET'){if(!role(u,'owner','manager'))return error('Permission denied',403);const r=await db.prepare('SELECT a.*,u.name actor_name FROM audit a JOIN users u ON u.id=a.actor_id WHERE a.company_id=? ORDER BY a.at DESC LIMIT 150').bind(cid).all();return reply({items:r.results||[]})}
 return error('Not found',404);
}
export default {async fetch(request,env){try{return await route(request,env)}catch(e){console.error('SULMOS26_AUTOMOTIVE',e instanceof Error?e.name:'Unknown');return error('Request failed. Check the deployment, database and permissions.',500)}}};
