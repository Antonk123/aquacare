CREATE TABLE IF NOT EXISTS water_changes (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  tub_id TEXT REFERENCES tubs(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_water_changes_facility ON water_changes(facility_id);
