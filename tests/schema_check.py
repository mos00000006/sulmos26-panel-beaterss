from pathlib import Path
import sqlite3
s=Path(__file__).resolve().parents[1]/'migrations/0001_panel_beater_core.sql'
c=sqlite3.connect(':memory:');c.executescript(s.read_text());
for t in ('companies','users','customers','vehicles','jobs','job_events','photos','sequences','estimates','estimate_lines','invoices','invoice_lines','payments','audit'):
 assert c.execute("SELECT count(*) FROM sqlite_master WHERE name=?",(t,)).fetchone()[0]==1,t
c.execute("INSERT INTO companies (id,legal_name,trading_name,created_at) VALUES('A','A Repairs','A','2026-11-08')")
c.execute("INSERT INTO companies (id,legal_name,trading_name,created_at) VALUES('B','B Repairs','B','2026-11-08')")
c.execute("INSERT INTO users (id,company_id,name,username,password_salt,password_hash,role,created_at) VALUES('U','A','A','aaa','salt','hash','owner','2026-11-08')")
c.execute("INSERT INTO customers (id,company_id,name,created_at) VALUES('C','A','A Customer','2026-11-08')")
assert c.execute('SELECT COUNT(*) FROM customers WHERE company_id=?',('B',)).fetchone()[0]==0
c.execute("INSERT INTO vehicles (id,company_id,customer_id,registration,created_at) VALUES('V','A','C','ABC123','2026-11-08')")
c.execute("INSERT INTO jobs (id,company_id,customer_id,vehicle_id,reference,created_by,received_at) VALUES('J','A','C','V','JOB-000001','U','2026-11-08')")
c.execute("INSERT INTO estimates (id,company_id,job_id,reference,created_by,created_at,status,total_cents) VALUES('E','A','J','EST-000001','U','2026-11-08','approved',25000)")
c.execute("INSERT INTO invoices (id,company_id,estimate_id,job_id,reference,subtotal_cents,vat_cents,total_cents,issued_at,issued_by) VALUES('I','A','E','J','INV-000001',25000,0,25000,'2026-11-08','U')")
try:
 c.execute("INSERT INTO invoices (id,company_id,estimate_id,job_id,reference,subtotal_cents,vat_cents,total_cents,issued_at,issued_by) VALUES('I2','A','E','J','INV-000002',25000,0,25000,'2026-11-08','U')")
 assert False,'duplicate estimate invoice was not blocked'
except sqlite3.IntegrityError: pass
print('SQLite schema, company scoping and duplicate invoice constraint checks passed')
