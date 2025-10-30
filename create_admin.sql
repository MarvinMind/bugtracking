-- Create admin user for production
INSERT INTO users (username, password, email, full_name, role, 
  can_create_issues, can_edit_issues, can_delete_issues, can_resolve_issues, can_assign_issues) 
VALUES ('admin', 'password123', 'admin@renoirconsulting.com', 'Admin User', 'admin', 1, 1, 1, 1, 1);
