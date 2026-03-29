-- PART 1: Create Tables and Initial Schema
-- Copy and paste this entire script into the Cloudflare D1 Console

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user', 'viewer')),
  can_create_issues INTEGER NOT NULL DEFAULT 1,
  can_edit_issues INTEGER NOT NULL DEFAULT 1,
  can_delete_issues INTEGER NOT NULL DEFAULT 0,
  can_resolve_issues INTEGER NOT NULL DEFAULT 0,
  can_assign_issues INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
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

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_issues_application_name ON issues(application_name);
CREATE INDEX IF NOT EXISTS idx_issues_reported_by ON issues(reported_by);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_expected_completion_date ON issues(expected_completion_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Insert admin user
INSERT INTO users (username, password, email, full_name, role, can_create_issues, can_edit_issues, can_delete_issues, can_resolve_issues, can_assign_issues) VALUES 
  ('admin', 'password123', 'admin@example.com', 'Admin User', 'admin', 1, 1, 1, 1, 1);
