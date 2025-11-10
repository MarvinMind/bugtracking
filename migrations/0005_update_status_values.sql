-- Update status values from old to new names
-- Old: open, in_progress, resolved, closed
-- New: open, needs_testing, completed_testing, closed

-- First, update existing data
UPDATE issues SET status = 'needs_testing' WHERE status = 'in_progress';
UPDATE issues SET status = 'completed_testing' WHERE status = 'resolved';

-- Note: SQLite doesn't support modifying CHECK constraints on existing columns
-- The CHECK constraint will be enforced at the application level
