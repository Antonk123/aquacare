CREATE TABLE IF NOT EXISTS water_logs (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tub_id TEXT REFERENCES tubs(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  note TEXT,
  ph REAL,
  free_chlorine REAL,
  bromine REAL,
  total_alkalinity REAL,
  calcium_hardness REAL,
  tds REAL,
  water_temp REAL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_date TEXT
);

CREATE TABLE IF NOT EXISTS schedule_completions (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  UNIQUE(facility_id, task_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_water_logs_facility ON water_logs(facility_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(date);
CREATE INDEX IF NOT EXISTS idx_notes_facility ON notes(facility_id);
CREATE INDEX IF NOT EXISTS idx_schedule_facility_period ON schedule_completions(facility_id, period_key);
