-- Update status values from old to new names
-- Old: open, in_progress, resolved, closed
-- New: open, needs_testing, completed_testing, closed

-- Create new table with updated CHECK constraint
CREATE TABLE issues_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_name TEXT NOT NULL,
  affected_area TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('bug', 'feature')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'needs_testing', 'completed_testing', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  reported_by INTEGER NOT NULL,
  assigned_to INTEGER,
  expected_completion_date DATE,
  screenshot TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Copy data with status value conversion
INSERT INTO issues_new 
SELECT 
  id, application_name, affected_area, title, description, type,
  CASE 
    WHEN status = 'in_progress' THEN 'needs_testing'
    WHEN status = 'resolved' THEN 'completed_testing'
    ELSE status
  END as status,
  priority, reported_by, assigned_to, expected_completion_date, screenshot,
  created_at, updated_at
FROM issues;

-- Drop old table and rename new one
DROP TABLE issues;
ALTER TABLE issues_new RENAME TO issues;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_issues_application_name ON issues(application_name);
CREATE INDEX IF NOT EXISTS idx_issues_reported_by ON issues(reported_by);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_expected_completion_date ON issues(expected_completion_date);
