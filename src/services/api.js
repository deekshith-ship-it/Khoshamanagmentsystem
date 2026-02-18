// ========================================
// KHOSHA API SERVICE - Foolproof Edition
// ========================================
// 
// HOW IT WORKS:
// - LOCAL (dev):  React proxy forwards /api/* to localhost:5000
// - NETLIFY:      netlify.toml redirects /api/* to the serverless function
// - MOBILE (LAN): Connects directly to backend on port 5000
//
// The frontend ALWAYS calls /api/... — nothing else changes.
// ========================================

const getApiBaseUrl = () => {
    // 1. Manual override via environment variable
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;

    const { hostname, protocol, port } = window.location;

    // 2. Local network detection (dev server / mobile on LAN)
    const isLocal =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.') ||
        hostname.endsWith('.local');

    if (isLocal && (port === '3000' || !port)) {
        // Dev server on port 3000 → talk to Express on port 5000
        return `${protocol}//${hostname}:5000/api`;
    }

    // 3. Production (Netlify) — just use /api
    // The netlify.toml redirect handles /api/* → serverless function
    return '/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log(`🌐 API Service → ${API_BASE_URL}`);

// ========================================
// CORE FETCH HELPER
// ========================================
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const contentType = response.headers.get('content-type');

        // Check if we got HTML back instead of JSON (means routing is broken)
        if (contentType && contentType.includes('text/html')) {
            console.error(`❌ API returned HTML instead of JSON for: ${url}`);
            console.error('   This means the API redirect is not working.');
            throw new Error(
                'API connection error: received HTML instead of JSON. ' +
                'Please check the Netlify deployment and environment variables.'
            );
        }

        if (!response.ok) {
            let errorMsg = `Server error (${response.status})`;
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            }
            throw new Error(errorMsg);
        }

        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }

        // If response is ok but not JSON, return empty
        return {};
    } catch (error) {
        // Network errors (server down, CORS, etc.)
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error(`❌ Network error calling: ${url}`);
            throw new Error('Cannot reach the server. Please check your connection.');
        }
        throw error;
    }
}

// ========================================
// API ENDPOINTS
// ========================================

// LEADS
export const leadsAPI = {
    getAll: () => fetchAPI('/leads'),
    getById: (id) => fetchAPI(`/leads/${id}`),
    create: (data) => fetchAPI('/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/leads/${id}`, { method: 'DELETE' }),
};

// LEAD COMMENTS
export const leadCommentsAPI = {
    getByLeadId: (leadId) => fetchAPI(`/leads/${leadId}/comments`),
    create: (data) => fetchAPI(`/leads/${data.lead_id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (leadId, commentId) => fetchAPI(`/leads/${leadId}/comments/${commentId}`, { method: 'DELETE' }),
};

// LEAD ACTIVITIES
export const leadActivitiesAPI = {
    getByLeadId: (leadId) => fetchAPI(`/leads/${leadId}/activities`),
    create: (data) => fetchAPI(`/leads/${data.lead_id}/activities`, { method: 'POST', body: JSON.stringify(data) }),
};

// PROPOSALS
export const proposalsAPI = {
    getAll: () => fetchAPI('/proposals'),
    getByLeadId: (leadId) => fetchAPI(`/leads/${leadId}/proposals`),
    create: (data) => fetchAPI('/proposals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/proposals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/proposals/${id}`, { method: 'DELETE' }),
};

// PROJECTS
export const projectsAPI = {
    getAll: () => fetchAPI('/projects'),
    getById: (id) => fetchAPI(`/projects/${id}`),
    create: (data) => fetchAPI('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/projects/${id}`, { method: 'DELETE' }),
    // Project Tasks
    getTasks: (projectId) => fetchAPI(`/projects/${projectId}/tasks`),
    createTask: (projectId, data) => fetchAPI(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
    updateTask: (projectId, taskId, data) => fetchAPI(`/projects/${projectId}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTask: (projectId, taskId) => fetchAPI(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' }),
    // Project Notes
    getNotes: (projectId) => fetchAPI(`/projects/${projectId}/notes`),
    createNote: (projectId, data) => fetchAPI(`/projects/${projectId}/notes`, { method: 'POST', body: JSON.stringify(data) }),
    // Project Assets
    getLinkedAssets: (projectId) => fetchAPI(`/projects/${projectId}/assets`),
    linkAsset: (projectId, assetId) => fetchAPI(`/projects/${projectId}/assets`, { method: 'POST', body: JSON.stringify({ asset_id: assetId }) }),
    unlinkAsset: (projectId, assetId) => fetchAPI(`/projects/${projectId}/assets/${assetId}`, { method: 'DELETE' }),
};

// TASKS
export const tasksAPI = {
    getAll: () => fetchAPI('/tasks'),
    create: (data) => fetchAPI('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/tasks/${id}`, { method: 'DELETE' }),
};

// INFRA
export const infraAPI = {
    getAll: () => fetchAPI('/infra'),
    create: (data) => fetchAPI('/infra', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/infra/${id}`, { method: 'DELETE' }),
};

// LINKS
export const linksAPI = {
    getAll: () => fetchAPI('/links'),
    getStats: () => fetchAPI('/links/stats'),
    create: (data) => fetchAPI('/links', { method: 'POST', body: JSON.stringify(data) }),
};

// AGREEMENTS
export const agreementsAPI = {
    getAll: () => fetchAPI('/agreements'),
    create: (data) => fetchAPI('/agreements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/agreements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/agreements/${id}`, { method: 'DELETE' }),
};

// EMPLOYEES
export const employeesAPI = {
    getAll: () => fetchAPI('/employees'),
    getById: (id) => fetchAPI(`/employees/${id}`),
    create: (data) => fetchAPI('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/employees/${id}`, { method: 'DELETE' }),
};

// TEAM & ACTIVITY
export const teamAPI = {
    getAll: () => fetchAPI('/team'),
    getActivity: () => fetchAPI('/activity'),
    getHours: () => fetchAPI('/team/hours'),
};

// AUTH
export const authAPI = {
    sendOTP: (phone) => fetchAPI('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
    login: (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: (userId) => fetchAPI('/auth/logout', { method: 'POST', body: JSON.stringify({ userId }) }),
    heartbeat: (userId) => fetchAPI('/auth/heartbeat', { method: 'POST', body: JSON.stringify({ userId }) }),
};

// HEALTH CHECK
export const checkAPIHealth = () => fetchAPI('/health');
