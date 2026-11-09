-- V45: optional company-owned 360° photo packs and job-specific PDF snapshot.
CREATE TABLE IF NOT EXISTS vehicle_preview_assets (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  model_key TEXT NOT NULL,
  vehicle_label TEXT NOT NULL,
  frame_json TEXT NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_at TEXT NOT NULL,
  UNIQUE(company_id,model_key)
);
CREATE INDEX IF NOT EXISTS idx_vehicle_assets_tenant_model ON vehicle_preview_assets(company_id,model_key);
ALTER TABLE visual_assessments ADD COLUMN preview_data TEXT NOT NULL DEFAULT '';
ALTER TABLE visual_assessments ADD COLUMN preview_source TEXT NOT NULL DEFAULT '';
