// Global state
let currentUser = null;
let applicationNames = [];
let users = [];
let allUsers = []; // For admin panel
let currentView = 'dashboard'; // dashboard or admin
let currentFilter = {
  application_name: '',
  status: '',
  type: '',
  priority: ''
};

// Initialize app
async function init() {
  try {
    const response = await axios.get('/api/auth/me');
    currentUser = response.data;
    showDashboard();
    loadDashboardData();
  } catch (error) {
    showLogin();
  }
}

// Show login page
function showLogin() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div class="text-center mb-6">
          <img src="/static/logo-light.jpg" alt="Renoir Consulting" class="h-20 mx-auto mb-4">
          <div class="flex items-center justify-center mb-2">
            <i class="fas fa-bug text-green-600 text-3xl mr-3"></i>
            <h1 class="text-2xl font-bold text-gray-900">Issue Tracker</h1>
          </div>
          <p class="text-gray-600 mt-2">Track bugs and features across your applications</p>
        </div>
        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" id="username" required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" id="password" required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          <button type="submit" 
            class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
            <i class="fas fa-sign-in-alt mr-2"></i>Login
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    await axios.post('/api/auth/login', { username, password });
    // Fetch full user data including role and permissions
    const userResponse = await axios.get('/api/auth/me');
    currentUser = userResponse.data;
    showDashboard();
    loadDashboardData();
  } catch (error) {
    alert('Invalid credentials. Please try again.');
  }
}

// Handle logout
async function handleLogout() {
  try {
    await axios.post('/api/auth/logout');
    currentUser = null;
    showLogin();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Show dashboard
function showDashboard() {
  document.getElementById('app').innerHTML = `
    <nav class="bg-white shadow-md border-b-4 border-green-600">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <img src="/static/logo-light.jpg" alt="Renoir Consulting" class="h-16">
          <div class="border-l-2 border-gray-300 pl-3">
            <h1 class="text-xl font-bold text-gray-900">Issue Tracker</h1>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <button onclick="showDashboard(); currentView='dashboard'; loadDashboardData();" 
            class="px-4 py-2 text-green-600 border-b-2 border-green-600 font-semibold">
            <i class="fas fa-tasks mr-2"></i>Issues
          </button>
          ${currentUser.role === 'admin' ? `
            <button onclick="showAdminPanel()" 
              class="px-4 py-2 text-gray-600 hover:text-green-600 transition">
              <i class="fas fa-users-cog mr-2"></i>Admin
            </button>
          ` : ''}
          <button onclick="showProfileSettings()" 
            class="px-4 py-2 text-gray-600 hover:text-green-600 transition">
            <i class="fas fa-user-cog mr-2"></i>Profile
          </button>
          <span class="text-sm text-gray-600"><i class="fas fa-user mr-2 text-green-600"></i>${currentUser.full_name}</span>
          <button onclick="handleLogout()" class="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
            <i class="fas fa-sign-out-alt mr-2"></i>Logout
          </button>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
      <!-- Statistics Cards -->
      <div id="statsCards" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <!-- Stats will be loaded here -->
      </div>

      <!-- Filters and Actions -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <input type="text" id="filterApp" placeholder="Filter by application..." list="applicationList"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent">
          <datalist id="applicationList"></datalist>
          <select id="filterStatus" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select id="filterType" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent">
            <option value="">All Types</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
          </select>
          <select id="filterPriority" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent">
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          ${currentUser.permissions.can_create_issues ? `
            <button onclick="showCreateIssueModal()" 
              class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md">
              <i class="fas fa-plus mr-2"></i>New Issue
            </button>
          ` : '<div></div>'}
        </div>
      </div>

      <!-- Issues Table -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Application</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Affected Area</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reported By</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Priority</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Expected Completion</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assigned To</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody id="issuesTableBody">
              <!-- Issues will be loaded here -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Container -->
    <div id="modalContainer"></div>
  `;

  // Add filter event listeners
  document.getElementById('filterApp').addEventListener('input', (e) => {
    currentFilter.application_name = e.target.value;
    loadIssues();
  });
  document.getElementById('filterStatus').addEventListener('change', (e) => {
    currentFilter.status = e.target.value;
    loadIssues();
  });
  document.getElementById('filterType').addEventListener('change', (e) => {
    currentFilter.type = e.target.value;
    loadIssues();
  });
  document.getElementById('filterPriority').addEventListener('change', (e) => {
    currentFilter.priority = e.target.value;
    loadIssues();
  });
}

// Load dashboard data
async function loadDashboardData() {
  await loadApplicationNames();
  await loadUsers();
  await loadStats();
  await loadIssues();
}

// Load statistics
async function loadStats() {
  try {
    const response = await axios.get('/api/stats');
    const stats = response.data;

    document.getElementById('statsCards').innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Total Issues</p>
            <p class="text-3xl font-bold text-gray-900">${stats.total_issues || 0}</p>
          </div>
          <i class="fas fa-clipboard-list text-4xl text-green-600"></i>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-600">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Open Issues</p>
            <p class="text-3xl font-bold text-orange-600">${stats.open_issues || 0}</p>
          </div>
          <i class="fas fa-folder-open text-4xl text-teal-600"></i>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">In Progress</p>
            <p class="text-3xl font-bold text-yellow-600">${stats.in_progress_issues || 0}</p>
          </div>
          <i class="fas fa-spinner text-4xl text-yellow-500"></i>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Critical</p>
            <p class="text-3xl font-bold text-red-600">${stats.critical_issues || 0}</p>
          </div>
          <i class="fas fa-exclamation-triangle text-4xl text-red-600"></i>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load application names
async function loadApplicationNames() {
  try {
    const response = await axios.get('/api/applications');
    applicationNames = response.data.map(app => app.application_name);
    
    const datalist = document.getElementById('applicationList');
    if (datalist) {
      datalist.innerHTML = applicationNames.map(name => `<option value="${name}">`).join('');
    }
  } catch (error) {
    console.error('Error loading application names:', error);
  }
}

// Load users
async function loadUsers() {
  try {
    const response = await axios.get('/api/users');
    users = response.data;
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Load issues
async function loadIssues() {
  try {
    const params = new URLSearchParams();
    if (currentFilter.application_name) params.append('application_name', currentFilter.application_name);
    if (currentFilter.status) params.append('status', currentFilter.status);
    if (currentFilter.type) params.append('type', currentFilter.type);
    if (currentFilter.priority) params.append('priority', currentFilter.priority);

    const response = await axios.get('/api/issues?' + params.toString());
    const issues = response.data;

    const tbody = document.getElementById('issuesTableBody');
    if (issues.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" class="px-4 py-8 text-center text-gray-500">No issues found</td></tr>';
      return;
    }

    tbody.innerHTML = issues.map(issue => `
      <tr class="border-t hover:bg-gray-50">
        <td class="px-4 py-3 text-sm">#${issue.id}</td>
        <td class="px-4 py-3 text-sm font-medium">
          ${issue.title}
          ${issue.screenshot ? '<i class="fas fa-camera text-blue-600 ml-2 cursor-pointer" onclick="showScreenshot(' + issue.id + ')" title="View screenshot"></i>' : ''}
        </td>
        <td class="px-4 py-3 text-sm">${issue.application_name}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${issue.affected_area || '-'}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${issue.reported_by_name || 'Unknown'}</td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg ${
            issue.type === 'bug' ? 'bg-red-100 text-red-800' : 'bg-teal-100 text-teal-800'
          }">
            <i class="fas ${issue.type === 'bug' ? 'fa-bug' : 'fa-star'} mr-1"></i>
            ${issue.type}
          </span>
        </td>
        <td class="px-4 py-3">
          ${getStatusBadge(issue.status)}
        </td>
        <td class="px-4 py-3">
          ${getPriorityBadge(issue.priority)}
        </td>
        <td class="px-4 py-3 text-sm">${issue.expected_completion_date ? new Date(issue.expected_completion_date).toLocaleDateString() : '-'}</td>
        <td class="px-4 py-3 text-sm">${issue.assigned_to_name || 'Unassigned'}</td>
        <td class="px-4 py-3">
          ${currentUser.permissions.can_edit_issues ? `
            <button onclick="showEditIssueModal(${issue.id})" class="text-green-600 hover:text-green-800 mr-3 transition" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
          ` : ''}
          ${currentUser.permissions.can_delete_issues ? `
            <button onclick="deleteIssue(${issue.id})" class="text-red-600 hover:text-red-800 transition" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          ` : ''}
          ${!currentUser.permissions.can_edit_issues && !currentUser.permissions.can_delete_issues ? '<span class="text-gray-400 text-sm">View only</span>' : ''}
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading issues:', error);
  }
}

// Helper functions for badges
function getStatusBadge(status) {
  const colors = {
    open: 'bg-teal-100 text-teal-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };
  return `<span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg ${colors[status]}">${status.replace('_', ' ')}</span>`;
}

function getPriorityBadge(priority) {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };
  return `<span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg ${colors[priority]}">${priority}</span>`;
}

// Show screenshot modal
async function showScreenshot(issueId) {
  try {
    const response = await axios.get(`/api/issues/${issueId}`);
    const issue = response.data;
    
    if (!issue.screenshot) {
      alert('No screenshot available');
      return;
    }
    
    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onclick="closeModal(event)">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl m-4 max-h-[90vh] overflow-auto" onclick="event.stopPropagation()">
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-bold text-gray-800">
              <i class="fas fa-camera text-blue-600 mr-2"></i>Screenshot - Issue #${issue.id}: ${issue.title}
            </h3>
            <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div class="p-4">
            <img src="${issue.screenshot}" class="max-w-full h-auto rounded" alt="Issue screenshot">
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    alert('Error loading screenshot: ' + error.message);
  }
}

// Show create issue modal
function showCreateIssueModal() {
  const modal = document.getElementById('modalContainer');
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModal(event)">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex justify-between items-center p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-plus-circle mr-2"></i>Create New Issue</h2>
          <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <form id="createIssueForm" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Application Name *</label>
              <input type="text" id="application_name" required list="createApplicationList"
                placeholder="e.g., Web Portal, Mobile App"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <datalist id="createApplicationList">
                ${applicationNames.map(name => `<option value="${name}">`).join('')}
              </datalist>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select id="type" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Affected Area</label>
            <input type="text" id="affected_area" 
              placeholder="e.g., Login page, User profile section, Payment module"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <p class="text-xs text-gray-500 mt-1">Specify which part of the application is affected</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" id="title" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="description" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <i class="fas fa-camera text-blue-600 mr-1"></i>Screenshot (Optional)
            </label>
            <input type="file" id="screenshot" accept="image/*" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <p class="text-xs text-gray-500 mt-1">Upload a screenshot of the issue (max 2MB)</p>
            <div id="screenshotPreview" class="mt-2"></div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select id="priority" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select id="assigned_to" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Unassigned</option>
                ${users.map(user => `<option value="${user.id}">${user.full_name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Expected Completion</label>
              <input type="date" id="expected_completion_date" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            </div>
          </div>
          <div class="flex justify-end space-x-4 pt-4">
            <button type="button" onclick="closeModal()" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md">
              <i class="fas fa-save mr-2"></i>Create Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('createIssueForm').addEventListener('submit', handleCreateIssue);
  
  // Add screenshot preview
  document.getElementById('screenshot').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('screenshotPreview');
    
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Screenshot must be smaller than 2MB');
        e.target.value = '';
        preview.innerHTML = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        preview.innerHTML = `
          <div class="relative inline-block">
            <img src="${event.target.result}" class="max-w-xs max-h-48 rounded border border-gray-300" alt="Screenshot preview">
            <button type="button" onclick="document.getElementById('screenshot').value=''; document.getElementById('screenshotPreview').innerHTML='';" 
              class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700">
              <i class="fas fa-times text-xs"></i>
            </button>
          </div>
        `;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = '';
    }
  });
}

// Handle create issue
async function handleCreateIssue(e) {
  e.preventDefault();
  
  // Get screenshot as base64 if uploaded
  let screenshot = null;
  const screenshotFile = document.getElementById('screenshot').files[0];
  if (screenshotFile) {
    screenshot = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(screenshotFile);
    });
  }
  
  const formData = {
    application_name: document.getElementById('application_name').value,
    affected_area: document.getElementById('affected_area').value,
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    type: document.getElementById('type').value,
    priority: document.getElementById('priority').value,
    assigned_to: document.getElementById('assigned_to').value || null,
    expected_completion_date: document.getElementById('expected_completion_date').value || null,
    screenshot: screenshot
  };

  try {
    await axios.post('/api/issues', formData);
    closeModal();
    loadDashboardData();
  } catch (error) {
    alert('Error creating issue: ' + (error.response?.data?.error || error.message));
  }
}

// Show edit issue modal
async function showEditIssueModal(issueId) {
  try {
    const response = await axios.get(`/api/issues/${issueId}`);
    const issue = response.data;

    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModal(event)">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
          <div class="flex justify-between items-center p-6 border-b">
            <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-edit mr-2"></i>Edit Issue #${issue.id}</h2>
            <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          <form id="editIssueForm" class="p-6 space-y-4">
            <input type="hidden" id="issue_id" value="${issue.id}">
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
              <p class="text-sm text-gray-600"><strong>Reported by:</strong> ${issue.reported_by_name}</p>
              <p class="text-sm text-gray-600"><strong>Created:</strong> ${new Date(issue.created_at).toLocaleString()}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Application Name *</label>
                <input type="text" id="edit_application_name" required value="${issue.application_name}" list="editApplicationList"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <datalist id="editApplicationList">
                  ${applicationNames.map(name => `<option value="${name}">`).join('')}
                </datalist>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Affected Area</label>
                <input type="text" id="edit_affected_area" value="${issue.affected_area || ''}"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" id="edit_title" required value="${issue.title}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea id="edit_description" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg">${issue.description || ''}</textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <i class="fas fa-camera text-blue-600 mr-1"></i>Screenshot (Optional)
              </label>
              ${issue.screenshot ? `
                <div class="mb-2">
                  <div class="relative inline-block">
                    <img src="${issue.screenshot}" class="max-w-xs max-h-32 rounded border border-gray-300" alt="Current screenshot">
                    <span class="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">Current</span>
                  </div>
                </div>
              ` : '<p class="text-sm text-gray-500 mb-2">No screenshot currently attached</p>'}
              <input type="file" id="edit_screenshot" accept="image/*" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <p class="text-xs text-gray-500 mt-1">Upload a new screenshot to replace the existing one (max 2MB)</p>
              <div id="editScreenshotPreview" class="mt-2"></div>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select id="edit_status" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="open" ${issue.status === 'open' ? 'selected' : ''}>Open</option>
                  <option value="in_progress" ${issue.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                  <option value="resolved" ${issue.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                  <option value="closed" ${issue.status === 'closed' ? 'selected' : ''}>Closed</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <select id="edit_priority" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="low" ${issue.priority === 'low' ? 'selected' : ''}>Low</option>
                  <option value="medium" ${issue.priority === 'medium' ? 'selected' : ''}>Medium</option>
                  <option value="high" ${issue.priority === 'high' ? 'selected' : ''}>High</option>
                  <option value="critical" ${issue.priority === 'critical' ? 'selected' : ''}>Critical</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select id="edit_assigned_to" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Unassigned</option>
                  ${users.map(user => `<option value="${user.id}" ${issue.assigned_to === user.id ? 'selected' : ''}>${user.full_name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Expected Completion</label>
                <input type="date" id="edit_expected_completion_date" value="${issue.expected_completion_date || ''}" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              </div>
            </div>
            <div class="flex justify-end space-x-4 pt-4">
              <button type="button" onclick="closeModal()" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md">
                <i class="fas fa-save mr-2"></i>Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('editIssueForm').addEventListener('submit', handleEditIssue);
    
    // Add screenshot preview for edit
    document.getElementById('edit_screenshot').addEventListener('change', function(e) {
      const file = e.target.files[0];
      const preview = document.getElementById('editScreenshotPreview');
      
      if (file) {
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          alert('Screenshot must be smaller than 2MB');
          e.target.value = '';
          preview.innerHTML = '';
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
          preview.innerHTML = `
            <div class="relative inline-block">
              <img src="${event.target.result}" class="max-w-xs max-h-32 rounded border border-gray-300" alt="New screenshot preview">
              <span class="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">New</span>
              <button type="button" onclick="document.getElementById('edit_screenshot').value=''; document.getElementById('editScreenshotPreview').innerHTML='';" 
                class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700">
                <i class="fas fa-times text-xs"></i>
              </button>
            </div>
          `;
        };
        reader.readAsDataURL(file);
      } else {
        preview.innerHTML = '';
      }
    });
  } catch (error) {
    alert('Error loading issue: ' + (error.response?.data?.error || error.message));
  }
}

// Handle edit issue
async function handleEditIssue(e) {
  e.preventDefault();
  const issueId = document.getElementById('issue_id').value;
  
  // Get screenshot as base64 if uploaded
  let screenshot = undefined; // undefined means don't update
  const screenshotFile = document.getElementById('edit_screenshot').files[0];
  if (screenshotFile) {
    screenshot = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(screenshotFile);
    });
  }
  
  const formData = {
    application_name: document.getElementById('edit_application_name').value,
    affected_area: document.getElementById('edit_affected_area').value,
    title: document.getElementById('edit_title').value,
    description: document.getElementById('edit_description').value,
    status: document.getElementById('edit_status').value,
    priority: document.getElementById('edit_priority').value,
    assigned_to: document.getElementById('edit_assigned_to').value || null,
    expected_completion_date: document.getElementById('edit_expected_completion_date').value || null
  };
  
  // Only include screenshot if a new one was uploaded
  if (screenshot !== undefined) {
    formData.screenshot = screenshot;
  }

  try {
    await axios.put(`/api/issues/${issueId}`, formData);
    closeModal();
    loadDashboardData();
  } catch (error) {
    alert('Error updating issue: ' + (error.response?.data?.error || error.message));
  }
}

// Delete issue
async function deleteIssue(issueId) {
  if (!confirm('Are you sure you want to delete this issue?')) {
    return;
  }

  try {
    await axios.delete(`/api/issues/${issueId}`);
    loadDashboardData();
  } catch (error) {
    alert('Error deleting issue: ' + (error.response?.data?.error || error.message));
  }
}

// Close modal
function closeModal(event) {
  if (!event || event.target === event.currentTarget) {
    document.getElementById('modalContainer').innerHTML = '';
  }
}

// ==================== ADMIN PANEL FUNCTIONS ====================

// Switch to admin view
function showAdminPanel() {
  currentView = 'admin';
  document.getElementById('app').innerHTML = `
    <nav class="bg-white shadow-md border-b-4 border-green-600">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <img src="/static/logo-light.jpg" alt="Renoir Consulting" class="h-16">
          <div class="border-l-2 border-gray-300 pl-3">
            <h1 class="text-xl font-bold text-gray-900">Issue Tracker</h1>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <button onclick="showDashboard(); currentView='dashboard'; loadDashboardData();" 
            class="px-4 py-2 text-gray-600 hover:text-green-600 transition">
            <i class="fas fa-tasks mr-2"></i>Issues
          </button>
          <button onclick="showAdminPanel()" 
            class="px-4 py-2 text-green-600 border-b-2 border-green-600 font-semibold">
            <i class="fas fa-users-cog mr-2"></i>Admin
          </button>
          <span class="text-sm text-gray-600"><i class="fas fa-user mr-2 text-green-600"></i>${currentUser.full_name}</span>
          <button onclick="handleLogout()" class="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
            <i class="fas fa-sign-out-alt mr-2"></i>Logout
          </button>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900"><i class="fas fa-users-cog mr-2 text-green-600"></i>User Management</h2>
          <button onclick="showCreateUserModal()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md">
            <i class="fas fa-user-plus mr-2"></i>Add User
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Full Name</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Permissions</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              <!-- Users will be loaded here -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Container -->
    <div id="modalContainer"></div>
  `;

  loadAllUsers();
}

// Load all users for admin panel
async function loadAllUsers() {
  try {
    const response = await axios.get('/api/admin/users');
    allUsers = response.data;

    const tbody = document.getElementById('usersTableBody');
    if (allUsers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No users found</td></tr>';
      return;
    }

    tbody.innerHTML = allUsers.map(user => `
      <tr class="border-t hover:bg-gray-50">
        <td class="px-4 py-3 text-sm font-medium">${user.username}</td>
        <td class="px-4 py-3 text-sm">${user.full_name}</td>
        <td class="px-4 py-3 text-sm">${user.email}</td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg ${
            user.role === 'admin' ? 'bg-green-100 text-green-800' : 
            user.role === 'user' ? 'bg-blue-100 text-blue-800' : 
            'bg-gray-100 text-gray-800'
          }">
            ${user.role}
          </span>
        </td>
        <td class="px-4 py-3 text-xs">
          ${user.can_create_issues ? '<span class="text-green-600" title="Can create issues"><i class="fas fa-plus-circle"></i></span>' : '<span class="text-gray-300"><i class="fas fa-plus-circle"></i></span>'}
          ${user.can_edit_issues ? '<span class="text-blue-600 ml-2" title="Can edit issues"><i class="fas fa-edit"></i></span>' : '<span class="text-gray-300 ml-2"><i class="fas fa-edit"></i></span>'}
          ${user.can_delete_issues ? '<span class="text-red-600 ml-2" title="Can delete issues"><i class="fas fa-trash"></i></span>' : '<span class="text-gray-300 ml-2"><i class="fas fa-trash"></i></span>'}
          ${user.can_resolve_issues ? '<span class="text-purple-600 ml-2" title="Can resolve issues"><i class="fas fa-check-circle"></i></span>' : '<span class="text-gray-300 ml-2"><i class="fas fa-check-circle"></i></span>'}
        </td>
        <td class="px-4 py-3">
          <button onclick="showEditUserModal(${user.id})" class="text-green-600 hover:text-green-800 mr-3 transition" title="Edit">
            <i class="fas fa-user-edit"></i>
          </button>
          ${user.id !== currentUser.id ? `
            <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-800 transition" title="Delete">
              <i class="fas fa-user-times"></i>
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading users:', error);
    alert('Error loading users: ' + (error.response?.data?.error || error.message));
  }
}

// Show create user modal
function showCreateUserModal() {
  const modal = document.getElementById('modalContainer');
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModal(event)">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex justify-between items-center p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-user-plus mr-2"></i>Create New User</h2>
          <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <form id="createUserForm" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input type="text" id="new_username" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" id="new_password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" id="new_full_name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" id="new_email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select id="new_role" required class="w-full px-4 py-2 border border-gray-300 rounded-lg" onchange="togglePermissions(this.value, 'new')">
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div id="new_permissions_section">
            <label class="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" id="new_can_create_issues" checked class="mr-2">
                <span class="text-sm">Can create issues</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="new_can_edit_issues" checked class="mr-2">
                <span class="text-sm">Can edit issues</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="new_can_delete_issues" class="mr-2">
                <span class="text-sm">Can delete issues</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="new_can_resolve_issues" class="mr-2">
                <span class="text-sm">Can resolve/close issues</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="new_can_assign_issues" checked class="mr-2">
                <span class="text-sm">Can assign issues to others</span>
              </label>
            </div>
          </div>
          <div class="flex justify-end space-x-4 pt-4">
            <button type="button" onclick="closeModal()" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md">
              <i class="fas fa-save mr-2"></i>Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('createUserForm').addEventListener('submit', handleCreateUser);
}

// Handle create user
async function handleCreateUser(e) {
  e.preventDefault();
  const formData = {
    username: document.getElementById('new_username').value,
    password: document.getElementById('new_password').value,
    email: document.getElementById('new_email').value,
    full_name: document.getElementById('new_full_name').value,
    role: document.getElementById('new_role').value,
    permissions: {
      can_create_issues: document.getElementById('new_can_create_issues').checked,
      can_edit_issues: document.getElementById('new_can_edit_issues').checked,
      can_delete_issues: document.getElementById('new_can_delete_issues').checked,
      can_resolve_issues: document.getElementById('new_can_resolve_issues').checked,
      can_assign_issues: document.getElementById('new_can_assign_issues').checked
    }
  };

  try {
    await axios.post('/api/admin/users', formData);
    closeModal();
    loadAllUsers();
  } catch (error) {
    alert('Error creating user: ' + (error.response?.data?.error || error.message));
  }
}

// Show edit user modal
async function showEditUserModal(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  const modal = document.getElementById('modalContainer');
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModal(event)">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex justify-between items-center p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-user-edit mr-2"></i>Edit User</h2>
          <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <form id="editUserForm" class="p-6 space-y-4">
          <input type="hidden" id="edit_user_id" value="${user.id}">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" id="edit_username" value="${user.username}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password (leave blank to keep current)</label>
              <input type="password" id="edit_password" placeholder="••••••••" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" id="edit_full_name" value="${user.full_name}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" id="edit_email" value="${user.email}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select id="edit_role" class="w-full px-4 py-2 border border-gray-300 rounded-lg" onchange="togglePermissions(this.value, 'edit')">
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
              <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>
          <div id="edit_permissions_section">
            <label class="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" id="edit_can_create_issues" ${user.can_create_issues ? 'checked' : ''} class="mr-2">
                <span class="text-sm">Can create issues</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="edit_can_edit_issues" ${user.can_edit_issues ? 'checked' : ''} class="mr-2">
                <span class="text-sm">Can edit issues</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="edit_can_delete_issues" ${user.can_delete_issues ? 'checked' : ''} class="mr-2">
                <span class="text-sm">Can delete issues</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="edit_can_resolve_issues" ${user.can_resolve_issues ? 'checked' : ''} class="mr-2">
                <span class="text-sm">Can resolve/close issues</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="edit_can_assign_issues" ${user.can_assign_issues ? 'checked' : ''} class="mr-2">
                <span class="text-sm">Can assign issues to others</span>
              </label>
            </div>
          </div>
          <div class="flex justify-end space-x-4 pt-4">
            <button type="button" onclick="closeModal()" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md">
              <i class="fas fa-save mr-2"></i>Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('editUserForm').addEventListener('submit', handleEditUser);
  togglePermissions(user.role, 'edit');
}

// Toggle permissions based on role
function togglePermissions(role, prefix) {
  const permissionsSection = document.getElementById(`${prefix}_permissions_section`);
  if (role === 'admin') {
    // Admin gets all permissions, disable checkboxes
    ['can_create_issues', 'can_edit_issues', 'can_delete_issues', 'can_resolve_issues', 'can_assign_issues'].forEach(perm => {
      const checkbox = document.getElementById(`${prefix}_${perm}`);
      if (checkbox) {
        checkbox.checked = true;
        checkbox.disabled = true;
      }
    });
  } else {
    // Enable all checkboxes for non-admin roles
    ['can_create_issues', 'can_edit_issues', 'can_delete_issues', 'can_resolve_issues', 'can_assign_issues'].forEach(perm => {
      const checkbox = document.getElementById(`${prefix}_${perm}`);
      if (checkbox) {
        checkbox.disabled = false;
      }
    });
  }
}

// Handle edit user
async function handleEditUser(e) {
  e.preventDefault();
  const userId = document.getElementById('edit_user_id').value;
  const password = document.getElementById('edit_password').value;
  
  const formData = {
    username: document.getElementById('edit_username').value,
    email: document.getElementById('edit_email').value,
    full_name: document.getElementById('edit_full_name').value,
    role: document.getElementById('edit_role').value,
    permissions: {
      can_create_issues: document.getElementById('edit_can_create_issues').checked,
      can_edit_issues: document.getElementById('edit_can_edit_issues').checked,
      can_delete_issues: document.getElementById('edit_can_delete_issues').checked,
      can_resolve_issues: document.getElementById('edit_can_resolve_issues').checked,
      can_assign_issues: document.getElementById('edit_can_assign_issues').checked
    }
  };

  // Only include password if it was changed
  if (password) {
    formData.password = password;
  }

  try {
    await axios.put(`/api/admin/users/${userId}`, formData);
    closeModal();
    loadAllUsers();
  } catch (error) {
    alert('Error updating user: ' + (error.response?.data?.error || error.message));
  }
}

// Delete user
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }

  try {
    await axios.delete(`/api/admin/users/${userId}`);
    loadAllUsers();
  } catch (error) {
    alert('Error deleting user: ' + (error.response?.data?.error || error.message));
  }
}

// ==================== Profile Settings ====================

function showProfileSettings() {
  currentView = 'profile';
  document.getElementById('app').innerHTML = `
    <nav class="bg-white shadow-md border-b-4 border-green-600">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <img src="/static/logo-light.jpg" alt="Renoir Consulting" class="h-16">
          <div class="border-l-2 border-gray-300 pl-3">
            <h1 class="text-xl font-bold text-gray-900">Issue Tracker</h1>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <button onclick="showDashboard(); currentView='dashboard'; loadDashboardData();" 
            class="px-4 py-2 text-gray-600 hover:text-green-600 transition">
            <i class="fas fa-tasks mr-2"></i>Issues
          </button>
          ${currentUser.role === 'admin' ? `
            <button onclick="showAdminPanel()" 
              class="px-4 py-2 text-gray-600 hover:text-green-600 transition">
              <i class="fas fa-users-cog mr-2"></i>Admin
            </button>
          ` : ''}
          <button onclick="showProfileSettings()" 
            class="px-4 py-2 text-green-600 border-b-2 border-green-600 font-semibold">
            <i class="fas fa-user-cog mr-2"></i>Profile
          </button>
          <span class="text-sm text-gray-600"><i class="fas fa-user mr-2 text-green-600"></i>${currentUser.full_name}</span>
          <button onclick="handleLogout()" class="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
            <i class="fas fa-sign-out-alt mr-2"></i>Logout
          </button>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          <i class="fas fa-user-cog text-green-600 mr-2"></i>Profile Settings
        </h2>

        <!-- Account Information -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="fas fa-info-circle text-blue-600 mr-2"></i>Account Information
          </h3>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-600">Username</label>
              <p class="text-gray-900 font-medium">${currentUser.username}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Role</label>
              <p class="text-gray-900 font-medium capitalize">${currentUser.role}</p>
            </div>
          </div>
        </div>

        <!-- Update Profile Form -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="fas fa-edit text-green-600 mr-2"></i>Update Profile
          </h3>
          <form id="updateProfileForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" id="profileEmail" value="${currentUser.email}" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" id="profileFullName" value="${currentUser.full_name}" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent">
            </div>
            <button type="submit" 
              class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
              <i class="fas fa-save mr-2"></i>Save Profile Changes
            </button>
          </form>
        </div>

        <!-- Change Password Form -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="fas fa-key text-orange-600 mr-2"></i>Change Password
          </h3>
          <form id="changePasswordForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" id="currentPassword" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" id="newPassword" required minlength="6"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent">
              <p class="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" id="confirmPassword" required minlength="6"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent">
            </div>
            <button type="submit" 
              class="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition">
              <i class="fas fa-lock mr-2"></i>Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Attach form handlers
  document.getElementById('updateProfileForm').addEventListener('submit', handleUpdateProfile);
  document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const email = document.getElementById('profileEmail').value;
  const full_name = document.getElementById('profileFullName').value;

  try {
    await axios.put('/api/profile', { email, full_name });
    
    // Update currentUser
    currentUser.email = email;
    currentUser.full_name = full_name;
    
    alert('Profile updated successfully!');
    showProfileSettings(); // Refresh the page
  } catch (error) {
    alert('Error updating profile: ' + (error.response?.data?.error || error.message));
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const current_password = document.getElementById('currentPassword').value;
  const new_password = document.getElementById('newPassword').value;
  const confirm_password = document.getElementById('confirmPassword').value;

  // Validate passwords match
  if (new_password !== confirm_password) {
    alert('New passwords do not match!');
    return;
  }

  try {
    await axios.put('/api/profile/password', { current_password, new_password });
    alert('Password changed successfully!');
    
    // Clear the form
    document.getElementById('changePasswordForm').reset();
  } catch (error) {
    alert('Error changing password: ' + (error.response?.data?.error || error.message));
  }
}

// Initialize on page load
init();
