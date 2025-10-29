-- Insert default users (password is 'password123' hashed with a simple method for demo)
-- In production, use proper password hashing like bcrypt
INSERT OR IGNORE INTO users (id, username, password, email, full_name) VALUES 
  (1, 'admin', 'password123', 'admin@example.com', 'Admin User'),
  (2, 'john', 'password123', 'john@example.com', 'John Doe'),
  (3, 'jane', 'password123', 'jane@example.com', 'Jane Smith'),
  (4, 'bob', 'password123', 'bob@example.com', 'Bob Johnson'),
  (5, 'alice', 'password123', 'alice@example.com', 'Alice Williams');

-- Insert sample applications
INSERT OR IGNORE INTO applications (id, name, description) VALUES 
  (1, 'Web Portal', 'Main customer-facing web application'),
  (2, 'Mobile App', 'iOS and Android mobile application'),
  (3, 'Admin Dashboard', 'Internal admin management dashboard'),
  (4, 'API Gateway', 'Backend API service');

-- Insert sample issues
INSERT OR IGNORE INTO issues (application_id, title, description, type, status, priority, reported_by, assigned_to) VALUES 
  (1, 'Login button not working on Chrome', 'Users report that the login button is unresponsive on Chrome browser version 120+', 'bug', 'open', 'high', 1, 2),
  (1, 'Add dark mode support', 'Users have requested a dark mode theme option', 'feature', 'open', 'medium', 3, NULL),
  (2, 'App crashes on iOS 17', 'Mobile app crashes immediately after launch on iOS 17 devices', 'bug', 'in_progress', 'critical', 2, 4),
  (2, 'Implement push notifications', 'Add push notification support for important updates', 'feature', 'open', 'high', 1, 5),
  (3, 'Dashboard loading slowly', 'Admin dashboard takes 10+ seconds to load with large datasets', 'bug', 'resolved', 'medium', 4, 2),
  (4, 'API rate limiting needed', 'Implement rate limiting to prevent API abuse', 'feature', 'in_progress', 'high', 1, 3);
