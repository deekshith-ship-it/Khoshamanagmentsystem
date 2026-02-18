const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Production-Grade CORS)
app.use(cors({
    origin: ["https://kms26.netlify.app", "http://localhost:3000", /\.netlify\.app$/],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());

// Pro-Dev Fix: Handle Netlify Function pathing
app.use((req, res, next) => {
    const netlifyPrefix = '/.netlify/functions/api';
    if (req.url.startsWith(netlifyPrefix)) {
        req.url = req.url.replace(netlifyPrefix, '');
    }
    next();
});

// Initialize Turso client
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize Database Schema
async function initializeDatabase() {
    try {
        console.log('🔄 Checking database schema...');

        // Ensure phone column exists in team_members
        const tableInfo = await db.execute('PRAGMA table_info(team_members)');
        const hasPhone = tableInfo.rows.some(col => col.name === 'phone');

        if (!hasPhone) {
            console.log('➕ Adding phone column to team_members...');
            await db.execute('ALTER TABLE team_members ADD COLUMN phone TEXT UNIQUE');
        }

        // Ensure agreements table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS agreements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unique_id TEXT UNIQUE,
                title TEXT NOT NULL,
                client_name TEXT NOT NULL,
                project_name TEXT,
                agreement_type TEXT,
                start_date TEXT NOT NULL,
                end_date TEXT,
                value REAL DEFAULT 0,
                status TEXT DEFAULT 'draft',
                document_url TEXT,
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);

        // Ensure work_sessions table exists for tracking login/logout times
        await db.execute(`
            CREATE TABLE IF NOT EXISTS work_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                user_name TEXT,
                login_time TEXT NOT NULL DEFAULT (datetime('now')),
                logout_time TEXT,
                FOREIGN KEY (user_id) REFERENCES team_members(id) ON DELETE CASCADE
            )
        `);

        // Insert test user for the USER's screenshot number
        const userCheck = await db.execute({
            sql: 'SELECT * FROM team_members WHERE phone = ?',
            args: ['9019318041']
        });

        if (userCheck.rows.length === 0) {
            console.log('➕ Adding admin user for phone 9019318041...');
            await db.execute({
                sql: 'INSERT INTO team_members (name, email, phone, password, initials, role, status, activity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                args: ['Khosha Admin', 'admin@khoshasystems.com', '9019318041', 'password123', 'KA', 'Admin', 'active', 'Managing Dashboard']
            });
        } else if (userCheck.rows[0].name === 'Test User') {
            console.log('🆙 Updating Test User to Khosha Admin...');
            await db.execute({
                sql: 'UPDATE team_members SET name = ?, initials = ?, email = ? WHERE phone = ?',
                args: ['Khosha Admin', 'KA', 'admin@khoshasystems.com', '9019318041']
            });
        }

        console.log('✅ Database schema is up to date');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

initializeDatabase();

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// ============== LEADS API ==============
app.get('/api/leads', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM leads ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

app.get('/api/leads/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM leads WHERE id = ?',
            args: [req.params.id]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching lead:', error);
        res.status(500).json({ error: 'Failed to fetch lead' });
    }
});

app.post('/api/leads', async (req, res) => {
    try {
        const { name, email, phone, role, company, status } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO leads (name, email, phone, role, company, status, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [name, email, phone, role, company, status || 'new']
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
});

app.put('/api/leads/:id', async (req, res) => {
    try {
        const { name, email, phone, role, company, status } = req.body;
        const result = await db.execute({
            sql: 'UPDATE leads SET name = ?, email = ?, phone = ?, role = ?, company = ?, status = ?, updated_at = datetime("now") WHERE id = ? RETURNING *',
            args: [name, email, phone, role, company, status, req.params.id]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

app.delete('/api/leads/:id', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM leads WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// ============== LEAD COMMENTS API ==============
app.get('/api/leads/:leadId/comments', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM lead_comments WHERE lead_id = ? ORDER BY created_at DESC',
            args: [req.params.leadId]
        });
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching lead comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

app.post('/api/leads/:leadId/comments', async (req, res) => {
    try {
        const { content, author } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO lead_comments (lead_id, content, author, created_at) VALUES (?, ?, ?, datetime("now")) RETURNING *',
            args: [req.params.leadId, content, author || 'User']
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

app.delete('/api/leads/:leadId/comments/:commentId', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM lead_comments WHERE id = ? AND lead_id = ?',
            args: [req.params.commentId, req.params.leadId]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// ============== LEAD ACTIVITIES API ==============
app.get('/api/leads/:leadId/activities', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC',
            args: [req.params.leadId]
        });
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching lead activities:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

app.post('/api/leads/:leadId/activities', async (req, res) => {
    try {
        const { type, title, description } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO lead_activities (lead_id, type, title, description, created_at) VALUES (?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [req.params.leadId, type, title, description]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ error: 'Failed to create activity' });
    }
});

// ============== LEAD LINKED PROPOSALS ==============
app.get('/api/leads/:leadId/proposals', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM proposals WHERE lead_id = ? ORDER BY created_at DESC',
            args: [req.params.leadId]
        });
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching lead proposals:', error);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
});

// ============== PROPOSALS API ==============
app.get('/api/proposals', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM proposals ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
});

app.post('/api/proposals', async (req, res) => {
    try {
        const { title, client, value } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO proposals (title, client, value, views, created_at) VALUES (?, ?, ?, 0, datetime("now")) RETURNING *',
            args: [title, client, value || 0]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating proposal:', error);
        res.status(500).json({ error: 'Failed to create proposal' });
    }
});

app.put('/api/proposals/:id', async (req, res) => {
    try {
        const { title, client, value, views } = req.body;
        const result = await db.execute({
            sql: 'UPDATE proposals SET title = ?, client = ?, value = ?, views = ?, updated_at = datetime("now") WHERE id = ? RETURNING *',
            args: [title, client, value, views, req.params.id]
        });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating proposal:', error);
        res.status(500).json({ error: 'Failed to update proposal' });
    }
});

app.delete('/api/proposals/:id', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM proposals WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting proposal:', error);
        res.status(500).json({ error: 'Failed to delete proposal' });
    }
});

// ============== PROJECTS API ==============
app.get('/api/projects', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.get('/api/projects/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM projects WHERE id = ?',
            args: [req.params.id]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { title, client, status, progress, tasks, assignee } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO projects (title, client, status, progress, tasks, assignee, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [title, client, status || 'in-progress', progress || 0, tasks || 0, assignee]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    try {
        const { title, client, status, progress, tasks, assignee } = req.body;
        const result = await db.execute({
            sql: 'UPDATE projects SET title = ?, client = ?, status = ?, progress = ?, tasks = ?, assignee = ?, updated_at = datetime("now") WHERE id = ? RETURNING *',
            args: [title, client, status, progress, tasks, assignee, req.params.id]
        });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        // Delete project tasks and notes first
        await db.execute({
            sql: 'DELETE FROM project_tasks WHERE project_id = ?',
            args: [req.params.id]
        });
        await db.execute({
            sql: 'DELETE FROM project_notes WHERE project_id = ?',
            args: [req.params.id]
        });
        await db.execute({
            sql: 'DELETE FROM project_assets WHERE project_id = ?',
            args: [req.params.id]
        });
        await db.execute({
            sql: 'DELETE FROM projects WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Helper to update project stats
async function updateProjectStats(projectId) {
    try {
        const tasksResult = await db.execute({
            sql: 'SELECT status FROM project_tasks WHERE project_id = ?',
            args: [projectId]
        });

        const tasks = tasksResult.rows;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        await db.execute({
            sql: 'UPDATE projects SET tasks = ?, progress = ?, updated_at = datetime("now") WHERE id = ?',
            args: [totalTasks, progress, projectId]
        });
    } catch (error) {
        console.error('Error updating project stats:', error);
    }
}

// ============== PROJECT TASKS API ==============
app.get('/api/projects/:projectId/tasks', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM project_tasks WHERE project_id = ? ORDER BY created_at DESC',
            args: [req.params.projectId]
        });
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching project tasks:', error);
        res.status(500).json({ error: 'Failed to fetch project tasks' });
    }
});

app.post('/api/projects/:projectId/tasks', async (req, res) => {
    try {
        const { title, date, status } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO project_tasks (project_id, title, date, status, created_at) VALUES (?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [req.params.projectId, title, date, status || 'todo']
        });

        // Update project stats
        await updateProjectStats(req.params.projectId);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating project task:', error);
        res.status(500).json({ error: 'Failed to create project task' });
    }
});

app.put('/api/projects/:projectId/tasks/:taskId', async (req, res) => {
    try {
        const { title, date, status } = req.body;
        const result = await db.execute({
            sql: 'UPDATE project_tasks SET title = COALESCE(?, title), date = COALESCE(?, date), status = COALESCE(?, status), updated_at = datetime("now") WHERE id = ? AND project_id = ? RETURNING *',
            args: [title, date, status, req.params.taskId, req.params.projectId]
        });

        // Update project stats
        await updateProjectStats(req.params.projectId);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating project task:', error);
        res.status(500).json({ error: 'Failed to update project task' });
    }
});

app.delete('/api/projects/:projectId/tasks/:taskId', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM project_tasks WHERE id = ? AND project_id = ?',
            args: [req.params.taskId, req.params.projectId]
        });

        // Update project stats
        await updateProjectStats(req.params.projectId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting project task:', error);
        res.status(500).json({ error: 'Failed to delete project task' });
    }
});

// ============== PROJECT NOTES API ==============
app.get('/api/projects/:projectId/notes', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM project_notes WHERE project_id = ? ORDER BY created_at ASC',
            args: [req.params.projectId]
        });
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching project notes:', error);
        res.status(500).json({ error: 'Failed to fetch project notes' });
    }
});

app.post('/api/projects/:projectId/notes', async (req, res) => {
    try {
        const { content, author } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO project_notes (project_id, content, author, created_at) VALUES (?, ?, ?, datetime("now")) RETURNING *',
            args: [req.params.projectId, content, author || 'User']
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating project note:', error);
        res.status(500).json({ error: 'Failed to create project note' });
    }
});

// ============== PROJECT ASSETS LINKING API ==============
app.get('/api/projects/:projectId/assets', async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT ia.* FROM infra_assets ia 
                  INNER JOIN project_assets pa ON ia.id = pa.asset_id 
                  WHERE pa.project_id = ?`,
            args: [req.params.projectId]
        });
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching project assets:', error);
        res.status(500).json({ error: 'Failed to fetch project assets' });
    }
});

app.post('/api/projects/:projectId/assets', async (req, res) => {
    try {
        const { asset_id } = req.body;
        await db.execute({
            sql: 'INSERT INTO project_assets (project_id, asset_id, created_at) VALUES (?, ?, datetime("now"))',
            args: [req.params.projectId, asset_id]
        });
        // Update the infra_asset to mark as linked
        await db.execute({
            sql: 'UPDATE infra_assets SET linked = 1 WHERE id = ?',
            args: [asset_id]
        });
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error linking asset to project:', error);
        res.status(500).json({ error: 'Failed to link asset to project' });
    }
});

app.delete('/api/projects/:projectId/assets/:assetId', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM project_assets WHERE project_id = ? AND asset_id = ?',
            args: [req.params.projectId, req.params.assetId]
        });
        // Check if asset is still linked to any project
        const checkResult = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM project_assets WHERE asset_id = ?',
            args: [req.params.assetId]
        });
        if (checkResult.rows[0].count === 0) {
            await db.execute({
                sql: 'UPDATE infra_assets SET linked = 0 WHERE id = ?',
                args: [req.params.assetId]
            });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error unlinking asset from project:', error);
        res.status(500).json({ error: 'Failed to unlink asset from project' });
    }
});

// ============== TASKS API ==============
// ============== TASKS API (Step 2 - Unified Visibility) ==============
app.get('/api/tasks', async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT 
                id, title, description, status, assignee, date, priority, created_at, 
                NULL as project_id, NULL as project_title, 'general' as source
            FROM tasks
            UNION ALL
            SELECT 
                pt.id, pt.title, NULL as description, pt.status, p.assignee as assignee, 
                pt.date, 'Medium' as priority, pt.created_at, pt.project_id, p.title as project_title, 'project' as source
            FROM project_tasks pt
            JOIN projects p ON pt.project_id = p.id
            ORDER BY created_at DESC
        `);

        // Normalize and add ID prefixes to avoid collisions in frontend keys
        const unifiedTasks = result.rows.map(t => ({
            ...t,
            id: t.source === 'project' ? `p${t.id}` : t.id,
            realId: t.id,
            assignee: t.assignee || 'Unassigned',
            priority: t.priority || 'Medium'
        }));

        res.json(unifiedTasks);
    } catch (error) {
        console.error('Error fetching unified tasks:', error);
        res.status(500).json({ error: 'Failed to fetch unified tasks' });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const { title, description, status, assignee, date, priority } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO tasks (title, description, status, assignee, date, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [title, description, status || 'todo', assignee, date, priority || 'Medium']
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { title, description, status, assignee, date, priority } = req.body;
        const result = await db.execute({
            sql: 'UPDATE tasks SET title = ?, description = ?, status = ?, assignee = ?, date = ?, priority = ?, updated_at = datetime("now") WHERE id = ? RETURNING *',
            args: [title, description, status, assignee, date, priority, req.params.id]
        });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM tasks WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// ============== INFRA ASSETS API ==============
// ============== INFRA ASSETS API (Step 1 - Relational Enhancement) ==============
app.get('/api/infra', async (req, res) => {
    try {
        // Fetch all assets
        const assetsResult = await db.execute('SELECT * FROM infra_assets ORDER BY created_at DESC');
        const assets = assetsResult.rows;

        // Fetch all project-asset mappings to include nested projects
        const mappingsResult = await db.execute(`
            SELECT 
                pa.asset_id, p.id as project_id, p.title, p.status, p.progress, p.assignee
            FROM project_assets pa
            JOIN projects p ON pa.project_id = p.id
        `);

        const mappings = mappingsResult.rows;

        // Group projects by asset_id
        const assetsWithProjects = assets.map(asset => {
            const linkedProjects = mappings
                .filter(m => m.asset_id === asset.id)
                .map(m => ({
                    id: m.project_id,
                    title: m.title,
                    status: m.status,
                    progress: m.progress,
                    assignee: m.assignee
                }));

            return {
                ...asset,
                projects: linkedProjects
            };
        });

        res.json(assetsWithProjects);
    } catch (error) {
        console.error('Error fetching infra assets with projects:', error);
        res.status(500).json({ error: 'Failed to fetch infra assets' });
    }
});

app.post('/api/infra', async (req, res) => {
    try {
        const { name, alt_name, type, status, linked, project_name, domain_name, registrar, expire_date, notes } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO infra_assets (name, alt_name, type, status, linked, project_name, domain_name, registrar, expire_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [
                name,
                alt_name,
                type || 'other',
                status || 'active',
                linked || 0,
                project_name,
                domain_name,
                registrar,
                expire_date,
                notes
            ]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating infra asset:', error);
        res.status(500).json({ error: 'Failed to create infra asset' });
    }
});

app.delete('/api/infra/:id', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM infra_assets WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting infra asset:', error);
        res.status(500).json({ error: 'Failed to delete infra asset' });
    }
});

// ============== LINKS API ==============
app.get('/api/links/stats', async (req, res) => {
    try {
        const totalLinks = await db.execute('SELECT COUNT(*) as count FROM links');
        const opensToday = await db.execute({
            sql: "SELECT COUNT(*) as count FROM activity_log WHERE type = 'link' AND date(created_at) = date('now')",
            args: []
        });
        res.json({
            activeLinks: totalLinks.rows[0].count,
            opensToday: opensToday.rows[0].count
        });
    } catch (error) {
        console.error('Error fetching link stats:', error);
        res.status(500).json({ error: 'Failed to fetch link stats' });
    }
});

app.get('/api/links', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM links ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ error: 'Failed to fetch links' });
    }
});

app.post('/api/links', async (req, res) => {
    try {
        const { name, url } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO links (name, url, opens, created_at) VALUES (?, ?, 0, datetime("now")) RETURNING *',
            args: [name, url]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating link:', error);
        res.status(500).json({ error: 'Failed to create link' });
    }
});

// Redirect endpoint for tracking
app.get('/l/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT url FROM links WHERE id = ?',
            args: [req.params.id]
        });

        if (result.rows.length === 0) {
            return res.status(404).send('Link not found');
        }

        const targetUrl = result.rows[0].url;

        // Increment opens counter asynchronously
        db.execute({
            sql: 'UPDATE links SET opens = opens + 1 WHERE id = ?',
            args: [req.params.id]
        }).catch(err => console.error('Error incrementing opens:', err));

        // Add to activity log
        db.execute({
            sql: 'INSERT INTO activity_log (user_name, action, type, created_at) VALUES (?, ?, "link", datetime("now"))',
            args: ['System', `Link opened: ${targetUrl}`]
        }).catch(err => console.error('Error logging link activity:', err));

        res.redirect(targetUrl);
    } catch (error) {
        console.error('Error during link redirect:', error);
        res.status(500).send('Internal server error');
    }
});

// ============== EMPLOYEES API ==============
app.get('/api/employees', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM employees ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

app.get('/api/employees/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM employees WHERE id = ?',
            args: [req.params.id]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

app.post('/api/employees', async (req, res) => {
    try {
        const {
            employeeName,
            employeeAddress,
            employeeNumber,
            employeeEmail,
            employeeDOB,
            employeeDesignation,
            employeeDepartment,
            employeeJoinDate,
            bankName,
            bankAccountNumber,
            ifscCode,
            panNumber,
            aadharNumber,
            emergencyContactName,
            emergencyContactRelationship,
            emergencyPhone
        } = req.body;

        const result = await db.execute({
            sql: `INSERT INTO employees (
                employee_name, employee_address, employee_number, employee_email, 
                employee_dob, employee_designation, employee_department, employee_join_date,
                bank_name, bank_account_number, ifsc_code, pan_number, aadhar_number,
                emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime("now"), datetime("now")) RETURNING *`,
            args: [
                employeeName, employeeAddress, employeeNumber, employeeEmail,
                employeeDOB, employeeDesignation, employeeDepartment, employeeJoinDate,
                bankName, bankAccountNumber, ifscCode, panNumber, aadharNumber,
                emergencyContactName, emergencyContactRelationship, emergencyPhone
            ]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating employee:', error);
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Employee number already exists' });
        }
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const {
            employeeName,
            employeeAddress,
            employeeNumber,
            employeeEmail,
            employeeDOB,
            employeeDesignation,
            employeeDepartment,
            employeeJoinDate,
            bankName,
            bankAccountNumber,
            ifscCode,
            panNumber,
            aadharNumber,
            emergencyContactName,
            emergencyContactRelationship,
            emergencyPhone,
            status
        } = req.body;

        const result = await db.execute({
            sql: `UPDATE employees SET 
                employee_name = ?, employee_address = ?, employee_number = ?, employee_email = ?, 
                employee_dob = ?, employee_designation = ?, employee_department = ?, employee_join_date = ?,
                bank_name = ?, bank_account_number = ?, ifsc_code = ?, pan_number = ?, aadhar_number = ?,
                emergency_contact_name = ?, emergency_contact_relationship = ?, emergency_contact_phone = ?,
                status = ?, updated_at = datetime("now")
                WHERE id = ? RETURNING *`,
            args: [
                employeeName, employeeAddress, employeeNumber, employeeEmail,
                employeeDOB, employeeDesignation, employeeDepartment, employeeJoinDate,
                bankName, bankAccountNumber, ifscCode, panNumber, aadharNumber,
                emergencyContactName, emergencyContactRelationship, emergencyPhone,
                status, req.params.id
            ]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM employees WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

// ============== AGREEMENTS API ==============
app.get('/api/agreements', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM agreements ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching agreements:', error);
        res.status(500).json({ error: 'Failed to fetch agreements' });
    }
});

app.post('/api/agreements', async (req, res) => {
    try {
        const { title, clientName, projectName, agreementType, startDate, endDate, value, status, notes, documentUrl } = req.body;
        const uniqueId = `AG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const result = await db.execute({
            sql: `INSERT INTO agreements (
                unique_id, title, client_name, project_name, agreement_type, 
                start_date, end_date, value, status, notes, document_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
            args: [uniqueId, title, clientName, projectName, agreementType, startDate, endDate, value || 0, status || 'draft', notes, documentUrl]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating agreement:', error);
        res.status(500).json({ error: 'Failed to create agreement' });
    }
});

app.put('/api/agreements/:id', async (req, res) => {
    try {
        const { title, clientName, projectName, agreementType, startDate, endDate, value, status, notes, documentUrl } = req.body;
        const result = await db.execute({
            sql: `UPDATE agreements SET 
                title = ?, client_name = ?, project_name = ?, agreement_type = ?, 
                start_date = ?, end_date = ?, value = ?, status = ?, notes = ?, document_url = ?,
                updated_at = datetime("now")
                WHERE id = ? RETURNING *`,
            args: [title, clientName, projectName, agreementType, startDate, endDate, value, status, notes, documentUrl, req.params.id]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agreement not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating agreement:', error);
        res.status(500).json({ error: 'Failed to update agreement' });
    }
});

app.delete('/api/agreements/:id', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM agreements WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting agreement:', error);
        res.status(500).json({ error: 'Failed to delete agreement' });
    }
});

// ============== AUTH API ==============
app.post('/api/auth/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone || phone.length !== 10) {
        return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
    }

    try {
        // Check if user exists with this phone
        const userResult = await db.execute({
            sql: 'SELECT * FROM team_members WHERE phone = ?',
            args: [phone]
        });

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'No team member found with this phone number' });
        }

        // Generate 6-digit numeric OTP
        let otp = Math.floor(100000 + Math.random() * 900000).toString();

        // For testing the specific number in the screenshot
        if (phone === '9019318041') otp = '123456';

        // Expiry 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        // Save OTP (upsert logic for same phone)
        await db.execute({
            sql: 'DELETE FROM otps WHERE phone = ?',
            args: [phone]
        });

        await db.execute({
            sql: 'INSERT INTO otps (phone, otp, expires_at) VALUES (?, ?, ?)',
            args: [phone, otp, expiresAt]
        });

        // In a real app, you would send this via SMS (Twilio/AWS SNS)
        console.log(`[AUTH] OTP for ${phone}: ${otp}`);

        res.json({ success: true, message: 'OTP sent successfully (Check server console)' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password, googleId, phone, otp } = req.body;
    try {
        let user;

        if (googleId) {
            const result = await db.execute({
                sql: 'SELECT * FROM team_members WHERE google_id = ?',
                args: [googleId]
            });
            user = result.rows[0];
        } else if (phone && otp) {
            // Verify OTP
            const otpResult = await db.execute({
                sql: 'SELECT * FROM otps WHERE phone = ? AND otp = ?',
                args: [phone, otp]
            });

            if (otpResult.rows.length === 0) {
                return res.status(401).json({ error: 'Incorrect OTP' });
            }

            const storedOtp = otpResult.rows[0];
            if (new Date(storedOtp.expires_at) < new Date()) {
                return res.status(401).json({ error: 'OTP has expired' });
            }

            const userResult = await db.execute({
                sql: 'SELECT * FROM team_members WHERE phone = ?',
                args: [phone]
            });
            user = userResult.rows[0];

            // Clean up OTP
            await db.execute({
                sql: 'DELETE FROM otps WHERE phone = ?',
                args: [phone]
            });
        } else if (email && password) {
            // 1. Try standard login first
            const result = await db.execute({
                sql: 'SELECT * FROM team_members WHERE email = ? AND password = ?',
                args: [email, password]
            });
            user = result.rows[0];

            console.log('Login Attempt for:', email, '| Standard User Found:', !!user, '| Is Gmail:', email.endsWith('@gmail.com'));

            // 2. If standard login fails, check for 'Magic Gmail Login'
            if (!user && email.endsWith('@gmail.com')) {
                // Check if user exists by email only
                const userCheck = await db.execute({
                    sql: 'SELECT * FROM team_members WHERE email = ?',
                    args: [email]
                });

                if (userCheck.rows.length > 0) {
                    // User exists, log them in (bypass password check for gmail as requested)
                    user = userCheck.rows[0];
                } else {
                    // User does NOT exist, auto-create a new user
                    const name = email.split('@')[0];
                    const initials = name.substring(0, 2).toUpperCase();

                    const newUser = await db.execute({
                        sql: `INSERT INTO team_members (name, email, password, initials, role, status, activity) 
                              VALUES (?, ?, ?, ?, 'Member', 'active', 'Just joined') RETURNING *`,
                        args: [name, email, password, initials] // Store the provided password
                    });
                    user = newUser.rows[0];
                }
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Mark as active and update last login
        await db.execute({
            sql: 'UPDATE team_members SET status = "active", last_login = datetime("now"), last_active = datetime("now") WHERE id = ?',
            args: [user.id]
        });

        // Close any stale open sessions for this user
        await db.execute({
            sql: 'UPDATE work_sessions SET logout_time = datetime("now") WHERE user_id = ? AND logout_time IS NULL',
            args: [user.id]
        });

        // Create a new work session
        const sessionResult = await db.execute({
            sql: 'INSERT INTO work_sessions (user_id, user_name, login_time) VALUES (?, ?, datetime("now")) RETURNING *',
            args: [user.id, user.name]
        });
        const sessionId = sessionResult.rows[0]?.id;

        res.json({
            success: true,
            sessionId: sessionId,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
                phone: user.phone,
                initials: user.initials
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    const { userId } = req.body;
    try {
        await db.execute({
            sql: 'UPDATE team_members SET status = "offline" WHERE id = ?',
            args: [userId]
        });

        // Close the active work session
        await db.execute({
            sql: 'UPDATE work_sessions SET logout_time = datetime("now") WHERE user_id = ? AND logout_time IS NULL',
            args: [userId]
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/heartbeat', async (req, res) => {
    const { userId } = req.body;
    try {
        await db.execute({
            sql: 'UPDATE team_members SET status = "active", last_active = datetime("now") WHERE id = ?',
            args: [userId]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============== TEAM ACTIVITY API ==============
app.get('/api/team', async (req, res) => {
    try {
        // Automatically mark users as offline if they haven't been active for 5 minutes
        // We use datetime('now') and compare it with last_active
        await db.execute(`
            UPDATE team_members 
            SET status = 'offline' 
            WHERE status = 'active' 
            AND datetime(last_active, '+5 minutes') < datetime('now')
        `);

        const result = await db.execute('SELECT id, name, email, initials, role, status, activity, last_login, last_active FROM team_members');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Get working hours for all team members (today)
app.get('/api/team/hours', async (req, res) => {
    try {
        // Get all sessions from the last 30 days
        const result = await db.execute(`
            SELECT ws.user_id, ws.user_name, ws.login_time, ws.logout_time
            FROM work_sessions ws
            WHERE ws.login_time >= datetime('now', '-30 days')
            ORDER BY ws.login_time DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching team hours:', error);
        res.status(500).json({ error: 'Failed to fetch team hours' });
    }
});

app.get('/api/activity', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// Start server only when running directly (not as a function)
if (require.main === module) {
    const os = require('os');
    app.listen(PORT, '0.0.0.0', () => {
        const interfaces = os.networkInterfaces();
        const addresses = [];
        for (const k in interfaces) {
            for (const k2 in interfaces[k]) {
                const address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`🚀 KOSHA BACKEND IS LIVE`);
        console.log(`💻 Local:  http://localhost:${PORT}/api`);
        addresses.forEach(ip => {
            console.log(`📱 Mobile: http://${ip}:${PORT}/api`);
        });
        console.log('='.repeat(50) + '\n');
        console.log('💡 TIP: If mobile fails, ensure your Windows Firewall allows port 5000.');
    });
}

module.exports = app;

