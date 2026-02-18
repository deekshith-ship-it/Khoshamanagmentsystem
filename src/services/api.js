const getApiBaseUrl = () => {
    // 1. Manually set environment variable takes precedence (Critical for Production)
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;

    const { hostname, protocol, port } = window.location;

    // 2. High-precision local network detection
    const isLocal =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.') ||
        hostname.endsWith('.local');

    // 3. Fix for mobile access:
    // If we're on a local network and using port 3000 (React),
    // we MUST talk directly to port 5000 to bypass proxy issues.
    if (isLocal && (port === '3000' || !port)) {
        const backendUrl = `${protocol}//${hostname}:5000/api`;
        return backendUrl;
    }

    // 4. Production: Call the Netlify Function directly
    // This bypasses the redirect layer and talks to the function endpoint
    return '/.netlify/functions/api/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log(`🌐 [Pro-Dev] API Service connecting to: ${API_BASE_URL}`);

// Helper function for API calls
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    });

    const contentType = response.headers.get('content-type');

    if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } else {
            const text = await response.text();
            errorMsg = text.slice(0, 50) + '...';
        }
        throw new Error(errorMsg);
    }

    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    throw new Error('Expected JSON response, but received HTML. This usually means the API path is incorrect or blocked.');
}

// ============== LEADS ==============
export const leadsAPI = {
    getAll: () => fetchAPI('/leads'),
    getById: (id) => fetchAPI(`/leads/${id}`),
    create: (data) => fetchAPI('/leads', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/leads/${id}`, {
        method: 'DELETE',
    }),
};

// ============== LEAD COMMENTS ==============
export const leadCommentsAPI = {
    getByLeadId: (leadId) => fetchAPI(`/leads/${leadId}/comments`),
    create: (data) => fetchAPI(`/leads/${data.lead_id}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (leadId, commentId) => fetchAPI(`/leads/${leadId}/comments/${commentId}`, {
        method: 'DELETE',
    }),
};

// ============== LEAD ACTIVITIES ==============
export const leadActivitiesAPI = {
    getByLeadId: (leadId) => fetchAPI(`/leads/${leadId}/activities`),
    create: (data) => fetchAPI(`/leads/${data.lead_id}/activities`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// ============== PROPOSALS ==============
export const proposalsAPI = {
    getAll: () => fetchAPI('/proposals'),
    getByLeadId: (leadId) => fetchAPI(`/leads/${leadId}/proposals`),
    create: (data) => fetchAPI('/proposals', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/proposals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/proposals/${id}`, {
        method: 'DELETE',
    }),
};

// ============== PROJECTS ==============
export const projectsAPI = {
    getAll: () => fetchAPI('/projects'),
    getById: (id) => fetchAPI(`/projects/${id}`),
    create: (data) => fetchAPI('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/projects/${id}`, {
        method: 'DELETE',
    }),
    // Project Tasks
    getTasks: (projectId) => fetchAPI(`/projects/${projectId}/tasks`),
    createTask: (projectId, data) => fetchAPI(`/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateTask: (projectId, taskId, data) => fetchAPI(`/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteTask: (projectId, taskId) => fetchAPI(`/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
    }),
    // Project Notes
    getNotes: (projectId) => fetchAPI(`/projects/${projectId}/notes`),
    createNote: (projectId, data) => fetchAPI(`/projects/${projectId}/notes`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    // Project Infrastructure Assets
    getLinkedAssets: (projectId) => fetchAPI(`/projects/${projectId}/assets`),
    linkAsset: (projectId, assetId) => fetchAPI(`/projects/${projectId}/assets`, {
        method: 'POST',
        body: JSON.stringify({ asset_id: assetId }),
    }),
    unlinkAsset: (projectId, assetId) => fetchAPI(`/projects/${projectId}/assets/${assetId}`, {
        method: 'DELETE',
    }),
};

// ============== TASKS ==============
export const tasksAPI = {
    getAll: () => fetchAPI('/tasks'),
    create: (data) => fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/tasks/${id}`, {
        method: 'DELETE',
    }),
};

// ============== INFRA ==============
export const infraAPI = {
    getAll: () => fetchAPI('/infra'),
    create: (data) => fetchAPI('/infra', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/infra/${id}`, {
        method: 'DELETE',
    }),
};

// ============== LINKS ==============
export const linksAPI = {
    getAll: () => fetchAPI('/links'),
    getStats: () => fetchAPI('/links/stats'),
    create: (data) => fetchAPI('/links', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// ============== AGREEMENTS ==============
export const agreementsAPI = {
    getAll: () => fetchAPI('/agreements'),
    create: (data) => fetchAPI('/agreements', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/agreements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/agreements/${id}`, {
        method: 'DELETE',
    }),
};

// ============== EMPLOYEES ==============
export const employeesAPI = {
    getAll: () => fetchAPI('/employees'),
    getById: (id) => fetchAPI(`/employees/${id}`),
    create: (data) => fetchAPI('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => fetchAPI(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => fetchAPI(`/employees/${id}`, {
        method: 'DELETE',
    }),
};

// ============== TEAM & ACTIVITY ==============
export const teamAPI = {
    getAll: () => fetchAPI('/team'),
    getActivity: () => fetchAPI('/activity'),
    getHours: () => fetchAPI('/team/hours'),
};

// ============== AUTH ==============
export const authAPI = {
    sendOTP: (phone) => fetchAPI('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
    }),
    login: (data) => fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    logout: (userId) => fetchAPI('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ userId }),
    }),
    heartbeat: (userId) => fetchAPI('/auth/heartbeat', {
        method: 'POST',
        body: JSON.stringify({ userId }),
    }),
};

// Health check
export const checkAPIHealth = () => fetchAPI('/health');

