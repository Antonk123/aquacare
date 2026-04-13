ALTER TABLE schedule_completions ADD COLUMN tub_id TEXT REFERENCES tubs(id) ON DELETE SET NULL;
