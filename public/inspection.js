/* SULMOS26 Automotive V46 — job-bound 3D damage inspection. */
const el=id=>document.getElementById(id);
const panels={front_bumper:'Front bumper',rear_bumper:'Rear bumper',bonnet:'Bonnet',roof:'Roof',boot:'Boot / tailgate',left_front_fender:'Left front fender',right_front_fender:'Right front fender',left_front_door:'Left front door',right_front_door:'Right front door',left_rear_door:'Left rear door',right_rear_door:'Right rear door',left_rear_quarter:'Left rear quarter',right_rear_quarter:'Right rear quarter',left_headlamp:'Left headlamp',right_headlamp:'Right headlamp',left_tail_lamp:'Left tail lamp',right_tail_lamp:'Right tail lamp',windscreen:'Windscreen',rear_glass:'Rear glass'};
const colors={minor:'#f4c530',moderate:'#ff862b',severe:'#e12732',replace:'#852ca5'};
const S={jobs:[],job:null,vehicle:null,damage:[],revision:0,ready:false,three:null,renderer:null,scene:null,camera:null,controls:null,meshMap:{},model:null,modelIsExact:false,modelSource:'',vehicleColour:'#e8eaed',localFile:null,localFileFor:'',frames:[],activeAngle:0,previewType:'none',userRole:'',ownerFrames:[],photoReady:false,outlineView:'perspective'};
const esc=t=>String(t??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const msg=(text,bad=false)=>{el('status').textContent=text;el('status').style.color=bad?'#bf2638':'#536b7d'};
async function api(path,method='GET',data){const r=await fetch('/api/'+path,{credentials:'same-origin',method,headers:method==='GET'?{}:{'Content-Type':'application/json'},body:method==='GET'?undefined:JSON.stringify(data)});const b=await r.json().catch(()=>({}));if(!r.ok)throw Error(b.error||'Request failed');return b}
const safe=s=>String(s??'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const initialColour=name=>({white:'#f1f3f5',silver:'#bec3ca',black:'#272a30',red:'#be2530',blue:'#315eaa',grey:'#7e8894',gray:'#7e8894',green:'#4a806b',gold:'#a48b5d'}[safe(name)]||'#d9dee5');
// Vehicle preview assets: model key is make/model/year; owner-managed, tenant-scoped server-side.
const ANGLES=['front','front_left','left','rear_left','rear','rear_right','right','front_right','top'];
const angleTitle=k=>k.replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
function renderFrames(){
 const node=el('angleStrip');node.innerHTML=S.frames.map((f,i)=>`<button class="frame ${i===S.activeAngle?'active':''}" data-frame="${i}"><img src="${f.data}" alt="${angleTitle(f.angle)}"><b>${angleTitle(f.angle)}</b></button>`).join('');
 node.querySelectorAll('[data-frame]').forEach(b=>b.onclick=()=>activateFrame(+b.dataset.frame));
 const admin=el('assetFrames');admin.innerHTML=S.ownerFrames.map((f,i)=>`<div class="frame"><img src="${f.data}" alt="${angleTitle(f.angle)}"><b>${angleTitle(f.angle)}</b><button data-delete="${i}">Remove</button></div>`).join('');
 admin.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{S.ownerFrames.splice(+b.dataset.delete,1);renderFrames()});
}
function activateFrame(index){if(!S.frames.length)return;S.activeAngle=(index+S.frames.length)%S.frames.length;const f=S.frames[S.activeAngle];el('photoImage').src=f.data;el('angleLabel').textContent=angleTitle(f.angle);renderFrames()}
function showPhotoPack(){
 if(!S.frames.length)return false;
 if(S.renderer){S.animationId&&cancelAnimationFrame(S.animationId);S.observer?.disconnect();S.renderer.dispose();S.renderer.domElement?.remove();S.renderer=null}
 el('photoPreview').hidden=false;el('three').style.display='none';el('fallback').style.display='none';
 S.previewType='matching-photos';S.activeAngle=0;activateFrame(0);el('viewerTag').textContent='MATCHED PHOTO PACK';
 el('accuracy').textContent='Owner-provided photographs labelled '+[S.vehicle?.year,S.vehicle?.make,S.vehicle?.model].join(' ')+'. Verify the images match the vehicle generation and body style. Photo colour may differ from the selected colour. Angle controls switch photos; this is not a free-rotation 3D mesh.';
 msg('Vehicle photo preview loaded. Use arrows to switch angles, then mark damage.');return true;
}
async function loadAssetPack(){S.frames=[];S.ownerFrames=[];S.activeAngle=0;
 if(!S.vehicle)return;try{const data=await api('vehicle-preview-assets?model_key='+encodeURIComponent(modelKey()));S.frames=data.asset?.frames||[];S.ownerFrames=S.frames.map(x=>({...x}));renderFrames()}catch(e){msg('Asset library unavailable: '+e.message,true)}
}
function modelKey(){return S.vehicle?[S.vehicle.make,S.vehicle.model,S.vehicle.year].map(safe).join('/'):''}
async function compressVehiclePhoto(file){if(!file||!file.type.startsWith('image/'))throw Error('Please select a photo');
 const img=new Image(),url=URL.createObjectURL(file);await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});URL.revokeObjectURL(url);
 const canvas=document.createElement('canvas'),ratio=Math.min(1,1050/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
 for(let q=.76;q>=.19;q-=.11){const data=canvas.toDataURL('image/jpeg',q);if(data.length<175000)return data}throw Error('Image is too large; use a smaller photo')
}
function outlineType(){return el('bodyType').value==='auto'?window.SulmosOutline.kind(S.vehicle):el('bodyType').value}
function paintOutline(){
 if(S.previewType!=='body-drawing')return;
 const type=outlineType();el('outlineSvg').innerHTML=window.SulmosOutline.svg({type,view:S.outlineView,colour:S.vehicleColour,damage:S.damage});
 el('outlineViews').querySelectorAll('[data-outline-view]').forEach(button=>button.classList.toggle('active',button.dataset.outlineView===S.outlineView));
 el('outlineSvg').querySelectorAll('[data-panel]').forEach(node=>{
  const select=()=>{const id=node.getAttribute('data-panel');if(!panels[id])return;el('panel').value=id;msg('Selected '+panels[id]+'. Set severity and repair action, then click Save panel to assessment.')};
  node.addEventListener('click',select);node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select()}});
 });
}
function showDrawing(){
 if(!S.job||!S.vehicle)return msg('Choose a repair job first',true);
 if(S.renderer){S.animationId&&cancelAnimationFrame(S.animationId);S.observer?.disconnect();S.renderer.dispose();S.renderer.domElement?.remove();S.renderer=null}
 S.previewType='body-drawing';S.modelIsExact=false;S.model=null;
 el('three').style.display='none';el('photoPreview').hidden=true;el('drawingPreview').hidden=false;el('fallback').style.display='none';
 el('viewerTag').textContent='BODY-STYLE DRAWING';
 el('viewerDescription').textContent='Technical vehicle outline • click a panel • switch views';
 el('accuracy').textContent='Generic '+window.SulmosOutline.names[outlineType()]+' drawing. The drawing represents body type, not the exact '+[S.vehicle.year,S.vehicle.make,S.vehicle.model].filter(Boolean).join(' ')+'. Damaged panels and selected colour are recorded against the real repair job.';
 paintOutline();msg('Body-style drawing loaded. Select a panel and record damage.');
}
async function imageSnapshot(){let image=null;
 if(S.previewType==='matching-3d'&&S.renderer){image=S.renderer.domElement}
 else if(S.previewType==='body-drawing'){const svg=el('outlineSvg').querySelector('svg');if(svg){const xml=new XMLSerializer().serializeToString(svg);const pic=new Image();pic.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml);await pic.decode();image=pic}}
 else if(S.previewType==='matching-photos'&&S.frames[S.activeAngle]){const src=S.frames[S.activeAngle].data;const pic=new Image();pic.src=src;await pic.decode();image=pic}
 if(!image)return '';
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=540;const c=canvas.getContext('2d');c.fillStyle='#eff3f7';c.fillRect(0,0,900,540);
 const w=image.videoWidth||image.naturalWidth||image.width,h=image.videoHeight||image.naturalHeight||image.height;const factor=Math.min(880/w,510/h);c.drawImage(image,(900-w*factor)/2,(540-h*factor)/2,w*factor,h*factor);
 for(let q=.72;q>=.18;q-=.12){const data=canvas.toDataURL('image/jpeg',q);if(data.length<175000)return data}return '';
}

// V50: Welcome notice belongs ONLY to the standalone 3D Damage Inspection workspace.
// This script is never loaded on the main SULMOS26 Automotive dashboard.
function showInspectionWelcomeOnce(user){
 if(!user || document.getElementById('inspection-welcome-v50'))return;
 const key='sulmos26-inspection-welcome-v50-'+String(user.id||user.username||'staff');
 try{if(sessionStorage.getItem(key)==='seen')return}catch{}
 const name=String(user.name||user.username||'Team member').trim().split(/\s+/)[0]||'Team member';
 const overlay=document.createElement('div');overlay.id='inspection-welcome-v50';overlay.className='inspection-welcome-overlay';
 overlay.innerHTML=`<section class="inspection-welcome-card" role="dialog" aria-modal="true" aria-labelledby="iw50-title" aria-describedby="iw50-description" tabindex="-1">
  <button class="iw50-close" type="button" aria-label="Close welcome message">×</button>
  <div class="iw50-brand"><img src="/assets/icon-192.png" alt="SULMOS26"><span><strong>SULMOS26</strong><small>3D DAMAGE INSPECTION</small></span></div>
  <span class="iw50-emoji" aria-hidden="true">👋</span>
  <div class="iw50-eyebrow">A MESSAGE FROM TECHNICAL SUPPORT</div>
  <h2 id="iw50-title">Hi, ${esc(name)}!</h2>
  <p id="iw50-description">Welcome to <b>3D Damage Inspection</b>. This section is still new, and our technical support team is continuing to improve the vehicle drawings and previews.</p>
  <div class="iw50-note"><strong>🛠 Improvements in progress</strong><span>You can keep marking damaged panels and saving assessments to repair jobs while this inspection workspace is being refined.</span></div>
  <div class="iw50-support"><strong>For more information &amp; IT support</strong><span>IT Support Technician · Moses Moyana</span><a href="tel:+27614438789">☎ 061 443 8789</a><a href="mailto:moyanamoses006@icloud.com">✉ moyanamoses006@icloud.com</a></div>
  <button class="iw50-go" type="button">Continue to inspection</button>
  <small class="iw50-foot">Thank you for using SULMOS26 Automotive.</small>
 </section>`;
 document.body.append(overlay);
 const prior=document.activeElement;
 const done=()=>{try{sessionStorage.setItem(key,'seen')}catch{};document.removeEventListener('keydown',onKey);overlay.remove();if(prior?.isConnected&&typeof prior.focus==='function')prior.focus()};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();done()}else if(e.key==='Tab'){
  const buttons=[...overlay.querySelectorAll('button')],first=buttons[0],last=buttons[buttons.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }};
 overlay.querySelector('.iw50-close').onclick=done;
 overlay.querySelector('.iw50-go').onclick=done;
 document.addEventListener('keydown',onKey);
 overlay.querySelector('.iw50-go').focus();
}

async function start(){el('panel').innerHTML=Object.entries(panels).map(([v,n])=>`<option value="${v}">${n}</option>`).join('');try{const b=await api('bootstrap');S.userRole=b.user?.role||'';el('assetToggle').hidden=S.userRole!=='owner';if(!b.user){location.href='/';return}showInspectionWelcomeOnce(b.user);const j=await api('jobs');S.jobs=j.items||[];el('job').innerHTML='<option value="">Select repair job…</option>'+S.jobs.map(x=>`<option value="${esc(x.id)}">${esc(x.reference)} · ${esc(x.registration)} · ${esc(x.make)} ${esc(x.model)}</option>`).join('');const query=new URLSearchParams(location.search).get('job');if(query&&S.jobs.some(x=>x.id===query))el('job').value=query;await chooseJob()}catch(e){msg(e.message,true);if(e.message.includes('Sign in'))location.href='/'}
 el('job').addEventListener('change',chooseJob);el('load').onclick=showVehicle;el('bodyType').onchange=()=>{if(S.job)showDrawing()};el('outlineViews').querySelectorAll('button').forEach(b=>b.onclick=()=>{S.outlineView=b.dataset.outlineView;paintOutline()});
 el('previewMode').onchange=()=>{if(S.job){if(el('previewMode').value==='drawing')showDrawing();else msg('Mode changed. Click Show vehicle preview.')}};
 el('prevAngle').onclick=()=>activateFrame(S.activeAngle-1);el('nextAngle').onclick=()=>activateFrame(S.activeAngle+1);
 el('assetToggle').onclick=()=>{el('assetManager').hidden=!el('assetManager').hidden};
 el('assetAdd').onclick=async()=>{try{if(!S.vehicle)throw Error('Choose a job first');const file=el('angleFile').files[0];if(!file)throw Error('Choose an image');const frame={angle:el('angle').value,data:await compressVehiclePhoto(file)};S.ownerFrames=S.ownerFrames.filter(f=>f.angle!==frame.angle).concat(frame);S.ownerFrames.sort((a,b)=>ANGLES.indexOf(a.angle)-ANGLES.indexOf(b.angle));renderFrames();msg('View added. Click Save photo pack to publish it.')}catch(e){msg(e.message,true)}};
 el('assetSave').onclick=async()=>{try{if(S.userRole!=='owner')throw Error('Owner access required');const label=[S.vehicle.year,S.vehicle.make,S.vehicle.model].join(' ');await api('vehicle-preview-assets','PUT',{model_key:modelKey(),vehicle_label:label,frames:S.ownerFrames});await loadAssetPack();msg('Saved photo pack for '+label+'. Click Show vehicle preview.')}catch(e){msg(e.message,true)}};
 el('downloadPdf').onclick=downloadInspectionPdf;el('localModel').onchange=()=>{const f=el('localModel').files?.[0];if(!f)return;const target=exactPath();if(!target){msg('Select a repair job before loading a model.',true);return}if(!/\.glb$/i.test(f.name)||f.size>40*1024*1024){msg('Please select a matching GLB model under 40 MB.',true);el('localModel').value='';return}S.localFile=f;S.localFileFor=target;msg('Model selected for this session. Confirm the filename and licence, then click Load verified vehicle model.');};el('add').onclick=addDamage;el('save').onclick=save;el('print').onclick=()=>window.print();el('reset').onclick=()=>{if(S.previewType==='body-drawing'){S.outlineView='perspective';paintOutline();return}if(S.controls){S.controls.reset()}else if(S.camera){S.camera.position.set(7,5.5,8);S.camera.lookAt(0,0,0)}};el('colour').oninput=()=>{S.vehicleColour=el('colour').value;el('colourName').textContent=S.vehicleColour;repaint()};}
function exactPath(){return S.vehicle?'/vehicle-models/'+[S.vehicle.make,S.vehicle.model,S.vehicle.year].map(safe).join('/')+'.glb':''}
async function chooseJob(){const id=el('job').value;S.job=S.jobs.find(j=>j.id===id)||null;S.ready=false;S.localFile=null;S.localFileFor='';el('localModel').value='';S.damage=[];S.revision=0;S.vehicle=null;S.previewType='none';el('drawingPreview').hidden=true;el('drawingPreview').hidden=true;el('photoPreview').hidden=true;el('three').style.display='block';renderItems();if(!S.job){el('vehicle').textContent='Select a repair job';el('viewerTitle').textContent='Vehicle preview';msg('Choose a repair job to begin.');return}try{const data=await api('visual-assessment?job_id='+encodeURIComponent(id));S.vehicle=data.vehicle;S.damage=JSON.parse(data.assessment?.damage_json||'[]');S.revision=data.assessment?.revision||0;S.vehicleColour=data.assessment?.vehicle_colour||initialColour(S.vehicle?.colour);const htmlTitle=[S.vehicle?.year,S.vehicle?.make,S.vehicle?.model].filter(Boolean).join(' ');el('vehicle').textContent=`${htmlTitle} · ${S.vehicle?.registration||''}`;el('viewerTitle').textContent=htmlTitle+' · damage view';el('assetPath').textContent='Permanent model location: public'+exactPath()+' (must match the registered make, model, year and body style).';el('colour').value=/^#[\da-f]{6}$/i.test(S.vehicleColour)?S.vehicleColour:initialColour(S.vehicle?.colour);S.vehicleColour=el('colour').value;el('colourName').textContent=S.vehicle?.colour||S.vehicleColour;el('modelStatus').textContent=`Registered vehicle: ${htmlTitle}`;renderItems();await loadAssetPack();showDrawing();msg('Vehicle body-style drawing ready. Confirm the colour and mark damage.')}catch(e){msg(e.message,true)}}
function renderItems(){el('count').textContent=S.damage.length+' panel'+(S.damage.length===1?'':'s');el('items').innerHTML=S.damage.length?S.damage.map(d=>`<div class="item" style="border-left-color:${colors[d.severity]||'#ddd'}"><div><strong>${esc(panels[d.panel])}</strong><small>${esc(d.severity.toUpperCase())} · ${esc(d.action)}${d.note?' · '+esc(d.note):''}</small></div><button data-remove="${esc(d.panel)}" aria-label="Remove ${esc(panels[d.panel])}">×</button></div>`).join(''):'<div class="empty">No damaged panels marked</div>';el('items').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{S.damage=S.damage.filter(x=>x.panel!==b.dataset.remove);renderItems();repaint();msg('Unsaved changes. Click Save assessment.')});}
function addDamage(){if(!S.job)return msg('Select a job first',true);const panel=el('panel').value,severity=el('severity').value,action=el('action').value,note=el('note').value.trim().slice(0,500);S.damage=S.damage.filter(x=>x.panel!==panel);S.damage.push({panel,severity,action,note});el('note').value='';renderItems();repaint();msg('Panel added. Click Save assessment to store it on the repair job.');}
async function save(){if(!S.job)return msg('Select a job first',true);const button=el('save');button.disabled=true;try{const preview_data=await imageSnapshot();await api('visual-assessment','PUT',{job_id:S.job.id,revision:S.revision,vehicle_colour:S.vehicleColour,damage:S.damage,preview_data,preview_source:S.previewType});S.revision++;msg('Assessment saved securely to '+S.job.reference+'.');}catch(e){msg(e.message,true)}finally{button.disabled=false}}
function repaint(){if(S.previewType==='body-drawing')paintOutline();for(const [panel,meshes] of Object.entries(S.meshMap)){const record=S.damage.find(x=>x.panel===panel);for(const mesh of meshes){if(!mesh.material?.color)continue;mesh.material.color.set(record?colors[record.severity]:mesh.userData.baseColor||S.vehicleColour)}}if(S.modelIsExact&&S.model){S.model.traverse(mesh=>{if(mesh.isMesh&&mesh.userData.sulmosBody){const mat=mesh.material;if(mat?.color)mat.color.set(S.vehicleColour)}})}}
function addPanelMesh(THREE,group,panel,geometry,mat,pos,rot){const mesh=new THREE.Mesh(geometry,mat.clone());mesh.name=panel;mesh.position.set(...pos);if(rot)mesh.rotation.set(...rot);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.panel=panel;mesh.userData.baseColor=mat.color?.getStyle?.()||S.vehicleColour;group.add(mesh);(S.meshMap[panel]??=[]).push(mesh);return mesh}
async function showVehicle(){if(!S.job)return msg('Choose a job first',true);if(el('previewMode').value==='drawing'){showDrawing();return}if(el('previewMode').value==='photos'){if(!showPhotoPack())showDrawing();return}if(el('previewMode').value==='auto'&&!S.localFile&&S.frames.length){const check=await fetch(exactPath(),{method:'HEAD'}).catch(()=>null);if(!check?.ok){showPhotoPack();return}}el('drawingPreview').hidden=true;el('photoPreview').hidden=true;el('three').style.display='block';const button=el('load');button.disabled=true;el('fallback').style.display='grid';el('fallback').textContent='Loading the 3D vehicle viewer…';try{const THREE=await import('three');S.three=THREE;const target=el('three');if(S.renderer){S.animationId&&cancelAnimationFrame(S.animationId);S.observer?.disconnect();S.renderer.dispose();S.renderer=null;target.innerHTML=''}const scene=new THREE.Scene();scene.background=new THREE.Color('#d7e0e8');const camera=new THREE.PerspectiveCamera(40,Math.max(target.clientWidth,100)/Math.max(target.clientHeight,100),.1,100);camera.position.set(7,5.5,8);camera.lookAt(0,.8,0);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(target.clientWidth,target.clientHeight);renderer.shadowMap.enabled=true;target.append(renderer.domElement);scene.add(new THREE.HemisphereLight('#fff','#657788',2.7));const sun=new THREE.DirectionalLight('#fff',3.2);sun.position.set(4,8,6);sun.castShadow=true;scene.add(sun);const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#c9d3dd',roughness:.85}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);S.scene=scene;S.renderer=renderer;S.camera=camera;
 // V44: Display only matching installed or user-supplied assets. Never show generic blocks as a 2019 RAV4.
 const modelKey=[S.vehicle?.make,S.vehicle?.model,S.vehicle?.year].map(safe).join('/');
 const modelUrl='/vehicle-models/'+modelKey+'.glb';
 let model=null;let source='';
 try {
  const loaderModule=await import('three/addons/loaders/GLTFLoader.js');
  const loader=new loaderModule.GLTFLoader();
  if(S.localFile && S.localFileFor===modelUrl){
   const bytes=await S.localFile.arrayBuffer();
   const gltf=await new Promise((resolve,reject)=>loader.parse(bytes,'',resolve,reject));
   model=gltf.scene;source='local model (session only)';
  }else{
   const check=await fetch(modelUrl,{method:'GET',cache:'no-store'});
   if(check.ok && /model|octet-stream|gltf/i.test(check.headers.get('content-type')||'')){
    const bytes=await check.arrayBuffer();
    const gltf=await new Promise((resolve,reject)=>loader.parse(bytes,modelUrl.replace(/[^/]+$/,''),resolve,reject));
    model=gltf.scene;source=modelUrl;
   }
  }
 }catch(e){console.warn('Matching 3D vehicle model could not be loaded',e)}
 if(!model){
  renderer.dispose();renderer.domElement.remove();S.renderer=null;S.model=null;S.modelIsExact=false;
  el('viewerTag').textContent='MATCHING MODEL REQUIRED';
  el('accuracy').textContent='A matching '+[S.vehicle?.year,S.vehicle?.make,S.vehicle?.model].filter(Boolean).join(' ')+' GLB is not installed. No generic model is shown. Save damage using the panel register on the right, or load an appropriately licensed matching .glb.';
  el('fallback').style.display='grid';el('fallback').innerHTML='<div class="model-missing"><strong>No matching 3D model installed</strong><span>Choose a licensed model matching this vehicle and load its .glb file above. The damage assessment register remains operational.</span></div>';
  S.previewType='none';if(el('previewMode').value==='auto'&&showPhotoPack())return;showDrawing();
  return;
 }
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());
 if(!Number.isFinite(size.x)||Math.max(size.x,size.y,size.z)<.01)throw Error('Model geometry invalid');
 const scale=4.4/Math.max(size.x,size.z,.01);model.position.sub(centre.multiplyScalar(scale));model.position.y+=.83;model.scale.setScalar(scale);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;if(o.material)o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();const k=(o.name+' '+(Array.isArray(o.material)?'':o.material?.name||'')).toLowerCase();if(/paint|body|shell|panel/.test(k)&&o.material?.color)o.userData.sulmosBody=true}});
 scene.add(model);S.previewType='matching-3d';S.model=model;S.modelIsExact=true;S.modelSource=source;S.meshMap={};
 el('viewerTag').textContent='MATCHING 3D FILE LOADED';
 el('accuracy').textContent='3D asset loaded: '+source+'. Verify the actual trim and generation against the vehicle; model names alone do not guarantee a perfect match.';
 const canvas=renderer.domElement;let drag=false,lastX=0,lastY=0,az=Math.atan2(camera.position.x,camera.position.z),elev=.49,radius=11;function view(){camera.position.set(radius*Math.sin(az)*Math.cos(elev),Math.max(1.5,radius*Math.sin(elev)),radius*Math.cos(az)*Math.cos(elev));camera.lookAt(0,.85,0)}const down=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)},move=e=>{if(!drag)return;az-=(e.clientX-lastX)*.009;elev=Math.max(.15,Math.min(1.35,elev+(e.clientY-lastY)*.007));lastX=e.clientX;lastY=e.clientY;view()},up=()=>drag=false;canvas.onpointerdown=down;canvas.onpointermove=move;canvas.onpointerup=up;canvas.onpointercancel=up;canvas.onwheel=e=>{e.preventDefault();radius=Math.max(5.5,Math.min(18,radius+e.deltaY*.012));view()};el('reset').onclick=()=>{az=.75;elev=.49;radius=11;view()};
 {const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();canvas.addEventListener('click',e=>{const rect=canvas.getBoundingClientRect();pointer.x=(e.clientX-rect.left)/rect.width*2-1;pointer.y=-(e.clientY-rect.top)/rect.height*2+1;ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(model.children,true);const panel=hits.map(h=>h.object.userData.panel||safe(h.object.name).replaceAll('-','_')).find(p=>panels[p]);if(panel){el('panel').value=panel;msg('Selected '+panels[panel]+'. Choose damage details and Add.')}})}
 const observer=new ResizeObserver(()=>{if(!document.body.contains(target))return;const w=target.clientWidth,h=target.clientHeight;camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();renderer.setSize(w,h)});observer.observe(target);S.observer?.disconnect();S.observer=observer;S.animationId&&cancelAnimationFrame(S.animationId);function animate(){if(S.renderer!==renderer)return;S.animationId=requestAnimationFrame(animate);renderer.render(scene,camera)}animate();repaint();el('fallback').style.display='none';msg('Matching 3D model loaded. Inspect its accuracy and save damage against the repair job.');
 }catch(e){console.error(e);if(el('previewMode').value==='auto'&&showPhotoPack())return;showDrawing();return;el('fallback').style.display='grid';el('fallback').textContent='3D viewer unavailable. Damage panel register remains usable. Check your connection or browser WebGL support.';msg('3D viewer could not load; you can still record damage using the panel list.',true)}finally{button.disabled=false}}
function b64ToBytes(b64){const bin=atob(b64),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out}
function pdfFromJpegs(jpegs){const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;const add=x=>{const b=typeof x==='string'?enc.encode(x):x;parts.push(b);length+=b.length};const object=(n,stuff)=>{offsets[n]=length;add(`${n} 0 obj\n`);add(stuff);add('\nendobj\n')};add('%PDF-1.4\n');const pageCount=jpegs.length,first=3;object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,`<< /Type /Pages /Kids [${jpegs.map((_,i)=>`${first+i*3} 0 R`).join(' ')}] /Count ${pageCount} >>`);for(let i=0;i<pageCount;i++){const p=first+i*3,img=p+1,content=p+2,bytes=b64ToBytes(jpegs[i]);object(p,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i} ${img} 0 R >> >> /Contents ${content} 0 R >>`);offsets[img]=length;add(`${img} 0 obj\n<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');const s=`q\n595 0 0 842 0 0 cm\n/Im${i} Do\nQ\n`;object(content,`<< /Length ${enc.encode(s).length} >>\nstream\n${s}endstream`)}const xref=length;add(`xref\n0 ${first+pageCount*3}\n0000000000 65535 f \n`);for(let n=1;n<first+pageCount*3;n++)add(`${String(offsets[n]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${first+pageCount*3} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);const out=new Uint8Array(length);let o=0;for(const b of parts){out.set(b,o);o+=b.length}return new Blob([out],{type:'application/pdf'})}
function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name.replace(/[^A-Za-z0-9._-]/g,'_')+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}


// V45 downloadable customer-branded inspection report, including the saved vehicle image.
async function downloadInspectionPdf(){
 try{if(!S.job)throw Error('Select a repair job first');const info=await api('me'),c=info.company||{};
 const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;const x=canvas.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,1240,1754);
 x.fillStyle='#172637';x.fillRect(0,0,1240,13);x.fillStyle='#e9b127';x.fillRect(60,206,1120,5);
 const write=(t,px,py,size=24,bold=false,color='#253344')=>{x.font=(bold?'bold ':'')+size+'px Arial';x.fillStyle=color;x.fillText(String(t||''),px,py)};
 let logo=null;if(c.logo_data){logo=new Image();logo.src=c.logo_data;try{await logo.decode()}catch{logo=null}}
 if(logo){const scale=Math.min(205/logo.width,110/logo.height);x.drawImage(logo,65,58,logo.width*scale,logo.height*scale)}else{ x.strokeStyle='#d3dbe5';x.strokeRect(65,58,210,112);write('NO LOGO',114,112,20,true);write('UPLOADED',105,142,17)}
 write(c.trading_name||c.legal_name||'Automotive Workshop',313,85,32,true);write(c.address||'',313,123,18);write([c.phone,c.email].filter(Boolean).join('  |  '),313,155,18);
 x.fillStyle='#172637';x.fillRect(65,236,1110,103);write('VEHICLE DAMAGE ASSESSMENT',89,291,32,true,'#ffffff');
 write(S.job.reference,905,291,23,true,'#fff');write([S.vehicle.year,S.vehicle.make,S.vehicle.model].filter(Boolean).join(' '),70,389,23,true);
 write('Registration: '+S.vehicle.registration+'     Colour: '+S.vehicleColour,70,426,20);write('Image source: '+(S.previewType==='matching-3d'?'Matching 3D file':S.previewType==='matching-photos'?'Owner-provided photo pack':S.previewType==='body-drawing'?'Generic body-style technical drawing':'No image available'),70,457,18,false,'#687889');
 const snap=await imageSnapshot();if(snap){const im=new Image();im.src=snap;await im.decode();x.fillStyle='#f0f4f7';x.fillRect(70,492,1100,530);x.drawImage(im,158,500,925,516)}else{ x.fillStyle='#f4f6f8';x.fillRect(70,492,1100,420);write('No verified vehicle image has been attached.',120,685,25)}
 let y=snap?1090:986;write('DAMAGED PANELS & REPAIR ACTIONS',70,y,24,true);y+=48;
 for(const d of S.damage){if(y>1530)break;write((panels[d.panel]||d.panel)+'  ·  '+d.severity.toUpperCase()+'  ·  '+d.action,75,y,20,true);y+=26;let note=String(d.note||'');while(note.length){const segment=note.slice(0,105);write(segment,90,y,17);note=note.slice(105);y+=24;}y+=14}
 write('This report records observed damage, not final repair authorisation.',70,1665,17,false,'#64748b');write('Customer signature: _____________________    Inspector: _____________________',70,1699,18);
 const jpeg=canvas.toDataURL('image/jpeg',.9).split(',')[1];saveBlob(pdfFromJpegs([jpeg]),(S.job.reference||'JOB')+'-Damage-Assessment');msg('Damage assessment PDF downloaded.');
 }catch(e){msg(e.message,true)}
}

start();
