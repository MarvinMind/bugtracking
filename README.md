# bugs2fixes - Issue Tracker

A comprehensive bug and feature tracking application built with Hono framework and Cloudflare D1 database, designed for teams to track issues across multiple applications.

## 🌐 Live Demo

**Production URL**: https://bugs2fixes.pages.dev  
**GitHub Repository**: https://github.com/MarvinMind/bugtracking

## ✨ Features

### Currently Completed Features

✅ **User Authentication**
- Secure login/logout with session management
- Session-based authentication using Cloudflare D1
- Admin user pre-configured (email: keith.symondson@renoirgroup.com)

✅ **Role-Based Access Control**
- Three roles: Admin, User, Viewer
- Granular permissions system:
  - can_create_issues
  - can_edit_issues
  - can_delete_issues
  - can_resolve_issues
  - can_assign_issues
- Permission-based UI (buttons only shown if user has permission)

✅ **Admin Panel** (Admin users only)
- Create new users with custom permissions
- Edit user roles and permissions
- Delete users (with safety checks for users with issues)
- Toggle individual permissions per user

✅ **Profile Settings**
- Update email and full name
- Change password with current password verification
- Password strength requirements (minimum 6 characters)

✅ **Issue Management**
- Create, read, update, and delete issues
- Support for both bugs and feature requests
- Real-time statistics dashboard

✅ **Issue Classification**
- **Types**: Bug, Feature
- **Status**: Open, Needs to Be Tested, Completed Testing, Closed
- **Priority**: Low, Medium, High, Critical

✅ **Application Management**
- Free-form text input for application names
- Auto-suggest from existing applications
- Filterable by application name
- **Affected Area**: Specify which part of the application is not working

✅ **Expected Completion Date**
- Set target completion dates for issues
- Track deadlines and milestones
- Filter and sort by expected completion

✅ **User Assignment**
- Assign issues to team members
- Track reporter and assignee
- View who created each issue

✅ **Advanced Filtering**
- Filter by application, status, type, priority, and assigned user
- Real-time filter updates
- Comprehensive issue listing

✅ **Statistics Dashboard (6 Cards)**
- Total issues count
- Open issues tracking
- Needs to Be Tested tracking
- Completed Testing tracking
- Closed issues tracking
- Critical issues highlighting

✅ **Screenshot Support**
- Upload screenshots (up to 2MB) when creating/editing issues
- View full-size screenshots by clicking thumbnails
- Base64 encoding for direct database storage

## 📋 Functional URIs

### Authentication Endpoints
- `POST /api/auth/login` - User login (body: `{username, password}`)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info with role and permissions

### Profile Management Endpoints
- `PUT /api/profile` - Update user profile (body: `{email, full_name}`)
- `PUT /api/profile/password` - Change password (body: `{current_password, new_password}`)

### Admin Endpoints (Admin Role Required)
- `GET /api/admin/users` - List all users with roles and permissions
- `POST /api/admin/users` - Create new user (body: `{username, password, email, full_name, role, permissions}`)
- `PUT /api/admin/users/:id` - Update user role and permissions
- `DELETE /api/admin/users/:id` - Delete user (checks for associated issues)

### Issue Management Endpoints
- `GET /api/issues` - List all issues (supports query params: `application_name`, `status`, `type`, `priority`, `assigned_to`)
- `GET /api/issues/:id` - Get single issue details
- `POST /api/issues` - Create new issue (body: `{application_name, affected_area, title, description, type, priority, assigned_to, expected_completion_date, screenshot}`)
- `PUT /api/issues/:id` - Update issue (body: `{application_name, affected_area, title, description, status, priority, assigned_to, expected_completion_date, screenshot}`)
- `DELETE /api/issues/:id` - Delete issue

### Application & User Endpoints
- `GET /api/applications` - List distinct application names from existing issues
- `GET /api/users` - List all users
- `GET /api/stats` - Get statistics summary

### Static Pages
- `GET /` - Main application page
- `GET /static/app.js` - Frontend JavaScript

## 🚀 Features Not Yet Implemented

- [ ] **Comments/Activity Log**: Add comment threads to issues
- [ ] **Multiple File Attachments**: Upload multiple files to issues (currently supports 1 screenshot)
- [ ] **Email Notifications**: Send notifications when assigned or status changes
- [ ] **Custom Fields**: Allow custom fields per application
- [ ] **Search Functionality**: Full-text search across issues
- [ ] **Export Reports**: Export issues to CSV/PDF
- [ ] **User Roles**: Admin/User/Viewer role permissions
- [ ] **API Keys**: Generate API keys for external integrations
- [ ] **Tags/Labels**: Add custom tags to issues
- [ ] **Time Tracking**: Track time spent on issues
- [ ] **Issue Templates**: Pre-defined templates for common issues
- [ ] **Duplicate Detection**: Detect and link duplicate issues

## 🎯 Recommended Next Steps

1. **Deploy to Production**: Deploy to Cloudflare Pages for public access
2. **Add Comments System**: Implement issue comments and activity log
3. **File Upload**: Add support for screenshot/file attachments using Cloudflare R2
4. **Email Notifications**: Integrate email service for issue updates
5. **Enhanced Security**: Implement proper password hashing (bcrypt)
6. **Search Feature**: Add full-text search across issues
7. **Export Functionality**: Add CSV/PDF export for reporting
8. **Mobile Responsiveness**: Optimize UI for mobile devices

## 📊 Data Architecture

### Data Models

**Users Table**
- `id` (Primary Key)
- `username` (Unique)
- `password` (Currently plain text - needs bcrypt in production)
- `email` (Unique)
- `full_name`
- `role` (admin/user/viewer)
- `can_create_issues` (Boolean)
- `can_edit_issues` (Boolean)
- `can_delete_issues` (Boolean)
- `can_resolve_issues` (Boolean)
- `can_assign_issues` (Boolean)
- `created_at`, `updated_at`

**Issues Table**
- `id` (Primary Key)
- `application_name` (Free-form text)
- `affected_area` (Free-form text, nullable - which part of app isn't working)
- `title`
- `description`
- `type` (bug/feature)
- `status` (open/needs_testing/completed_testing/closed)
- `priority` (low/medium/high/critical)
- `reported_by` (Foreign Key → Users)
- `assigned_to` (Foreign Key → Users, nullable)
- `expected_completion_date` (Date, nullable)
- `screenshot` (Base64 encoded image, nullable, max 2MB)
- `created_at`, `updated_at`

**Sessions Table**
- `id` (Primary Key, UUID)
- `user_id` (Foreign Key → Users)
- `expires_at`
- `created_at`

### Storage Services

**Cloudflare D1 Database**
- SQLite-based globally distributed database
- Stores all user data, applications, issues, and sessions
- Local development uses `.wrangler/state/v3/d1` for testing
- Production uses Cloudflare D1 (database ID: `0f315142-4927-4f6b-9951-68b6006a0b25`)
- Database name: `renoir-bug-tracker-production`

### Data Flow

1. **Authentication Flow**:
   - User submits credentials → Backend validates against D1 users table
   - On success, creates session in D1 sessions table
   - Returns secure HTTP-only cookie with session ID
   - All subsequent requests include session cookie for authentication

2. **Issue Creation Flow**:
   - User types application name (with auto-suggest) → Specifies affected area
   - User sets expected completion date → Frontend sends to `/api/issues`
   - Backend validates session → Inserts into D1 issues table
   - Returns created issue → Frontend refreshes issue list

3. **Filtering Flow**:
   - User types/selects application filter → Frontend builds query parameters
   - Backend queries D1 with WHERE clauses → Returns filtered results
   - Frontend updates table display with affected areas and completion dates

## 👥 User Guide

### Getting Started

1. **Login**:
   - Navigate to the application URL
   - Use the admin account:
     - Username: `admin`
     - Password: `password123`
     - Email: keith.symondson@renoirgroup.com

2. **View Dashboard**:
   - After login, see 6 statistics cards showing:
     - Total Issues, Open Issues, Needs to Be Tested
     - Completed Testing, Closed Issues, Critical Issues
   - View the main issues table with all tracked bugs and features

3. **Filter Issues**:
   - Use the filter options to narrow down issues:
     - **Application**: Type to filter by application name (auto-suggest)
     - **Status**: Filter by issue status (Open, Needs to Be Tested, Completed Testing, Closed)
     - **Type**: Show only bugs or features
     - **Priority**: Filter by priority level
     - **Assigned To**: Filter by assigned user

4. **Create New Issue**:
   - Click "New Issue" button
   - Fill in the form:
     - **Application Name**: Type any application name (auto-suggests from existing)
     - **Affected Area**: Specify which part isn't working (e.g., "Login page", "Payment module")
     - Choose type (Bug or Feature)
     - Enter title and description
     - **Upload Screenshot**: Attach a screenshot (optional, max 2MB)
     - Set priority level
     - **Expected Completion Date**: Set target completion date
     - Optionally assign to a team member
   - Click "Create Issue"

5. **Edit Issue**:
   - Click the edit icon (pencil) on any issue
   - Update application name, affected area, and expected completion date as needed
   - Update title, description, status, priority, or assignee
   - **View/Replace Screenshot**: Click existing screenshot to view full-size, or upload new one
   - Click "Save Changes"

6. **View Screenshots**:
   - Click the camera icon next to issue title in the table
   - Or click the thumbnail when editing an issue
   - Full-size screenshot opens in a modal

7. **Delete Issue**:
   - Click the delete icon (trash) on any issue
   - Confirm deletion

8. **Manage Users** (Admin only):
   - Click "Admin" tab in navigation
   - Create new users with specific roles and permissions
   - Edit existing users to modify permissions
   - Delete users (system prevents deletion if user has associated issues)

9. **Update Profile**:
   - Click "Profile" tab in navigation
   - Update your email and full name
   - Change your password securely
   - View your role and permissions

10. **Track Progress**:
   - Monitor statistics cards for quick overview
   - Update issue status as work progresses
   - Use priority levels to organize work

## 🛠️ Tech Stack

- **Backend**: Hono v4.10.3 (Lightweight web framework)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **Build Tool**: Vite v6.4.1
- **Deployment**: Cloudflare Pages + Workers
- **Process Manager**: PM2 (for local development)

## 📦 Deployment

### Deployment Status
- ✅ Deployed to Cloudflare Pages
- ✅ Production D1 database configured
- ✅ GitHub repository integrated

### Local Development

```bash
# Install dependencies
npm install

# Apply database migrations
npm run db:migrate:local

# Seed database with sample data
npm run db:seed

# Build the project
npm run build

# Start development server
pm2 start ecosystem.config.cjs

# View logs
pm2 logs webapp --nostream

# Stop server
pm2 delete webapp
```

### Production Deployment

**Automated Deployment (Recommended):**
```bash
# Deploy to production (uses custom deploy.sh script)
npm run deploy

# The deploy.sh script:
# - Builds the project
# - Creates deployment package
# - Deploys via Cloudflare API (bypasses wrangler account issues)
# - Shows deployment URL

# Note: Requires CLOUDFLARE_API_TOKEN environment variable
# Already set in this environment: export CLOUDFLARE_API_TOKEN='your-token'
```

**Manual Deployment (if needed):**
```bash
# Apply migrations to production database (one-time setup)
npm run db:migrate:prod

# Build and deploy
npm run build
./deploy.sh
```

## 🔒 Security Notes

⚠️ **Important**: This is a demo application with simplified security:
- Passwords are stored in plain text
- **For production use**: Implement proper password hashing (bcrypt, argon2)
- **For production use**: Add rate limiting on authentication endpoints
- **For production use**: Implement CSRF protection
- **For production use**: Use environment variables for sensitive configuration

## 📝 Database Management

```bash
# Reset local database (WARNING: Deletes all data)
npm run db:reset

# Execute SQL queries locally
npm run db:console:local

# Execute SQL queries on production
npm run db:console:prod
```

## 🎨 Design

**Color Palette:**
- Primary CTA: Green `#7CB342` (bg-green-600)
- Secondary CTA: Teal `#00ACC1` (bg-teal-600)
- Background: Light gray (bg-gray-100)
- Cards: White with shadow-md
- Text: Gray-900 (primary), Gray-600 (secondary)

**Design Elements:**
- Border Radius: 8px (rounded-lg)
- Shadows: shadow-md for elevation
- Icon: Font Awesome bug icon (fas fa-bug)
- Border Accents: Green and teal border highlights

## 🔐 Production Data

The production application has:
- **Admin User**: username `admin`, password `password123`
- **Full Permissions**: Admin has all permissions enabled
- **Clean Database**: No sample issues (ready for real data)

## 📄 License

This project is created for demonstration purposes.

## 🤝 Contributing

This is a demo project. Feel free to fork and customize for your needs!

---

**Last Updated**: 2025-03-29  
**Version**: 2.0.0  
**Status**: ✅ Deployed to Production on Cloudflare Pages

### Recent Updates (v2.0.0 - Rebranded to bugs2fixes)
- ✅ **Complete rebrand** - Changed from "Renoir" to "bugs2fixes"
- ✅ **Removed logo dependencies** - Now using Font Awesome bug icon
- ✅ **Simplified branding** - Clean, professional look without company-specific branding
- ✅ **Automated deployment** - Custom deploy.sh script for one-command deployments
- ✅ **Added Type field to edit modal** - Can now change issue type (Bug/Feature) when editing
- ✅ **Fixed backend to support type updates** - Backend now accepts and saves type changes
- ✅ Fixed race condition when switching views quickly - no more null reference errors
- ✅ Fixed filtering functionality - all filters now work correctly
- ✅ Added "Assigned To" filter dropdown
- ✅ Renamed statuses: "In Progress" → "Needs to Be Tested", "Resolved" → "Completed Testing"
- ✅ Updated KPI dashboard to show 6 cards instead of 4
- ✅ Added screenshot upload and viewing capability
