import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ==================== Authentication Middleware ====================

const authMiddleware = async (c: any, next: any) => {
  const sessionId = getCookie(c, 'session_id')
  
  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Check if session is valid
  const session = await c.env.DB.prepare(`
    SELECT s.id, s.user_id, s.expires_at, u.username, u.email, u.full_name
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first()

  if (!session) {
    deleteCookie(c, 'session_id')
    return c.json({ error: 'Session expired' }, 401)
  }

  c.set('user', session)
  await next()
}

// ==================== Helper Functions ====================

const generateSessionId = () => {
  return crypto.randomUUID()
}

const createSession = async (db: D1Database, userId: number) => {
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  await db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).bind(sessionId, userId, expiresAt.toISOString()).run()
  
  return sessionId
}

// ==================== Public Routes ====================

// Login endpoint
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json()
  
  const user = await c.env.DB.prepare(`
    SELECT id, username, password, email, full_name
    FROM users
    WHERE username = ? AND password = ?
  `).bind(username, password).first()
  
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  
  const sessionId = await createSession(c.env.DB, user.id as number)
  
  setCookie(c, 'session_id', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  })
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name
    }
  })
})

// Logout endpoint
app.post('/api/auth/logout', async (c) => {
  const sessionId = getCookie(c, 'session_id')
  
  if (sessionId) {
    await c.env.DB.prepare(`
      DELETE FROM sessions WHERE id = ?
    `).bind(sessionId).run()
    
    deleteCookie(c, 'session_id')
  }
  
  return c.json({ success: true })
})

// Check authentication status
app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')
  return c.json({
    id: user.user_id,
    username: user.username,
    email: user.email,
    full_name: user.full_name
  })
})

// ==================== Protected API Routes ====================

// Get distinct application names
app.get('/api/applications', authMiddleware, async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT DISTINCT application_name FROM issues ORDER BY application_name
  `).all()
  
  return c.json(result.results)
})

// Get all issues with filters
app.get('/api/issues', authMiddleware, async (c) => {
  const { application_name, status, type, priority } = c.req.query()
  
  let query = `
    SELECT 
      i.*,
      u1.username as reported_by_username,
      u1.full_name as reported_by_name,
      u2.username as assigned_to_username,
      u2.full_name as assigned_to_name
    FROM issues i
    JOIN users u1 ON i.reported_by = u1.id
    LEFT JOIN users u2 ON i.assigned_to = u2.id
    WHERE 1=1
  `
  
  const params: any[] = []
  
  if (application_name) {
    query += ` AND i.application_name = ?`
    params.push(application_name)
  }
  
  if (status) {
    query += ` AND i.status = ?`
    params.push(status)
  }
  
  if (type) {
    query += ` AND i.type = ?`
    params.push(type)
  }
  
  if (priority) {
    query += ` AND i.priority = ?`
    params.push(priority)
  }
  
  query += ` ORDER BY i.created_at DESC`
  
  const result = await c.env.DB.prepare(query).bind(...params).all()
  
  return c.json(result.results)
})

// Get single issue
app.get('/api/issues/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  
  const issue = await c.env.DB.prepare(`
    SELECT 
      i.*,
      u1.username as reported_by_username,
      u1.full_name as reported_by_name,
      u2.username as assigned_to_username,
      u2.full_name as assigned_to_name
    FROM issues i
    JOIN users u1 ON i.reported_by = u1.id
    LEFT JOIN users u2 ON i.assigned_to = u2.id
    WHERE i.id = ?
  `).bind(id).first()
  
  if (!issue) {
    return c.json({ error: 'Issue not found' }, 404)
  }
  
  return c.json(issue)
})

// Create new issue
app.post('/api/issues', authMiddleware, async (c) => {
  const user = c.get('user')
  const { application_name, affected_area, title, description, type, priority, assigned_to, expected_completion_date } = await c.req.json()
  
  const result = await c.env.DB.prepare(`
    INSERT INTO issues (application_name, affected_area, title, description, type, priority, reported_by, assigned_to, expected_completion_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(application_name, affected_area || null, title, description, type, priority, user.user_id, assigned_to || null, expected_completion_date || null).run()
  
  return c.json({ 
    id: result.meta.last_row_id,
    application_name,
    affected_area,
    title,
    description,
    type,
    priority,
    status: 'open',
    reported_by: user.user_id,
    assigned_to,
    expected_completion_date
  })
})

// Update issue
app.put('/api/issues/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const { application_name, affected_area, title, description, status, priority, assigned_to, expected_completion_date } = await c.req.json()
  
  await c.env.DB.prepare(`
    UPDATE issues 
    SET application_name = ?, affected_area = ?, title = ?, description = ?, status = ?, priority = ?, assigned_to = ?, expected_completion_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(application_name, affected_area || null, title, description, status, priority, assigned_to || null, expected_completion_date || null, id).run()
  
  return c.json({ success: true })
})

// Delete issue
app.delete('/api/issues/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  
  await c.env.DB.prepare(`
    DELETE FROM issues WHERE id = ?
  `).bind(id).run()
  
  return c.json({ success: true })
})

// Get all users (for assignment dropdown)
app.get('/api/users', authMiddleware, async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT id, username, email, full_name FROM users ORDER BY username
  `).all()
  
  return c.json(result.results)
})

// Get statistics
app.get('/api/stats', authMiddleware, async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_issues,
      SUM(CASE WHEN type = 'bug' THEN 1 ELSE 0 END) as total_bugs,
      SUM(CASE WHEN type = 'feature' THEN 1 ELSE 0 END) as total_features,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_issues,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_issues,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_issues,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_issues,
      SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical_issues,
      SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_issues
    FROM issues
  `).first()
  
  return c.json(stats)
})

// ==================== Main Page ====================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bug & Feature Tracker</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .status-badge { @apply inline-block px-2 py-1 text-xs font-semibold rounded-lg; }
          .priority-badge { @apply inline-block px-2 py-1 text-xs font-semibold rounded-lg; }
          .bg-gradient-renoir { background: linear-gradient(to bottom right, #E0F2F1, #C8E6C9); }
        </style>
    </head>
    <body class="bg-gradient-renoir">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
