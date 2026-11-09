/* SULMOS26 V46 — Original scalable schematic vehicle drawings. No third-party car assets. */
(function(){
 const NS='http://www.w3.org/2000/svg';
 const TYPES=['suv','sedan','hatchback','pickup','van','wagon','coupe'];
 function kind(vehicle){
  const words=[vehicle?.body_type,vehicle?.bodyType,vehicle?.vehicle_type,vehicle?.model].filter(Boolean).join(' ').toLowerCase();
  if(/rav4|fortuner|tucson|sportage|cx-5|duster|x-trail|qashqai|everest|cr-v|suv|crossover|land cruiser|pajero|jimny|tiguan|t-roc|terios|rush/.test(words))return 'suv';
  if(/hilux|ranger|navara|amarok|d-max|kb\b|bakkie|pickup|triton|np200|np300/.test(words))return 'pickup';
  if(/quantum|hiace|transit|sprinter|panel van|van\b|minibus|komb(i|i bus)|crafter/.test(words))return 'van';
  if(/hatch|polo|golf|yaris|swift|i10|i20|picanto|fiesta|clio|baleno/.test(words))return 'hatchback';
  if(/wagon|estate/.test(words))return 'wagon';
  if(/coupe|coupé|mustang|86\b|brz/.test(words))return 'coupe';
  return 'sedan';
 }
 const names={suv:'SUV / Crossover',sedan:'Sedan',hatchback:'Hatchback',pickup:'Bakkie / Pickup',van:'Van / Minibus',wagon:'Station Wagon',coupe:'Coupe'};
 const configurations={
 suv:{roof:'M288 252 L348 159 Q359 143 380 143 L634 143 Q657 144 670 166 L732 252',windows:'M359 248 L392 161 L496 161 L496 248 Z M515 161 L625 161 L689 248 L515 248 Z',rear:844,front:165,back:164,door:515,boot:734},
 sedan:{roof:'M292 260 L369 184 Q382 171 400 171 L586 171 Q606 172 625 193 L702 260',windows:'M375 253 L402 191 L496 191 L496 253 Z M515 191 L584 191 L654 253 L515 253 Z',rear:846,front:163,back:172,door:515,boot:708},
 hatchback:{roof:'M308 259 L375 179 Q390 165 410 165 L613 165 Q641 165 669 208 L744 275',windows:'M377 250 L410 185 L515 185 L515 251 Z M533 185 L608 185 L682 259 L533 252 Z',rear:832,front:165,back:188,door:529,boot:754},
 pickup:{roof:'M293 257 L369 170 Q382 161 400 161 L540 161 Q568 165 578 257',windows:'M375 246 L402 184 L469 184 L469 249 Z M486 184 L534 184 L553 249 L486 249 Z',rear:861,front:161,back:180,door:576,boot:581},
 van:{roof:'M252 257 L277 144 Q282 126 305 126 L744 126 Q772 130 783 168 L799 257',windows:'M299 248 L309 151 L476 151 L476 248 Z M495 151 L609 151 L609 248 L495 248 Z M628 151 L735 151 L763 248 L628 248 Z',rear:841,front:161,back:194,door:602,boot:778},
 wagon:{roof:'M295 255 L354 159 Q365 149 388 149 L689 149 Q713 151 731 182 L776 258',windows:'M359 248 L393 171 L500 171 L500 248 Z M521 171 L671 171 L733 249 L521 248 Z',rear:840,front:163,back:181,door:523,boot:776},
 coupe:{roof:'M284 263 L394 190 Q421 176 461 176 L576 176 Q606 180 627 204 L697 263',windows:'M405 259 L461 194 L518 194 L518 257 Z M539 194 L576 194 L646 257 L539 257 Z',rear:847,front:162,back:179,door:612,boot:697}
 };
 function svg({type='suv',view='left',colour='#dce6ee',damage=[]}={}){
  if(!TYPES.includes(type))type='sedan'; if(!/^#[0-9a-f]{6}$/i.test(colour))colour='#dce6ee';
  const c=configurations[type], marks=Object.fromEntries(damage.map(d=>[d.panel,d.severity]));
  const severities={minor:'#f5d74d',moderate:'#fa9c40',severe:'#e9434a',replace:'#b45bd3'};
  function piece(panel,path,style=''){const fill=marks[panel]?(severities[marks[panel]]||'#ed5353'):colour;return `<path data-panel="${panel}" tabindex="0" role="button" aria-label="${panel.replaceAll('_',' ')}" d="${path}" fill="${fill}" stroke="#344959" stroke-width="2.2" stroke-linejoin="round" ${style}/>`}
  const start=`<svg class="sulmos-outline" xmlns="${NS}" viewBox="0 0 1000 520" role="img" aria-label="Generic ${names[type]} damage diagram, ${view} view"><defs><linearGradient id="bodyPaint" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#244058" stop-opacity=".1"/></linearGradient><linearGradient id="glass" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#d4e7f2"/><stop offset="1" stop-color="#8fa9bd"/></linearGradient></defs><rect width="1000" height="520" rx="18" fill="#f5f8fb"/><g stroke="#e2e9ef" stroke-width="1"><path d="M60 415H940 M60 105H940"/><path d="M140 60V460 M860 60V460" stroke-dasharray="5 9"/></g>`;
  const end=`<text x="55" y="482" fill="#77889a" font-size="16" font-family="Arial,sans-serif">SCHEMATIC ${names[type].toUpperCase()} · NOT A MAKE-SPECIFIC VEHICLE</text><text x="945" y="482" text-anchor="end" fill="#77889a" font-size="16" font-family="Arial,sans-serif">${view.toUpperCase()} VIEW · SELECT A PANEL</text></svg>`;
  const ring=(x,y)=>`<circle cx="${x}" cy="${y}" r="63" fill="#253342" stroke="#182838" stroke-width="9"/><circle cx="${x}" cy="${y}" r="38" fill="#bec9d2" stroke="#788896" stroke-width="4"/><circle cx="${x}" cy="${y}" r="17" fill="#e9eff4" stroke="#778899" stroke-width="2"/>`;
  if(['left','right'].includes(view)){
   const mirror=view==='right'?`transform="translate(1000 0) scale(-1 1)"`:'';
   const body=`M${c.front} 285 Q164 268 190 263 L287 252 ${c.roof.slice(c.roof.indexOf('L')>0?0:0)} L805 263 Q${c.rear} 267 ${c.rear} 302 L${c.rear} 352 Q${c.rear-4} 378 ${c.rear-20} 378 L${c.rear-90} 378 Q${c.rear-120} 292 ${c.rear-180} 378 L388 378 Q355 294 301 378 L199 378 Q163 372 ${c.front} 343 Z`;
   // Build external body as a continuous silhouette to prevent overlapping panels.
   let roof=c.roof.replace(/^M\d+ \d+ /,'');
   const outline=`M${c.front} 283 L287 255 ${roof} L${c.rear-8} 278 Q${c.rear+7} 286 ${c.rear} 316 L${c.rear} 370 L${c.rear-22} 382 L${c.front+16} 382 L${c.front} 360 Z`;
   let rearArea=type==='pickup'?`<path d="M600 258 H${c.rear-7} V365 H600 Z" fill="none" stroke="#364c5d" stroke-width="3"/>` : '';
   const leftParts=`${piece('bonnet','M173 276 L294 257 L294 310 L178 310 Z')}${piece('left_front_fender','M178 313 H365 V380 H178 Z')}${piece('left_front_door','M366 260 H515 V382 H366 Z')}${piece('left_rear_door',`M517 260 H${type==='pickup'?582:685} V382 H517 Z`)}${piece('left_rear_quarter',`M${type==='pickup'?583:687} 266 H835 V383 H${type==='pickup'?583:687} Z`)}${piece('boot',`M${type==='pickup'?584:742} 262 H841 V297 H${type==='pickup'?584:742} Z`)}${piece('roof',c.roof+' Z','opacity=".95"')}`;
   return start+`<g ${mirror}><ellipse cx="510" cy="403" rx="380" ry="30" fill="#dce5eb"/>${ring(325,379)}${ring(741,379)}<path d="${outline}" fill="${colour}" stroke="#273a49" stroke-width="5" stroke-linejoin="round"/>${leftParts}<path d="${c.windows}" fill="url(#glass)" stroke="#344b5c" stroke-width="5"/><path d="M498 171 V254" stroke="#344b5c" stroke-width="5"/>${rearArea}${piece('front_bumper','M161 327 H193 V370 H160 Z')}${piece('rear_bumper',`M${c.rear-14} 329 H${c.rear+10} V370 H${c.rear-15} Z`)}${piece('left_headlamp','M166 283 L192 280 L192 302 L164 303 Z')}${piece('left_tail_lamp',`M${c.rear-16} 278 H${c.rear+2} V307 H${c.rear-16} Z`)}<path d="M381 312 H402 M541 312 H559" stroke="#364e60" stroke-width="6" stroke-linecap="round"/><path d="M173 354 H834" stroke="#678097" stroke-width="3" opacity=".55"/></g>`+end;
  }
  if(view==='top'){
   const rearShape=type==='pickup'?'<rect x="550" y="150" width="260" height="222" rx="8" fill="#d6e1e9" stroke="#344b5c" stroke-width="5"/>':'', roofY=type==='van'?161:194;
   return start+`<ellipse cx="500" cy="279" rx="352" ry="125" fill="#e1e9ee"/>${piece('bonnet','M180 179 Q184 160 220 152 H343 V370 H220 Q184 361 180 342 Z')}${piece('roof',`M349 ${roofY} Q360 153 395 151 H648 Q673 157 681 187 V340 Q678 366 649 371 H395 Q359 365 349 335 Z`)}${piece('boot','M688 170 H805 Q828 184 829 215 V320 Q822 362 796 368 H688 Z')}${rearShape}${piece('left_front_fender','M204 126 H361 V171 H204 Z')}${piece('right_front_fender','M204 370 H361 V415 H204 Z')}${piece('left_front_door','M362 126 H517 V171 H362 Z')}${piece('right_front_door','M362 370 H517 V415 H362 Z')}${piece('left_rear_door','M519 126 H672 V171 H519 Z')}${piece('right_rear_door','M519 370 H672 V415 H519 Z')}${piece('front_bumper','M155 203 H184 V335 H155 Z')}${piece('rear_bumper','M831 202 H858 V335 H831 Z')}<path d="M388 194 H636 M388 335 H636" stroke="#455e71" stroke-width="3" opacity=".65"/><path d="M367 213 Q390 185 420 185 H607 Q641 188 655 213 V315 Q646 348 611 348 H416 Q383 346 367 313 Z" fill="url(#glass)" stroke="#445b6c" stroke-width="4" opacity=".77"/>`+end;
  }
  let front=view==='front';
  const lamps=front?['left_headlamp','right_headlamp']:['left_tail_lamp','right_tail_lamp'];
  return start+`<ellipse cx="500" cy="414" rx="290" ry="24" fill="#dae4eb"/><path d="M269 396 L267 268 Q278 224 324 223 L350 152 Q365 132 405 131 H595 Q637 135 650 152 L677 223 Q721 230 731 272 L733 396 Z" fill="${colour}" stroke="#32495a" stroke-width="5"/>${piece('roof','M358 150 Q390 129 420 130 H580 Q617 132 647 150 L634 172 H370 Z')}${piece(front?'windscreen':'rear_glass','M355 178 Q362 152 394 151 H607 Q637 154 648 178 L669 244 H332 Z')} ${piece(lamps[0],'M281 284 L382 273 L389 315 L277 330 Z')}${piece(lamps[1],'M618 273 L715 284 L723 330 L612 315 Z')}${piece(front?'front_bumper':'rear_bumper','M270 348 H732 V406 H270 Z')}<rect x="400" y="335" width="200" height="23" rx="8" fill="#364c5e"/><rect x="410" y="371" width="180" height="23" rx="6" fill="#eaf1f5" stroke="#344b5c" stroke-width="2"/><circle cx="293" cy="405" r="24" fill="#263745"/><circle cx="705" cy="405" r="24" fill="#263745"/>`+end;
 }
 window.SulmosOutline={svg,kind,names,TYPES};
})();
