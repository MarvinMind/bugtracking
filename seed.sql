-- Insert default users (password is 'password123' hashed with a simple method for demo)
-- In production, use proper password hashing like bcrypt
INSERT OR IGNORE INTO users (id, username, password, email, full_name) VALUES 
  (1, 'admin', 'password123', 'admin@example.com', 'Admin User'),
  (2, 'john', 'password123', 'john@example.com', 'John Doe'),
  (3, 'jane', 'password123', 'jane@example.com', 'Jane Smith'),
  (4, 'bob', 'password123', 'bob@example.com', 'Bob Johnson'),
  (5, 'alice', 'password123', 'alice@example.com', 'Alice Williams');

-- Insert sample issues (now with application_name as free text)
INSERT OR IGNORE INTO issues (application_name, affected_area, title, description, type, status, priority, reported_by, assigned_to, expected_completion_date) VALUES 
  ('Web Portal', 'Login page - Chrome browser', 'Login button not working on Chrome', 'Users report that the login button is unresponsive on Chrome browser version 120+', 'bug', 'open', 'high', 1, 2, '2025-11-05'),
  ('Web Portal', 'User Interface', 'Add dark mode support', 'Users have requested a dark mode theme option', 'feature', 'open', 'medium', 3, NULL, '2025-11-15'),
  ('Mobile App', 'iOS version', 'App crashes on iOS 17', 'Mobile app crashes immediately after launch on iOS 17 devices', 'bug', 'in_progress', 'critical', 2, 4, '2025-11-01'),
  ('Mobile App', 'Notifications', 'Implement push notifications', 'Add push notification support for important updates', 'feature', 'open', 'high', 1, 5, '2025-11-20'),
  ('Admin Dashboard', 'Performance', 'Dashboard loading slowly', 'Admin dashboard takes 10+ seconds to load with large datasets', 'bug', 'resolved', 'medium', 4, 2, '2025-10-30'),
  ('API Gateway', 'Rate limiting', 'API rate limiting needed', 'Implement rate limiting to prevent API abuse', 'feature', 'in_progress', 'high', 1, 3, '2025-11-10');
