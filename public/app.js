/* SULMOS26 Automotive — V41 PDF + Logo verification — no external JS dependencies. */
console.info("SULMOS26 Automotive PDF Template V41 loaded");
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format((Number(v)||0)/100);
const day=v=>v?new Date(v).toLocaleDateString('en-ZA'):'—';
const cap=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const ownerRoles=['owner','manager'],writeRoles=['owner','manager','reception','estimator'],estimateRoles=['owner','manager','estimator'];
const nav=[['dashboard','▦','Overview'],['customers','♙','Customers'],['vehicles','▣','Vehicles'],['intake','▧','Vehicle Intake'],['estimates','▤','Estimates'],['invoices','▥','Invoices'],['workshop','⚒','Workshop Jobs'],['documents','▨','Documents'],['reports','▥','Reports'],['team','♧','Staff & Access'],['settings','⚙','Company Branding']];
const stages=['received','assessment','awaiting_approval','approved','parts_ordered','stripping','panel_beating','preparation','painting','assembly','quality_check','ready','collected'];
const cats=['parts','panel_labour','paint_labour','materials','subcontract','other'];
const state={view:'dashboard',user:null,company:null,setup:false,customers:[],vehicles:[],jobs:[],estimates:[],invoices:[],users:[],report:null,lines:[],pendingLogo:'',selectedJob:'',selectedDocument:'',busy:false,errors:'',message:'',q:'',photos:[]};
function toast(msg,bad=false){let n=$('#toast');if(!n){n=document.createElement('div');n.id='toast';n.style.cssText='position:fixed;bottom:20px;right:20px;padding:15px 18px;border-radius:12px;box-shadow:0 8px 35px #17253630;z-index:9999;max-width:370px;font-weight:750;color:white';document.body.append(n)}n.textContent=msg;n.style.background=bad?'#a83142':'#167452';clearTimeout(toast.t);toast.t=setTimeout(()=>n?.remove(),5000)}
async function api(path,{method='GET',data,headers={}}={}){const r=await fetch('/api/'+path,{method,credentials:'same-origin',headers:method==='GET'?headers:{'content-type':'application/json',...headers},body:method==='GET'?undefined:JSON.stringify(data||{})});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.error||'Request could not be completed');return b}
function call(path,data,method='POST',headers){return api(path,{method,data,headers})}
function permitted(page){const role=state.user?.role;if(['dashboard','documents','workshop'].includes(page))return true;if(page==='team'||page==='settings')return role==='owner';if(page==='reports')return ['owner','manager','accounts'].includes(role);if(page==='invoices')return ['owner','manager','accounts'].includes(role);if(page==='estimates')return [...estimateRoles,'reception','accounts'].includes(role);return writeRoles.includes(role)||role==='workshop'}
function setPage(view){if(!permitted(view))return toast('Your account does not have access to that section.',true);state.view=view;state.q='';render()}
function option(items,selected='',value='id',label='name'){return '<option value="">Select…</option>'+items.map(x=>`<option value="${esc(x[value])}" ${String(x[value])===String(selected)?'selected':''}>${esc(x[label])}</option>`).join('')}
function formField(name,label,opts={}){const{type='text',value='',required=false,placeholder='',wide=false,maxlength=200}=opts;return `<label class="${wide?'wide':''}">${esc(label)}<input name="${esc(name)}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" maxlength="${maxlength}" ${required?'required':''}></label>`}
function selectField(name,label,list,required=true){return `<label>${esc(label)}<select name="${esc(name)}" ${required?'required':''}>${list}</select></label>`}
function textareaField(name,label,wide=true,value=''){return `<label class="${wide?'wide':''}">${esc(label)}<textarea name="${esc(name)}">${esc(value)}</textarea></label>`}
const panel=(title,body,extra='')=>`<section class="panel"><div class="panelhead"><h2>${title}</h2>${extra}</div>${body}</section>`;
const table=(heads,rows)=>`<div class="tablewrap"><table><thead><tr>${heads.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${heads.length}" class="empty">No records yet</td></tr>`}</tbody></table></div>`;
const badge=x=>`<span class="pill ${['paid','ready','approved','collected'].includes(x)?'good':['unpaid','declined'].includes(x)?'bad':'warn'}">${esc(cap(x))}</span>`;
const heading=(title,sub,actions='')=>`<div class="pagehead"><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class="actions">${actions}</div></div>`;
function login(){const setup=state.setup;$('#app').innerHTML=`<div class="auth-wrap"><div class="auth"><img src="/assets/sulmos26-logo.webp" alt="SULMOS26"><h1>${setup?'Set up your automotive workspace':'Welcome to SULMOS26 Automotive'}</h1><p>${setup?'The installation administrator creates the first company and owner.':'Sign in to manage your panel-beating workshop.'}</p>${state.errors?`<div class="error">${esc(state.errors)}</div>`:''}<form id="authForm">${setup?`${formField('company_name','Company / Workshop Name',{required:true})}${formField('owner_name','Owner Full Name',{required:true})}`:''}${formField('username','Username',{required:true})}${formField('password','Password',{type:'password',required:true})}${setup?formField('setup_key','Private installation key',{type:'password',required:true}):''}<button class="btn primary" type="submit">${setup?'Create Owner & Company':'Sign in'}</button></form><div class="footer">SULMOS26 — Your business. One system.</div></div></div>`;
 $('#authForm').onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget));try{if(setup){const setup_key=b.setup_key;delete b.setup_key;await call('setup',b,'POST',{'x-setup-key':setup_key});state.setup=false;state.errors='Setup complete. Sign in with the owner credentials.';login()}else{await call('login',b);await initialize()}}catch(e){state.errors=e.message;login()}}}
async function initialize(){try{const r=await api('bootstrap');state.user=r.user;state.setup=r.setup_required;state.errors='';if(!state.user){login();return}await refreshAll();render()}catch(e){state.errors=e.message;$('#app').innerHTML=`<div class="auth-wrap"><div class="auth"><img src="/assets/sulmos26-logo.webp"><h1>Workspace connection unavailable</h1><div class="error">${esc(e.message)}</div><p>Check the independent Panel Beater D1 database, migrations and Worker deployment. Retail is unaffected.</p><button class="btn primary" id="retry">Retry</button></div></div>`;$('#retry').onclick=initialize}}
async function refreshAll(){const info=await api('me');state.user=info.user;state.company=info.company;const sets=[['customers','customers'],['vehicles','vehicles'],['jobs','jobs'],['estimates','estimates'],['invoices','invoices']];await Promise.all(sets.map(async([key,endpoint])=>{try{state[key]=(await api(endpoint)).items||[]}catch(e){console.warn(endpoint,e);state[key]=[]}}));if(['owner','manager'].includes(state.user.role))try{state.users=(await api('users')).items||[]}catch{state.users=[]}if(['owner','manager','accounts'].includes(state.user.role))try{state.report=await api('reports')}catch{state.report=null}}
function base(body){const c=state.company||{};$('#app').innerHTML=`<div class="app"><aside class="sidebar"><div class="brand"><img src="/assets/icon-192.png" alt="SULMOS26"><div><b>SULMOS<span>26</span></b><small>PANEL BEATER EDITION</small></div></div><nav class="nav-list">${nav.filter(([key])=>permitted(key)).map(([k,i,n])=>`<button class="nav-btn ${state.view===k?'active':''}" data-view="${k}"><span class="nav-ico">${i}</span>${n}</button>`).join('')}</nav><div class="sidebar-bottom">${esc(c.trading_name||'Automotive Workshop')}<br>${esc(state.user.name)} · ${esc(cap(state.user.role))}<button class="btn small" data-action="logout">Sign out</button></div></aside><div class="main"><header class="topbar"><div><h2>${esc(c.trading_name||'SULMOS26 Automotive')}</h2><p>${esc(cap(state.view))} · Workshop management</p></div><div class="actions"><span class="user-pill">${esc(state.user.name)} · ${esc(cap(state.user.role))}</span><button class="btn small" data-action="refresh">↻ Refresh</button></div></header><main class="container">${body}<div class="footer">Powered by SULMOS26 · Separate automotive workspace · Company data access controlled</div></main></div></div>`;wire()}
function dashboard(){const j=state.jobs,e=state.estimates,i=state.invoices;const inwork=j.filter(x=>!['ready','collected'].includes(x.stage)).length;const outstanding=i.reduce((s,x)=>s+x.total_cents-x.paid_cents,0);const cards=[['Vehicles in workshop',inwork,'Current repair jobs'],['Repair estimates',e.length,'All estimates'],['Unpaid invoices',i.filter(x=>x.status!=='paid').length,'Awaiting settlement'],['Outstanding balance',fmt(outstanding),'Issued invoices only']];const stats=`<div class="stats">${cards.map(([k,v,h])=>`<div class="stat"><div class="label">${k}</div><div class="value price">${v}</div><div class="hint">${h}</div></div>`).join('')}</div>`;const latest=j.slice(0,8).map(x=>`<tr><td><b>${esc(x.reference)}</b><small>${esc(x.registration)}</small></td><td>${esc(x.customer_name)}</td><td>${esc(x.make)} ${esc(x.model)}</td><td>${badge(x.stage)}</td><td><button class="btn small" data-gojob="${x.id}">Open</button></td></tr>`).join('');return heading('Workshop overview','All departments connected. Repair operations at a glance.',`<button class="btn yellow" data-view="intake">+ Vehicle intake</button>`) + stats+`<div class="grid2">${panel('Latest workshop jobs',table(['Job','Customer','Vehicle','Stage',''],latest))}${panel('Quick actions',`<div class="cardlist"><button class="btn" data-view="intake">Register vehicle intake</button><button class="btn" data-view="estimates">Prepare damage estimate</button><button class="btn" data-view="invoices">Download customer invoice</button><button class="btn" data-view="workshop">Update workshop progress</button></div><p class="fieldnote" style="margin-top:16px">Mobile owners can download branded invoices as PDF, then send the downloaded file through WhatsApp or email.</p>`)}</div>`}
function customers(){const can=writeRoles.includes(state.user.role);const rows=state.customers.filter(x=>[x.name,x.phone,x.email].join(' ').toLowerCase().includes(state.q.toLowerCase())).map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.phone)}</td><td>${esc(x.email)}</td><td>${esc(x.customer_type)}</td><td>${day(x.created_at)}</td></tr>`).join('');return heading('Customers','A single customer record linked to all vehicles and jobs.')+`${can?panel('Register customer',`<form data-form="customer" class="formgrid">${formField('name','Customer / Company Name',{required:true})}${formField('phone','Mobile Number')}${formField('email','Email',{type:'email'})}${formField('address','Address',{wide:true})}${selectField('customer_type','Customer Type','<option value="individual">Individual</option><option value="company">Company</option>')}<div class="formbuttons"><button class="btn yellow">Save Customer</button></div></form>`):''}${panel('Customer directory',`<div class="toolbar"><input data-search="true" placeholder="Search name, mobile or email" value="${esc(state.q)}"></div>${table(['Name','Mobile','Email','Type','Created'],rows)}`)}`}
function vehicles(){const can=writeRoles.includes(state.user.role);const rows=state.vehicles.filter(v=>[v.registration,v.make,v.model,v.customer_name].join(' ').toLowerCase().includes(state.q.toLowerCase())).map(v=>`<tr><td><b>${esc(v.registration)}</b></td><td>${esc(v.make)} ${esc(v.model)}<small>${esc(v.colour)} · ${esc(v.year||'')}</small></td><td>${esc(v.customer_name)}</td><td>${esc(v.vin||'—')}</td><td>${esc(v.mileage||0)} km</td></tr>`).join('');return heading('Vehicle register','VIN, mileage, colour and owner details by vehicle.')+(can?panel('Register vehicle',`<form data-form="vehicle" class="formgrid">${selectField('customer_id','Customer',option(state.customers),true)}${formField('registration','Registration Number',{required:true})}${formField('make','Make',{required:true})}${formField('model','Model')}${formField('year','Year',{type:'number'})}${formField('colour','Colour')}${formField('vin','VIN / Chassis Number')}${formField('engine_no','Engine Number')}${formField('mileage','Odometer (km)',{type:'number'})}<div class="formbuttons"><button class="btn yellow">Save Vehicle</button></div></form>`):'')+panel('Registered vehicles',`<div class="toolbar"><input data-search="true" placeholder="Search registration or vehicle" value="${esc(state.q)}"></div>${table(['Registration','Vehicle','Customer','VIN','Odometer'],rows)}`)}
function intake(){const can=writeRoles.includes(state.user.role);return heading('Vehicle intake','Record damage, insurance information and condition on arrival.')+(can?panel('New repair job',`<form data-form="job" class="formgrid">${selectField('vehicle_id','Registered Vehicle',option(state.vehicles.map(v=>({...v,label:`${v.registration} · ${v.customer_name}`})),'','id','label'))}${formField('insurer','Insurer / Broker')}${formField('claim_no','Insurance Claim Number')}${formField('expected_at','Requested Completion Date',{type:'date'})}${formField('fuel_level','Fuel Level')}${formField('excess_cents','Insurance Excess (cents)',{type:'number',value:0})}${textareaField('damage','Damage / Assessment Description')}${textareaField('accessories','Keys, accessories, spare wheel, tools and personal belongings')}${textareaField('intake_notes','Intake notes / customer instructions')}<div class="formbuttons"><button class="btn yellow">Save Vehicle Intake</button></div></form><div class="notice" style="margin-top:14px">You can print the intake form from Documents and add photographs inside Workshop Jobs after saving.</div>`):panel('View intake','Your role can view jobs but cannot create new vehicle intake records.'))}
function estimates(){const c=estimateRoles.includes(state.user.role),canApprove=ownerRoles.includes(state.user.role),ls=state.lines;const total=ls.reduce((s,l)=>s+Math.round(l.qty*l.unit_cents),0),rate=state.company?.vat_mode==='vat_vendor'?15:0,vat=Math.round(total*rate/100);const rows=state.estimates.map(e=>`<tr><td><b>${esc(e.reference)}</b><small>${esc(e.job_reference)}</small></td><td>${esc(e.customer_name)}<small>${esc(e.registration)}</small></td><td>${fmt(e.total_cents)}</td><td>${badge(e.status)}</td><td><div class="actions"><button class="btn small" data-pdf="estimate:${e.id}">Download PDF</button>${canApprove&&e.status==='submitted'?`<button class="btn small" data-decision="approve:${e.id}">Approve</button><button class="btn small danger" data-decision="decline:${e.id}">Decline</button>`:''}${e.status==='approved'&&['owner','manager','accounts'].includes(state.user.role)?`<button class="btn small yellow" data-invoice="${e.id}">Issue Invoice</button>`:''}</div></td></tr>`).join('');return heading('Assessments & estimates','Parts, panel labour, paint, materials, excess and supplementary work.')+(c?panel('Create repair estimate',`<form data-form="estimate" id="estimateForm"><div class="formgrid">${selectField('job_id','Repair Job',option(state.jobs.map(j=>({...j,label:`${j.reference} · ${j.registration} · ${j.customer_name}`})),'','id','label'))}${textareaField('assessment','Damage assessment and work scope')}</div><div class="line-grid"><div>${selectField('category','Type',cats.map(x=>`<option value="${x}">${cap(x)}</option>`).join(''),false)}</div><div class="description">${formField('description','Work / Part Description')}</div>${formField('qty','Quantity',{type:'number',value:1})}${formField('unit','Unit Price (R)',{type:'number',value:'0'})}<button class="btn" type="button" data-action="add-line">+ Add</button></div><div class="tablewrap" style="margin-top:13px">${table(['Category','Description','Qty','Unit price','Total',''],ls.map((l,i)=>`<tr><td>${esc(cap(l.category))}</td><td>${esc(l.description)}</td><td>${l.qty}</td><td>${fmt(l.unit_cents)}</td><td>${fmt(Math.round(l.qty*l.unit_cents))}</td><td><button class="btn small" type="button" data-removeline="${i}">×</button></td></tr>`).join(''))}</div><div class="total-box"><div class="total-line"><span>Subtotal</span><b>${fmt(total)}</b></div><div class="total-line"><span>VAT ${rate}%</span><b>${fmt(vat)}</b></div><div class="total-line final"><span>Total</span><span>${fmt(total+vat)}</span></div></div><div class="formbuttons"><button class="btn yellow">Save & Submit Estimate</button><button class="btn" type="button" data-action="clear-lines">Clear Lines</button></div></form><p class="fieldnote" style="margin-top:10px">Only managers or owners can approve estimates. Prices are saved in cents and revalidated on the server.</p>`):'')+panel('Estimate register',table(['Reference','Customer / Vehicle','Amount','Status','Actions'],rows))}
function invoices(){const rows=state.invoices.map(i=>`<tr><td><b>${esc(i.reference)}</b><small>${esc(i.estimate_reference)}</small></td><td>${esc(i.customer_name)}<small>${esc(i.registration)}</small></td><td>${fmt(i.total_cents)}</td><td>${fmt(i.total_cents-i.paid_cents)}</td><td>${badge(i.status)}</td><td><button class="btn small yellow" data-pdf="invoice:${i.id}">⬇ Download Invoice</button></td></tr>`).join('');return heading('Customer invoices','On mobile: download the PDF, then send it to the customer.',`<span class="pill">Download PDF only</span>`)+panel('Invoice register',table(['Invoice','Customer / Vehicle','Total','Outstanding','Status','Document'],rows))+panel('Record customer payment',`<form data-form="payment" class="formgrid">${selectField('invoice_id','Invoice',option(state.invoices.map(x=>({...x,label:`${x.reference} · ${x.customer_name} · ${fmt(x.total_cents-x.paid_cents)}`})),'','id','label'))}${formField('amount','Amount received (R)',{type:'number',required:true})}${selectField('method','Payment method','<option value="eft">EFT</option><option value="card">Card</option><option value="cash">Cash</option>')}${formField('reference','Verified payment reference',{required:true})}<div class="formbuttons"><button class="btn primary">Record Verified Payment</button></div></form><p class="fieldnote">Payment recording is restricted to owner/manager/accounts. Card/EFT transactions must be independently verified; the system does not connect to a bank.</p>`)}
function workshop(){const jobs=state.jobs;const isMgr=['owner','manager','workshop'].includes(state.user.role);const options=stages.map(x=>`<option value="${x}">${cap(x)}</option>`).join('');const rows=jobs.map(j=>`<tr><td><b>${esc(j.reference)}</b><small>${esc(j.registration)}</small></td><td>${esc(j.customer_name)}</td><td>${esc(j.make)} ${esc(j.model)}</td><td>${badge(j.stage)}</td><td>${esc(j.expected_at?day(j.expected_at):'—')}</td><td><button class="btn small" data-gojob="${j.id}">Manage Job</button></td></tr>`).join('');const selected=jobs.find(x=>x.id===state.selectedJob)||jobs[0];return heading('Workshop job board','Track repairs from vehicle intake to customer handover.')+panel('All workshop jobs',table(['Job','Customer','Vehicle','Stage','Due',''],rows))+(selected?panel(`Manage ${esc(selected.reference)} · ${esc(selected.registration)}`,`<div class="jobbar">${stages.map(x=>`<span class="${x===selected.stage?'active':''}">${cap(x)}</span>`).join('')}</div><div class="formgrid" style="margin-top:17px"><label>Repair stage<select id="work-stage">${options.replace(`value="${selected.stage}"`,`value="${selected.stage}" selected`)}</select></label>${formField('handed_to','Collected by (only for handover)')}${textareaField('stage_note','Progress update / inspection note')}</div><div class="formbuttons"><button class="btn yellow" data-workprogress="${selected.id}">Save stage update</button><button class="btn" data-pdf="jobcard:${selected.id}">Download Job Card</button></div>${isMgr?`<div class="formgrid" style="margin-top:18px"><label>Assign technician<select id="tech-select">${option(state.users.filter(u=>['technician','workshop','manager'].includes(u.role)))}</select></label><div style="display:flex;align-items:end"><button class="btn" data-assign="${selected.id}">Assign technician</button></div></div>`:''}<h3 style="margin-top:22px">Quality control checklist</h3><div class="formgrid" style="margin:12px 0">${['Panel alignment','Paint finish','Lights and safety','Road test','Vehicle cleaned','Final customer belongings check'].map(x=>`<label><span><input type="checkbox" class="qc-check" value="${x}"> ${x}</span></label>`).join('')}</div><textarea id="qcNote" placeholder="QC inspector notes"></textarea><div class="formbuttons"><button class="btn" data-qc="${selected.id}">Save QC checklist</button></div><h3 style="margin:22px 0 12px">Damage photographs</h3><div class="uploadbox"><input type="file" id="jobPhoto" accept="image/jpeg,image/png,image/webp" capture="environment"><button class="btn small" data-photo="${selected.id}" style="margin-top:10px">Upload compressed photo</button><p class="fieldnote">Up to 12 compressed images per job. Stored privately in your company's database.</p></div><div id="photoList" class="photogrid" style="margin-top:12px"></div><div class="formbuttons"><button class="btn small" data-events="${selected.id}">Show work history</button></div><div id="eventsList"></div>`):panel('No active jobs','Register a vehicle and intake first.'))}
function documents(){const opts=state.jobs.map(j=>`<option value="${esc(j.id)}">${esc(j.reference)} · ${esc(j.registration)}</option>`).join('');return heading('Documents & downloads','Company-branded paperwork with owner details, customer data and vehicle references.')+panel('Generate PDF document',`<div class="formgrid"><label>Job / Vehicle<select id="print-job">${opts||'<option value="">No jobs available</option>'}</select></label><label>Document type<select id="print-type"><option value="intake">Vehicle intake record</option><option value="jobcard">Workshop job card</option><option value="qc">Quality-control checklist</option><option value="collection">Vehicle collection note</option></select></label></div><div class="formbuttons"><button class="btn yellow" data-action="download-job-doc">⬇ Download PDF</button></div>`)+panel('Saved estimate and invoice documents',`<div class="grid2">${panel('Estimates',state.estimates.slice(0,10).map(e=>`<div class="list-item"><span><b>${esc(e.reference)}</b><small>${esc(e.customer_name)}</small></span><button class="btn small" data-pdf="estimate:${e.id}">Download</button></div>`).join('')||'No estimates')}${panel('Invoices',state.invoices.slice(0,10).map(i=>`<div class="list-item"><span><b>${esc(i.reference)}</b><small>${esc(i.customer_name)}</small></span><button class="btn small yellow" data-pdf="invoice:${i.id}">Download</button></div>`).join('')||'No invoices')}</div>`) }
function reports(){const r=state.report||{};const cards=[['Repair jobs',r.jobs?.n||0],['Total estimates',fmt(r.estimates?.v||0)],['Issued invoice value',fmt(r.invoices?.v||0)],['Outstanding invoices',fmt(r.invoices?.outstanding||0)]];return heading('Business reports','Company-level performance, not data from other workshops.')+`<div class="stats">${cards.map(([k,v])=>`<div class="stat"><div class="label">${k}</div><div class="value">${v}</div></div>`).join('')}</div>`+`<div class="grid2">${panel('Jobs by stage',table(['Stage','Number'],(r.stages||[]).map(x=>`<tr><td>${badge(x.stage)}</td><td>${x.n}</td></tr>`).join('')))}${panel('Technician allocation',table(['Technician','Jobs'],(r.technicians||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${x.jobs}</td></tr>`).join('')))}</div>`+panel('Payments received',`<h2>${fmt(r.payments?.v||0)}</h2><p class="fieldnote">Recorded payments only. Bank reconciliation, refunds and formal accounting integration require additional controls.</p>`)}
function team(){return heading('Staff & access','Create restricted accounts for estimators, reception, workshop and accounts.')+panel('Add team member',`<form data-form="staff" class="formgrid">${formField('name','Full name',{required:true})}${formField('username','Unique username',{required:true})}${formField('password','Initial password (12+ characters)',{type:'password',required:true})}${selectField('role','Role',['manager','reception','estimator','workshop','technician','accounts'].map(r=>`<option value="${r}">${cap(r)}</option>`).join(''))}<div class="formbuttons"><button class="btn yellow">Create User</button></div></form>`)+panel('User accounts',table(['Full name','Username','Role','Active'],state.users.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.username)}</td><td>${badge(x.role)}</td><td>${x.active?'Yes':'No'}</td></tr>`).join('')))+panel('Add another workshop to SULMOS26',`<div class="notice">Platform onboarding creates a fully separate company database scope, owner login and business branding. Only the platform administrator with the installation key can add another company.</div><form data-form="provision" class="formgrid">${formField('company_name','New workshop legal name',{required:true})}${formField('owner_name','New owner name',{required:true})}${formField('username','Unique owner username',{required:true})}${formField('password','Owner password (12+ characters)',{type:'password',required:true})}${formField('setup_key','Platform installation key',{type:'password',required:true})}<div class="formbuttons"><button class="btn">Create Isolated Company</button></div></form>`)}
function settings(){const c=state.company||{};return heading('Company branding','Uploaded company identity appears on downloaded quotations, invoices and job cards.')+panel('Company / Workshop details',`<form data-form="company" class="formgrid">${formField('legal_name','Registered company name',{value:c.legal_name,required:true})}${formField('trading_name','Trading / workshop name',{value:c.trading_name,required:true})}${formField('registration_no','Registration number',{value:c.registration_no})}${formField('vat_no','VAT number (if registered)',{value:c.vat_no})}${selectField('vat_mode','VAT status',`<option value="non_vat" ${c.vat_mode!=='vat_vendor'?'selected':''}>Not VAT registered</option><option value="vat_vendor" ${c.vat_mode==='vat_vendor'?'selected':''}>VAT registered (check SARS compliance)</option>`)}${formField('phone','Phone',{value:c.phone})}${formField('email','Email',{type:'email',value:c.email})}${formField('address','Physical address',{value:c.address,wide:true})}${textareaField('bank_details','Banking details',true,c.bank_details)}${textareaField('terms','Invoice and quotation footer / terms',true,c.terms)}<label class="wide">Company logo (PNG, JPG or WebP)<input type="file" id="company-logo-file" accept="image/png,image/jpeg,image/webp"><span class="fieldnote">Choose your logo, then click Save Company Branding. It must display below after saving.</span></label><div>${c.logo_data?`<img class="imgpreview" src="${c.logo_data}" alt="Current logo">`:'<div class="uploadbox">No company logo saved yet</div>'}</div><div class="formbuttons"><button class="btn yellow">Save Company Branding</button></div></form><div class="notice" style="margin-top:17px">All SULMOS26 app icons remain SULMOS26-branded. Downloaded customer paperwork uses this business logo and address. VAT treatment needs accountant review before issuing real tax invoices.</div>`)}
function render(){if(!state.user){login();return}let content='';switch(state.view){case'customers':content=customers();break;case'vehicles':content=vehicles();break;case'intake':content=intake();break;case'estimates':content=estimates();break;case'invoices':content=invoices();break;case'workshop':content=workshop();break;case'documents':content=documents();break;case'reports':content=reports();break;case'team':content=team();break;case'settings':content=settings();break;default:content=dashboard()}base(content);if(state.view==='workshop'&&state.selectedJob)loadPhotos(state.selectedJob).catch(()=>{})}
function wire(){const root=$('#app');root.onclick=async ev=>{const b=ev.target.closest('button');if(!b)return;const d=b.dataset;if(d.view){setPage(d.view);return}if(d.gojob){state.selectedJob=d.gojob;setPage('workshop');return}if(d.removeline!==undefined){state.lines.splice(Number(d.removeline),1);render();return}try{if(d.action==='logout'){await call('logout');state.user=null;state.setup=false;login()}else if(d.action==='refresh'){await refreshAll();render();toast('Updated')}else if(d.action==='add-line')addLine();else if(d.action==='clear-lines'){state.lines=[];render()}else if(d.action==='download-job-doc'){const job=$('#print-job').value,type=$('#print-type').value;await downloadJobDoc(job,type)}else if(d.pdf){const[type,ref]=d.pdf.split(':');await downloadDoc(type,ref)}else if(d.decision){const[action,ref]=d.decision.split(':');if(confirm(`Confirm ${action} for this estimate?`)){await call(`estimates/${ref}/${action}`,{});await refreshAll();render();toast('Estimate '+action+'d')}}else if(d.invoice){if(confirm('Issue numbered customer invoice for this approved estimate?')){const z=await call('invoices',{estimate_id:d.invoice});await refreshAll();setPage('invoices');toast('Invoice issued '+z.reference)}}else if(d.workprogress){await call(`jobs/${d.workprogress}/stage`,{stage:$('#work-stage').value,handed_to:$('[name=handed_to]').value,note:$('[name=stage_note]').value});await refreshAll();render();toast('Job status updated')}else if(d.qc){const checks=$$('.qc-check:checked').map(x=>x.value);await call(`jobs/${d.qc}/qc`,{checks,note:$('#qcNote').value});await refreshAll();render();toast('QC recorded')}else if(d.assign){await call(`jobs/${d.assign}/assign`,{technician_id:$('#tech-select').value});await refreshAll();render();toast('Technician assigned')}else if(d.photo){await uploadPhoto(d.photo)}else if(d.events){const z=await api('job-events?job_id='+encodeURIComponent(d.events));$('#eventsList').innerHTML=`<div class="cardlist" style="margin-top:12px">${z.items.map(x=>`<div class="list-item"><span>${esc(cap(x.stage))}<small>${esc(x.note)} · ${esc(x.actor_name)}</small></span><small>${day(x.at)}</small></div>`).join('')||'No history'}</div>`}}catch(e){toast(e.message,true)}};
 root.onsubmit=async ev=>{const form=ev.target.closest('form[data-form]');if(!form)return;ev.preventDefault();const type=form.dataset.form,b=Object.fromEntries(new FormData(form));const submit=form.querySelector('button[type=submit],button:not([type])');if(submit)submit.disabled=true;try{if(type==='company'){
  const uploaded=state.pendingLogo;
  b.logo_data=uploaded||state.company?.logo_data||'';
  await call('company',b,'PUT');
  const confirmed=await api('me');
  if(uploaded&&!confirmed.company?.logo_data)throw Error('Company details saved but the logo was not returned by the database. Please retry and check the image file.');
  state.company=confirmed.company;
  state.pendingLogo='';
}else if(type==='customer'){await call('customers',b)}else if(type==='vehicle'){await call('vehicles',b)}else if(type==='job'){b.excess_cents=Number(b.excess_cents||0);await call('jobs',b)}else if(type==='estimate'){if(!state.lines.length)throw new Error('Add at least one estimate line');await call('estimates',{job_id:b.job_id,assessment:b.assessment,lines:state.lines});state.lines=[]}else if(type==='payment'){b.amount_cents=Math.round(Number(b.amount)*100);delete b.amount;await call('payments',b)}else if(type==='staff'){await call('users',b)}else if(type==='provision'){const setup=b.setup_key;delete b.setup_key;await call('companies/provision',b,'POST',{'x-setup-key':setup})}await refreshAll();render();toast('Saved successfully')}catch(e){toast(e.message,true)}finally{if(submit)submit.disabled=false}};
 root.oninput=ev=>{const t=ev.target;if(t.matches('[data-search]')){state.q=t.value;const pos=t.selectionStart;render();const n=$('[data-search]');if(n){n.focus();n.setSelectionRange(pos,pos)}}};
 root.onchange=async ev=>{const t=ev.target;if(t.id==='company-logo-file'&&t.files[0]){try{state.pendingLogo=await compressImage(t.files[0],900,0.84,260000,false);toast('Company logo ready. Click Save Company Branding.')}catch(e){toast(e.message,true)}}};}
function addLine(){const form=$('#estimateForm');if(!form)return;const cat=form.querySelector('[name=category]').value,desc=form.querySelector('[name=description]').value.trim(),qty=Number(form.querySelector('[name=qty]').value),unit=Number(form.querySelector('[name=unit]').value);if(!desc||!Number.isFinite(qty)||qty<=0||qty>100000||!Number.isFinite(unit)||unit<0) return toast('Enter description, quantity and valid price',true);state.lines.push({category:cat,description:desc,qty,unit_cents:Math.round(unit*100)});render()}
async function compressImage(file,maxDim=900,quality=.8,maxBytes=160000,forceJpeg=true){if(!file.type.startsWith('image/'))throw Error('Select an image file');return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);const scale=Math.min(1,maxDim/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);let q=quality,s='';for(let i=0;i<5;i++){s=canvas.toDataURL('image/jpeg',q);if(s.length<=maxBytes)break;q*=.75}if(s.length>maxBytes)return reject(Error('Image too large even after compression'));resolve(s)};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Cannot load image'))};img.src=url})}
async function uploadPhoto(job){const file=$('#jobPhoto')?.files?.[0];if(!file)return toast('Select a photo',true);const data=await compressImage(file,820,.72,180000,true);await call('photos',{job_id:job,data,name:file.name});await loadPhotos(job);toast('Photo saved privately')}
async function loadPhotos(job){const el=$('#photoList');if(!el)return;const r=await api('photos?job_id='+encodeURIComponent(job));if($('#photoList'))$('#photoList').innerHTML=r.items.map(p=>`<img src="${p.data}" alt="${esc(p.name)}" loading="lazy">`).join('')}
// PDF generation is local and downloads directly, with no third-party library or sharing service.
function moneyR(v){return fmt(v).replace(/\u00a0/g,' ')}
function ascii(v){return String(v??'').normalize('NFKD').replace(/[^\x20-\x7E]/g,'?')}
function makeCanvas(){const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1240,1754);return {canvas,ctx}}
function drawWrapped(ctx,text,x,y,maxWidth,lineHeight=28,maxLines=100){text=String(text||'').replace(/\r/g,'');for(const segment of text.split('\n')){const words=segment.split(/\s+/);let line='';for(const w of words){if(ctx.measureText(line+' '+w).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;maxLines--;line=w}else line+=(line?' ':'')+w;if(maxLines<=0)return y}ctx.fillText(line,x,y);y+=lineHeight;if(--maxLines<=0)return y}return y}
function textAt(ctx,text,x,y,size=24,color='#243342',bold=false){ctx.font=`${bold?'bold ':''}${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.fillText(String(text||''),x,y)}
async function logoImage(src){if(!src)return null;return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src})}
// SULMOS26 Automotive V42 — premium A4 document layout. Existing saved amounts and company identity are unchanged.
function pdfWrap(ctx,value,maxWidth){
 const out=[];
 for(const paragraph of String(value??'').replace(/\r/g,'').split('\n')){
  if(!paragraph.trim()){out.push('');continue}
  let line='';
  for(const word of paragraph.trim().split(/\s+/)){
   if(ctx.measureText(word).width>maxWidth){
    if(line){out.push(line);line=''}
    let fragment='';for(const ch of word){if(ctx.measureText(fragment+ch).width>maxWidth&&fragment){out.push(fragment);fragment=''}fragment+=ch}
    line=fragment;continue;
   }
   const attempt=line?line+' '+word:word;
   if(ctx.measureText(attempt).width>maxWidth&&line){out.push(line);line=word}else line=attempt;
  }
  if(line)out.push(line);
 }
 return out;
}
function pdfRound(ctx,x,y,w,h,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function pdfText(ctx,value,x,y,size=20,color='#172633',bold=false){ctx.font=`${bold?'700 ':'400 '}${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.fillText(String(value??''),x,y)}
function pdfRight(ctx,value,right,y,size=20,color='#172633',bold=false){ctx.font=`${bold?'700 ':'400 '}${size}px Arial, sans-serif`;ctx.fillStyle=color;const v=String(value??'');ctx.fillText(v,right-ctx.measureText(v).width,y)}
function pdfClipped(ctx,value,x,y,maxWidth,size=20,bold=false,color='#172633'){
 ctx.font=`${bold?'700 ':'400 '}${size}px Arial, sans-serif`;
 let s=String(value??'—');
 while(s.length>2&&ctx.measureText(s).width>maxWidth)s=s.slice(0,-2)+'…';
 ctx.fillStyle=color;ctx.fillText(s,x,y);
}
function pdfLines(ctx,value,x,y,width,size=19,leading=29,color='#485c6d',limit=99){
 ctx.font=`${size}px Arial, sans-serif`;
 const lines=pdfWrap(ctx,value,width);
 ctx.fillStyle=color;
 for(const part of lines.slice(0,limit)){if(part)ctx.fillText(part,x,y);y+=leading}
 return y;
}
async function documentPages({type,reference,company={},customer={},vehicle={},lines=[],detail='',meta=[],footer='',vatRate=0,amounts={}}){
 const W=1240,H=1754,M=76,R=1164,WIDTH=R-M;
 const ink='#142532',soft='#4f6474',muted='#81919d',gold='#cf9b29',light='#f4f6f7',rule='#dfe5e9',paper='#fff';
 const logo=await logoImage(company?.logo_data);
 const title=String(type||'WORKSHOP DOCUMENT').toUpperCase();
 const isBill=/INVOICE|ESTIMATE|QUOTATION/i.test(title);
 const ref=String(reference||'—');
 const documentMeta=(meta||[]).filter(x=>Array.isArray(x)&&x[1]!==null&&x[1]!==undefined&&String(x[1]).trim());
 const items=Array.isArray(lines)&&lines.length?lines:[{category:'service',description:'Please refer to the work description above',qty_milli:1000,unit_cents:0,line_cents:0}];
 const measure=document.createElement('canvas').getContext('2d');
 measure.font='20px Arial, sans-serif';
 const scope=String(detail||'').trim()?pdfWrap(measure,detail,WIDTH-48):[];
 const itemLines=items.map(row=>{measure.font='20px Arial, sans-serif';return {row,parts:pdfWrap(measure,row.description||'Service item',580)}});
 measure.font='17px Arial, sans-serif';
 const termLines=pdfWrap(measure,String(footer||company.terms||'Please contact the workshop for further information.'),isBill?560:WIDTH);
 let termPos=0;
 const docs=[];
 let pageNo=0,noteIdx=0,itemIdx=0,itemLineIdx=0,totalsDone=false;
 // All original saved figures are preserved; rendering never recalculates price or tax.
 while(!totalsDone||termPos<termLines.length){
  if(++pageNo>60)throw Error('Document exceeds 60 pages');
  const {canvas,ctx}=makeCanvas();
  ctx.fillStyle=paper;ctx.fillRect(0,0,W,H);
  // Minimal editorial header with a customer-uploaded company logo.
  ctx.fillStyle=ink;ctx.fillRect(0,0,W,12);
  const logoX=M,logoY=63,logoW=190,logoH=130;
  if(logo){
   ctx.fillStyle=paper;pdfRound(ctx,logoX,logoY,logoW,logoH,9);ctx.fill();
   const scale=Math.min((logoW-12)/logo.width,(logoH-12)/logo.height);
   const w=logo.width*scale,h=logo.height*scale;
   ctx.drawImage(logo,logoX+(logoW-w)/2,logoY+(logoH-h)/2,w,h);
  }else{
   ctx.fillStyle=light;pdfRound(ctx,logoX,logoY,logoW,logoH,10);ctx.fill();
   ctx.strokeStyle=rule;ctx.lineWidth=2;pdfRound(ctx,logoX,logoY,logoW,logoH,10);ctx.stroke();
   pdfText(ctx,'NO LOGO',logoX+39,logoY+63,22,soft,true);
   pdfText(ctx,'UPLOADED',logoX+34,logoY+92,18,muted);
  }
  const cx=301,cw=WIDTH-(cx-M);
  pdfClipped(ctx,company.trading_name||company.legal_name||'Automotive workshop',cx,93,cw,33,true,ink);
  let iy=124;
  if(company.address)iy=pdfLines(ctx,company.address,cx,iy,cw,18,24,soft,2);
  const contact=[company.phone,company.email].filter(Boolean).join('    •    ');
  if(contact)iy=pdfLines(ctx,contact,cx,iy+1,cw,18,24,soft,2);
  const details=[company.registration_no?'Reg: '+company.registration_no:'',company.vat_mode==='vat_vendor'&&company.vat_no?'VAT: '+company.vat_no:''].filter(Boolean).join('    •    ');
  if(details)pdfClipped(ctx,details,cx,Math.min(198,iy+1),cw,17,false,muted);
  ctx.fillStyle=rule;ctx.fillRect(M,218,WIDTH,2);
  // Clear document heading / reference panel.
  pdfText(ctx,title,M,288,42,ink,true);
  ctx.fillStyle=gold;ctx.fillRect(M,303,74,5);
  pdfText(ctx,pageNo===1?'Prepared for your records':'Document continued',M,337,18,soft);
  pdfRight(ctx,'REFERENCE',R,259,16,muted,true);
  pdfRight(ctx,ref,R,294,24,ink,true);
  pdfRight(ctx,'PAGE '+pageNo,R,330,18,soft);
  let y=376;
  if(pageNo===1){
   const cardH=151, gap=22, w=(WIDTH-gap)/2;
   // Clean two-column customer and vehicle cards with no heavy boxes.
   ctx.fillStyle=light;pdfRound(ctx,M,y,w,cardH,12);ctx.fill();pdfRound(ctx,M+w+gap,y,w,cardH,12);ctx.fill();
   pdfText(ctx,'BILL TO / CUSTOMER',M+22,y+31,16,muted,true);
   pdfClipped(ctx,customer.name||'Customer not specified',M+22,y+70,w-44,24,true,ink);
   if(customer.phone)pdfClipped(ctx,customer.phone,M+22,y+106,w-44,18,false,soft);
   const vx=M+w+gap;
   pdfText(ctx,'VEHICLE DETAILS',vx+22,y+31,16,muted,true);
   pdfClipped(ctx,[vehicle.make,vehicle.model].filter(Boolean).join(' ')||'Vehicle not specified',vx+22,y+70,w-44,23,true,ink);
   pdfClipped(ctx,'Reg: '+String(vehicle.registration||'—')+(vehicle.vin?'   •   VIN: '+vehicle.vin:''),vx+22,y+106,w-44,17,false,soft);
   y+=cardH+25;
   if(documentMeta.length){
    const selected=documentMeta.slice(0,6),columns=3,chunk=370,rh=66;
    const rows=Math.ceil(selected.length/columns);
    for(let i=0;i<selected.length;i++){
     const x=M+(i%columns)*chunk, yy=y+Math.floor(i/columns)*rh;
     pdfText(ctx,String(selected[i][0]).toUpperCase(),x,yy+16,15,muted,true);
     pdfClipped(ctx,selected[i][1],x,yy+47,chunk-22,19,true,ink);
    }
    y+=rows*rh+18;
   }
  }else{
   pdfClipped(ctx,'CUSTOMER: '+(customer.name||'—')+'     •     VEHICLE: '+(vehicle.registration||'—'),M,y,WIDTH,19,false,soft);
   y+=36;
  }
  // Work scope is allowed to flow to subsequent pages without truncation.
  if(noteIdx<scope.length){
   pdfText(ctx,noteIdx===0?'ASSESSMENT & REPAIR SCOPE':'REPAIR SCOPE — CONTINUED',M,y+20,21,ink,true);
   y+=43;
   ctx.fillStyle=light;pdfRound(ctx,M,y-4,WIDTH,Math.min(100,Math.max(54,(scope.length-noteIdx)*29+23)),8);ctx.fill();
   const available=Math.max(1,Math.floor((1200-y-23)/29));
   const count=Math.min(available,scope.length-noteIdx);
   ctx.fillStyle=soft;ctx.font='19px Arial, sans-serif';
   // Repaint background accurately for displayed lines.
   ctx.fillStyle=paper;ctx.fillRect(M,y-5,WIDTH,Math.min(840,Math.max(54,count*29+23)));
   ctx.fillStyle=light;pdfRound(ctx,M,y-5,WIDTH,count*29+19,10);ctx.fill();
   ctx.fillStyle=soft;
   for(let i=0;i<count;i++){
    const v=scope[noteIdx++];if(v)ctx.fillText(v,M+20,y+25+i*29);
   }
   y+=count*29+40;
  }
  // Item lines are broken across pages, including unusually long descriptions.
  if(noteIdx>=scope.length){
   if(itemIdx<itemLines.length){
    if(y>1300){/* table begins on next page */}
    else {
     pdfText(ctx,'REPAIR & SERVICE ITEMS',M,y+19,21,ink,true);y+=44;
     ctx.fillStyle=ink;pdfRound(ctx,M,y,WIDTH,49,7);ctx.fill();
     pdfText(ctx,'DESCRIPTION',M+18,y+32,16,paper,true);
     pdfRight(ctx,'QTY',M+759,y+32,16,paper,true);
     pdfRight(ctx,'UNIT PRICE',M+936,y+32,16,paper,true);
     pdfRight(ctx,'AMOUNT',R-19,y+32,16,paper,true);
     y+=61;
     while(itemIdx<itemLines.length&&y<1430){
      const {row,parts}=itemLines[itemIdx];
      const available=Math.floor((1430-y-42)/27);
      if(available<1)break;
      const chunks=Math.min(Math.max(1,available),Math.max(1,parts.length-itemLineIdx));
      const height=Math.max(83,50+chunks*27);
      if(y+height>1475)break;
      if(itemIdx%2===0){ctx.fillStyle='#f8fafb';ctx.fillRect(M,y-4,WIDTH,height)}
      ctx.fillStyle=gold;ctx.fillRect(M,y+5,3,Math.max(35,height-25));
      if(itemLineIdx===0){pdfText(ctx,String(row.category||'SERVICE').replaceAll('_',' ').toUpperCase(),M+19,y+18,14,muted,true)}
      ctx.fillStyle=ink;ctx.font='19px Arial, sans-serif';
      for(let i=0;i<chunks;i++){
       const part=parts[itemLineIdx+i];if(part)ctx.fillText(part,M+19,y+48+i*27);
      }
      if(itemLineIdx===0){
       const qty=Number(row.qty_milli??1000)/1000;
       pdfRight(ctx,qty.toLocaleString('en-ZA',{maximumFractionDigits:3}),M+757,y+53,19,ink);
       pdfRight(ctx,moneyR(Number(row.unit_cents)||0),M+936,y+53,18,soft);
       pdfRight(ctx,moneyR(Number(row.line_cents)||0),R-19,y+53,19,ink,true);
      }
      ctx.fillStyle=rule;ctx.fillRect(M,y+height-3,WIDTH,1);
      y+=height;itemLineIdx+=chunks;
      if(itemLineIdx>=parts.length){itemLineIdx=0;itemIdx++}
      else break;
     }
    }
   }
  }
  if(!totalsDone&&noteIdx>=scope.length&&itemIdx>=itemLines.length){
   if(isBill){
    // If the bill summary will not fit, continue to a clean summary page.
    if(y<1330){
     y+=23;
     // Terms sit beside the charges summary, instead of being lost beneath it.
     pdfText(ctx,'NOTES & TERMS',M,y+29,17,ink,true);
     ctx.fillStyle=soft;ctx.font='17px Arial, sans-serif';
     const maxInline=6;
     for(let i=0;termPos<termLines.length&&i<maxInline;i++){
      const part=termLines[termPos++];if(part)ctx.fillText(part,M,y+62+i*23);
     }
     ctx.fillStyle=light;pdfRound(ctx,703,y,461,180,11);ctx.fill();
     pdfText(ctx,'SUMMARY OF CHARGES',724,y+32,16,muted,true);
     pdfText(ctx,'Subtotal',724,y+70,19,soft);pdfRight(ctx,moneyR(amounts.subtotal_cents||0),R-20,y+70,19,ink);
     pdfText(ctx,'VAT ('+(Number(vatRate)||0)+'%)',724,y+101,19,soft);pdfRight(ctx,moneyR(amounts.vat_cents||0),R-20,y+101,19,ink);
     ctx.fillStyle=gold;ctx.fillRect(723,y+113,417,2);
     pdfText(ctx,'TOTAL DUE',724,y+152,22,ink,true);pdfRight(ctx,moneyR(amounts.total_cents||0),R-20,y+153,26,ink,true);
     y+=194;totalsDone=true;
    }
   }else totalsDone=true;
  }
  if(totalsDone){
   // Any longer terms go to a neatly formatted continuation page.
   if(termPos<termLines.length){
    if(y<=1250||(!isBill&&y<1500)){
     pdfText(ctx,'ADDITIONAL NOTES & TERMS',M,y+19,21,ink,true);
     y+=50;ctx.fillStyle=soft;ctx.font='18px Arial, sans-serif';
     const room=Math.max(1,Math.floor((1530-y)/28));
     for(let i=0;termPos<termLines.length&&i<room;i++){
      const part=termLines[termPos++];if(part)ctx.fillText(part,M,y+i*28);
     }
    }
   }
   if(!isBill&&y<1460){
    const sy=Math.max(1450,y+118);
    ctx.fillStyle=rule;ctx.fillRect(M,sy,440,1);ctx.fillRect(667,sy,497,1);
    pdfText(ctx,'WORKSHOP / AUTHORISED SIGNATURE',M,sy+25,15,muted,true);
    pdfText(ctx,'CUSTOMER / RECEIVED BY',667,sy+25,15,muted,true);
   }
  }
  // Consistent unobtrusive footer for printed paperwork.
  ctx.fillStyle=rule;ctx.fillRect(M,1635,WIDTH,1);
  pdfClipped(ctx,company.trading_name||company.legal_name||'Automotive Workshop',M,1672,470,17,true,soft);
  pdfText(ctx,'Ref: '+ref,M,1700,16,muted);
  pdfRight(ctx,'PAGE '+pageNo,R,1682,17,muted,true);
  ctx.fillStyle=gold;ctx.fillRect(M,1728,WIDTH,5);
  docs.push(canvas.toDataURL('image/jpeg',.92).split(',')[1]);
 }
 return docs;
}
function b64ToBytes(b64){const bin=atob(b64),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out}
function pdfFromJpegs(jpegs){const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;const add=x=>{const b=typeof x==='string'?enc.encode(x):x;parts.push(b);length+=b.length};const object=(n,stuff)=>{offsets[n]=length;add(`${n} 0 obj\n`);add(stuff);add('\nendobj\n')};add('%PDF-1.4\n');const pageCount=jpegs.length,first=3;object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,`<< /Type /Pages /Kids [${jpegs.map((_,i)=>`${first+i*3} 0 R`).join(' ')}] /Count ${pageCount} >>`);for(let i=0;i<pageCount;i++){const p=first+i*3,img=p+1,content=p+2,bytes=b64ToBytes(jpegs[i]);object(p,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i} ${img} 0 R >> >> /Contents ${content} 0 R >>`);offsets[img]=length;add(`${img} 0 obj\n<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');const s=`q\n595 0 0 842 0 0 cm\n/Im${i} Do\nQ\n`;object(content,`<< /Length ${enc.encode(s).length} >>\nstream\n${s}endstream`)}const xref=length;add(`xref\n0 ${first+pageCount*3}\n0000000000 65535 f \n`);for(let n=1;n<first+pageCount*3;n++)add(`${String(offsets[n]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${first+pageCount*3} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);const out=new Uint8Array(length);let o=0;for(const b of parts){out.set(b,o);o+=b.length}return new Blob([out],{type:'application/pdf'})}
function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name.replace(/[^A-Za-z0-9._-]/g,'_')+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
async function downloadDoc(type,ref){
 const [d,info]=await Promise.all([
  api(`${type==='invoice'?'invoice-detail':'estimate-detail'}?id=${encodeURIComponent(ref)}`),
  api('me')
 ]);
 const record=d.invoice||d.estimate;
 if(!record)throw Error('Saved estimate/invoice was not found.');
 const c={...(info.company||{}),...(d.company||{})};
 // Only use the current logged-in company's verified logo, never another company's record.
 if(info.company?.id===c.id&&info.company?.logo_data)c.logo_data=info.company.logo_data;
 state.company=info.company||state.company;
 if(!c.logo_data)toast('No saved company logo found. PDF will show the no-logo placeholder.',true);
 const rows=d.lines||[],job=state.jobs.find(x=>x.id===record.job_id)||{},veh=state.vehicles.find(x=>x.registration===record.registration)||{};
 const pages=await documentPages({type:type==='invoice'?'CUSTOMER INVOICE':'REPAIR ESTIMATE',reference:record.reference,company:c,customer:{name:record.customer_name,phone:record.customer_phone},vehicle:{...veh,registration:record.registration,make:record.make||veh.make,model:record.model||veh.model,vin:record.vin||veh.vin},lines:rows,detail:record.assessment||job.damage||'',vatRate:record.vat_rate??(record.vat_cents?15:0),amounts:record,meta:[['Job',record.job_reference],['Date',day(record.issued_at||record.created_at)],['Status',record.status]],footer:`${type==='invoice'?`Outstanding: ${moneyR(record.total_cents-record.paid_cents)}. `:'Estimate subject to customer approval and parts availability. '}${c.terms||'Contact the workshop for queries.'}`});saveBlob(pdfFromJpegs(pages),record.reference);toast('PDF downloaded. Open Downloads to share the file.')}
async function downloadJobDoc(jobId,type){const j=state.jobs.find(x=>x.id===jobId);if(!j)throw Error('Select a job');const info=await api('me');const c=info.company||state.company||{};state.company=c;lines=type==='qc'?[{category:'qc',description:'Panel alignment, paint finish, lights/safety, road test, wash and belongings',qty_milli:1000,line_cents:0}]:[{category:'job',description:j.damage||'Vehicle inspection and repair instructions',qty_milli:1000,line_cents:0}],title=({intake:'VEHICLE INTAKE FORM',jobcard:'WORKSHOP JOB CARD',qc:'QUALITY CONTROL SHEET',collection:'VEHICLE COLLECTION NOTE'})[type]||'WORKSHOP DOCUMENT';const pages=await documentPages({type:title,reference:j.reference,company:c,customer:{name:j.customer_name,phone:j.customer_phone},vehicle:{registration:j.registration,make:j.make,model:j.model},lines,detail:[j.damage,j.intake_notes,j.accessories].filter(Boolean).join(' | '),meta:[['Stage',cap(j.stage)],['Insurer',j.insurer||'—'],['Claim',j.claim_no||'—']],footer:`Prepared by: __________________ Customer signature: __________________ Date: ______________   ${c.terms||''}`,amounts:{total_cents:0,vat_cents:0,subtotal_cents:0}});saveBlob(pdfFromJpegs(pages),`${j.reference}-${type}`);toast('Document downloaded')}
initialize();
