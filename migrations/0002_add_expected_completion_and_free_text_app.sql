-- Add expected_completion_date and affected_area to issues table
ALTER TABLE issues ADD COLUMN expected_completion_date DATE;
ALTER TABLE issues ADD COLUMN affected_area TEXT;

-- Migrate existing application_id to application_name (text field)
-- First, let's add the new column
ALTER TABLE issues ADD COLUMN application_name TEXT;

-- Copy application names from applications table to issues
UPDATE issues 
SET application_name = (SELECT name FROM applications WHERE applications.id = issues.application_id);

-- Create a temporary table to store the modified issues structure
CREATE TABLE issues_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_name TEXT NOT NULL,
  affected_area TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('bug', 'feature')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  reported_by INTEGER NOT NULL,
  assigned_to INTEGER,
  expected_completion_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Copy data from old table to new table
INSERT INTO issues_new (id, application_name, title, description, type, status, priority, reported_by, assigned_to, created_at, updated_at)
SELECT id, application_name, title, description, type, status, priority, reported_by, assigned_to, created_at, updated_at
FROM issues;

-- Drop old table
DROP TABLE issues;

-- Rename new table to issues
ALTER TABLE issues_new RENAME TO issues;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_issues_application_name ON issues(application_name);
CREATE INDEX IF NOT EXISTS idx_issues_reported_by ON issues(reported_by);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_expected_completion_date ON issues(expected_completion_date);

-- Drop applications table as it's no longer needed
DROP TABLE applications;
