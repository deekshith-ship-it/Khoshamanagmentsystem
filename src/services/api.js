// API service for connecting to the backend
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Helper function for API calls
async function fetchAPI(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        let errorMsg = 'Request failed';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (e) {
            // If not JSON, try text
            const text = await response.text().catch(() => '');
            if (text) errorMsg = text.slice(0, 100);
        }
        throw new Error(errorMsg);
    }

    return response.json();
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

