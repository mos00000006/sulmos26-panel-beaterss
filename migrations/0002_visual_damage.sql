-- SULMOS26 Automotive V43: job-scoped, company-isolated visual damage records.
CREATE TABLE IF NOT EXISTS visual_assessments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  job_id TEXT NOT NULL REFERENCES jobs(id),
  vehicle_colour TEXT NOT NULL DEFAULT 'White',
  vehicle_model_key TEXT NOT NULL DEFAULT '',
  damage_json TEXT NOT NULL DEFAULT '[]',
  revision INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(company_id,job_id)
);
CREATE INDEX IF NOT EXISTS idx_visual_assessment_company_job ON visual_assessments(company_id,job_id);
