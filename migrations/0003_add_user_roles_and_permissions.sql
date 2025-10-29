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
