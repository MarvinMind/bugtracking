// Global state
let currentUser = null;
let applicationNames = [];
let users = [];
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
          <img src="/logo-light.png" alt="Renoir Consulting" class="h-20 mx-auto mb-4">
          <h1 class="text-2xl font-bold text-gray-900">Issue Tracker</h1>
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
        <div class="mt-4 p-3 bg-teal-50 rounded-lg text-sm text-gray-700">
          <strong>Demo accounts:</strong><br>
          admin / password123<br>
          john / password123<br>
          jane / password123
        </div>
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
    const response = await axios.post('/api/auth/login', { username, password });
    currentUser = response.data.user;
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
          <img src="/logo-light.png" alt="Renoir Consulting" class="h-16">
          <div class="border-l-2 border-gray-300 pl-3">
            <h1 class="text-xl font-bold text-gray-900">Issue Tracker</h1>
          </div>
        </div>
        <div class="flex items-center space-x-4">
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
          <button onclick="showCreateIssueModal()" 
            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md">
            <i class="fas fa-plus mr-2"></i>New Issue
          </button>
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
      tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-gray-500">No issues found</td></tr>';
      return;
    }

    tbody.innerHTML = issues.map(issue => `
      <tr class="border-t hover:bg-gray-50">
        <td class="px-4 py-3 text-sm">#${issue.id}</td>
        <td class="px-4 py-3 text-sm font-medium">${issue.title}</td>
        <td class="px-4 py-3 text-sm">${issue.application_name}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${issue.affected_area || '-'}</td>
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
          <button onclick="showEditIssueModal(${issue.id})" class="text-green-600 hover:text-green-800 mr-3 transition" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteIssue(${issue.id})" class="text-red-600 hover:text-red-800 transition" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
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
}

// Handle create issue
async function handleCreateIssue(e) {
  e.preventDefault();
  const formData = {
    application_name: document.getElementById('application_name').value,
    affected_area: document.getElementById('affected_area').value,
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    type: document.getElementById('type').value,
    priority: document.getElementById('priority').value,
    assigned_to: document.getElementById('assigned_to').value || null,
    expected_completion_date: document.getElementById('expected_completion_date').value || null
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
  } catch (error) {
    alert('Error loading issue: ' + (error.response?.data?.error || error.message));
  }
}

// Handle edit issue
async function handleEditIssue(e) {
  e.preventDefault();
  const issueId = document.getElementById('issue_id').value;
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

// Initialize on page load
init();
