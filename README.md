# Bug & Feature Tracker

A comprehensive bug and feature tracking application built with Hono framework and Cloudflare D1 database, designed for teams of 4-5 users to track issues across multiple applications.

## 🌐 Live Demo

**Production URL**: To be deployed  
**Sandbox URL**: https://3000-iboampgrsdxqbpverczzm-dfc00ec5.sandbox.novita.ai

## ✨ Features

### Currently Completed Features

✅ **User Authentication**
- Secure login/logout with session management
- Session-based authentication using Cloudflare D1
- 5 demo user accounts pre-configured

✅ **Issue Management**
- Create, read, update, and delete issues
- Support for both bugs and feature requests
- Real-time statistics dashboard

✅ **Issue Classification**
- **Types**: Bug, Feature
- **Status**: Open, In Progress, Resolved, Closed
- **Priority**: Low, Medium, High, Critical

✅ **Application Management**
- Track issues across multiple applications
- 4 sample applications pre-configured
- Filterable by application

✅ **User Assignment**
- Assign issues to team members
- Track reporter and assignee
- View who created each issue

✅ **Advanced Filtering**
- Filter by application, status, type, and priority
- Real-time filter updates
- Comprehensive issue listing

✅ **Statistics Dashboard**
- Total issues count
- Open issues tracking
- In-progress issues tracking
- Critical issues highlighting

## 📋 Functional URIs

### Authentication Endpoints
- `POST /api/auth/login` - User login (body: `{username, password}`)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Issue Management Endpoints
- `GET /api/issues` - List all issues (supports query params: `application_id`, `status`, `type`, `priority`)
- `GET /api/issues/:id` - Get single issue details
- `POST /api/issues` - Create new issue (body: `{application_id, title, description, type, priority, assigned_to}`)
- `PUT /api/issues/:id` - Update issue (body: `{title, description, status, priority, assigned_to}`)
- `DELETE /api/issues/:id` - Delete issue

### Application & User Endpoints
- `GET /api/applications` - List all applications
- `POST /api/applications` - Create new application (body: `{name, description}`)
- `GET /api/users` - List all users
- `GET /api/stats` - Get statistics summary

### Static Pages
- `GET /` - Main application page
- `GET /static/app.js` - Frontend JavaScript

## 🚀 Features Not Yet Implemented

- [ ] **Comments/Activity Log**: Add comment threads to issues
- [ ] **File Attachments**: Upload screenshots and files to issues
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
- `created_at`, `updated_at`

**Applications Table**
- `id` (Primary Key)
- `name` (Unique)
- `description`
- `created_at`, `updated_at`

**Issues Table**
- `id` (Primary Key)
- `application_id` (Foreign Key → Applications)
- `title`
- `description`
- `type` (bug/feature)
- `status` (open/in_progress/resolved/closed)
- `priority` (low/medium/high/critical)
- `reported_by` (Foreign Key → Users)
- `assigned_to` (Foreign Key → Users, nullable)
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
- Production uses Cloudflare D1 (database ID: `95c0225a-e4bd-4ef0-87a5-25913926cfad`)

### Data Flow

1. **Authentication Flow**:
   - User submits credentials → Backend validates against D1 users table
   - On success, creates session in D1 sessions table
   - Returns secure HTTP-only cookie with session ID
   - All subsequent requests include session cookie for authentication

2. **Issue Creation Flow**:
   - User creates issue → Frontend sends to `/api/issues`
   - Backend validates session → Inserts into D1 issues table
   - Returns created issue → Frontend refreshes issue list

3. **Filtering Flow**:
   - User selects filters → Frontend builds query parameters
   - Backend queries D1 with WHERE clauses → Returns filtered results
   - Frontend updates table display

## 👥 User Guide

### Getting Started

1. **Login**:
   - Navigate to the application URL
   - Use one of the demo accounts:
     - `admin` / `password123`
     - `john` / `password123`
     - `jane` / `password123`
     - `bob` / `password123`
     - `alice` / `password123`

2. **View Dashboard**:
   - After login, see statistics cards showing total, open, in-progress, and critical issues
   - View the main issues table with all tracked bugs and features

3. **Filter Issues**:
   - Use the filter dropdowns to narrow down issues:
     - **Application**: Filter by specific app
     - **Status**: Filter by issue status
     - **Type**: Show only bugs or features
     - **Priority**: Filter by priority level

4. **Create New Issue**:
   - Click "New Issue" button
   - Fill in the form:
     - Select application
     - Choose type (Bug or Feature)
     - Enter title and description
     - Set priority level
     - Optionally assign to a team member
   - Click "Create Issue"

5. **Edit Issue**:
   - Click the edit icon (pencil) on any issue
   - Update title, description, status, priority, or assignee
   - Click "Save Changes"

6. **Delete Issue**:
   - Click the delete icon (trash) on any issue
   - Confirm deletion

7. **Track Progress**:
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
- ❌ Not yet deployed to production
- ✅ Running in sandbox environment

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

```bash
# Apply migrations to production database
npm run db:migrate:prod

# Deploy to Cloudflare Pages
npm run deploy:prod
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

## 🎨 Demo Data

The application comes pre-seeded with:
- **5 Users**: admin, john, jane, bob, alice
- **4 Applications**: Web Portal, Mobile App, Admin Dashboard, API Gateway
- **6 Sample Issues**: Mix of bugs and features with various statuses and priorities

## 📄 License

This project is created for demonstration purposes.

## 🤝 Contributing

This is a demo project. Feel free to fork and customize for your needs!

---

**Last Updated**: 2025-10-29  
**Version**: 1.0.0  
**Status**: ✅ Fully Functional in Sandbox Environment
