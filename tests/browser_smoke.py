from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate('''() => {
 window.fetch=async function(path, opts){const key=String(path).split('/api/')[1]?.split('?')[0]||'';const c={id:'co',trading_name:'Demo Auto Body Repairs',legal_name:'Demo Auto Body Repairs Pty Ltd',vat_mode:'non_vat',phone:'011 123 4567',email:'office@example.com',address:'123 Main Street, Johannesburg',logo_data:''};let d={ok:true};
 if(key==='bootstrap')d={setup_required:false,user:{id:'u',name:'Workshop Owner',role:'owner',company_id:'co'}};
 else if(key==='me')d={user:{id:'u',name:'Workshop Owner',role:'owner',username:'owner'},company:c};
 else if(['customers','vehicles','jobs','estimates','invoices','users'].includes(key))d={items:[]};
 else if(key==='reports')d={jobs:{n:0},estimates:{v:0},invoices:{v:0,outstanding:0},payments:{v:0},stages:[],technicians:[]};
 return {ok:true,json:async()=>d,status:200};};
 }''')
 css=(root/'public/styles.css').read_text();html=(root/'public/index.html').read_text();html=html.replace('<link rel="stylesheet" href="/styles.css?v=37-1">','<style>'+css+'</style>')
 html=html.replace('<script type="module" src="/app.js?v=37-1"></script>','')
 page.set_content(html,wait_until='domcontentloaded')
 page.add_script_tag(content=(root/'public/app.js').read_text())
 page.get_by_text('Workshop overview').wait_for(timeout=10000)
 page.screenshot(path=str(root/'preview-desktop.png'),full_page=True)
 page.get_by_role('button',name='Invoices').first.click()
 assert page.get_by_text('Customer invoices').count()==1
 page.get_by_role('button',name='Company Branding').first.click()
 assert page.get_by_text('Company / Workshop details').count()==1
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path=str(root/'preview-mobile.png'),full_page=True)
 assert not errors,errors
 b.close()
 print('Desktop, mobile, invoice and company branding browser smoke tests PASSED')
