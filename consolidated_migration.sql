-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Issues table (for bugs and feature requests)
CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('bug', 'feature')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  reported_by INTEGER NOT NULL,
  assigned_to INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issues_application_id ON issues(application_id);
CREATE INDEX IF NOT EXISTS idx_issues_reported_by ON issues(reported_by);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
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
-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user', 'viewer'));

-- Update existing admin user to have admin role
UPDATE users SET role = 'admin' WHERE username = 'admin';

-- Add permissions columns to users table
-- These will control what actions users can perform
ALTER TABLE users ADD COLUMN can_create_issues INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN can_edit_issues INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN can_delete_issues INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN can_resolve_issues INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN can_assign_issues INTEGER NOT NULL DEFAULT 1;

-- Set admin permissions (all true)
UPDATE users SET 
  can_create_issues = 1,
  can_edit_issues = 1,
  can_delete_issues = 1,
  can_resolve_issues = 1,
  can_assign_issues = 1
WHERE role = 'admin';

-- Set default user permissions
UPDATE users SET 
  can_create_issues = 1,
  can_edit_issues = 1,
  can_delete_issues = 0,
  can_resolve_issues = 0,
  can_assign_issues = 1
WHERE role = 'user';

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- Add screenshot column to issues table (stores base64 encoded image or URL)
ALTER TABLE issues ADD COLUMN screenshot TEXT;
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
-- Seed admin user
-- Insert default users (password is 'password123' hashed with a simple method for demo)
-- In production, use proper password hashing like bcrypt

-- Insert admin user with full permissions
INSERT OR IGNORE INTO users (id, username, password, email, full_name, role, can_create_issues, can_edit_issues, can_delete_issues, can_resolve_issues, can_assign_issues) VALUES 
  (1, 'admin', 'password123', 'admin@example.com', 'Admin User', 'admin', 1, 1, 1, 1, 1);

-- Insert regular users with standard permissions
INSERT OR IGNORE INTO users (id, username, password, email, full_name, role, can_create_issues, can_edit_issues, can_delete_issues, can_resolve_issues, can_assign_issues) VALUES 
  (2, 'john', 'password123', 'john@example.com', 'John Doe', 'user', 1, 1, 0, 0, 1),
  (3, 'jane', 'password123', 'jane@example.com', 'Jane Smith', 'user', 1, 1, 0, 0, 1),
  (4, 'bob', 'password123', 'bob@example.com', 'Bob Johnson', 'user', 1, 1, 0, 0, 1),
  (5, 'alice', 'password123', 'alice@example.com', 'Alice Williams', 'user', 1, 1, 0, 0, 1);

-- Insert sample issues (now with application_name as free text)
INSERT OR IGNORE INTO issues (application_name, affected_area, title, description, type, status, priority, reported_by, assigned_to, expected_completion_date) VALUES 
  ('Web Portal', 'Login page - Chrome browser', 'Login button not working on Chrome', 'Users report that the login button is unresponsive on Chrome browser version 120+', 'bug', 'open', 'high', 1, 2, '2025-11-05'),
  ('Web Portal', 'User Interface', 'Add dark mode support', 'Users have requested a dark mode theme option', 'feature', 'open', 'medium', 3, NULL, '2025-11-15'),
  ('Mobile App', 'iOS version', 'App crashes on iOS 17', 'Mobile app crashes immediately after launch on iOS 17 devices', 'bug', 'in_progress', 'critical', 2, 4, '2025-11-01'),
  ('Mobile App', 'Notifications', 'Implement push notifications', 'Add push notification support for important updates', 'feature', 'open', 'high', 1, 5, '2025-11-20'),
  ('Admin Dashboard', 'Performance', 'Dashboard loading slowly', 'Admin dashboard takes 10+ seconds to load with large datasets', 'bug', 'resolved', 'medium', 4, 2, '2025-10-30'),
  ('API Gateway', 'Rate limiting', 'API rate limiting needed', 'Implement rate limiting to prevent API abuse', 'feature', 'in_progress', 'high', 1, 3, '2025-11-10');
