const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// Helper to update project stats after task changes
async function updateProjectStats(projectId) {
    try {
        const tasksResult = await db.execute({
            sql: 'SELECT status FROM tasks WHERE project_id = ?',
            args: [projectId]
        });

        const tasks = tasksResult.rows;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        // Requirement: 0 tasks = 100% progress
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

        await db.execute({
            sql: 'UPDATE projects SET progress = ?, updated_at = datetime("now") WHERE id = ?',
            args: [progress, projectId]
        });
    } catch (error) {
        console.error('Error updating project stats:', error);
    }
}

// ============ PROJECTS CRUD ============
router.get('/', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

router.get('/:id', async (req, res) => {
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

router.post('/', async (req, res) => {
    try {
        const { title, client, status, progress, tasks, assignee, proposal_id, lead_id } = req.body;

        // Ensure strictly required fields are present
        if (!title) {
            return res.status(400).json({ error: 'Project title is required' });
        }

        console.log('📝 Creating project with payload:', req.body);
        const result = await db.execute({
            sql: 'INSERT INTO projects (title, client, status, progress, tasks, assignee, proposal_id, lead_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [
                title,
                client || null,
                status || 'in-progress',
                progress || 0,
                tasks || 0,
                assignee || null,
                proposal_id || null,
                lead_id || null
            ]
        });
        console.log('✅ Project created successfully:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error creating project:', error);
        // Log to a file as well
        require('fs').appendFileSync('error_log.txt', `[${new Date().toISOString()}] Project Creation Error: ${error.stack}\n`);
        res.status(500).json({
            error: error.message || 'Failed to create project',
            details: error.toString(),
            stack: error.stack
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { title, client, status, progress, tasks, assignee, proposal_id, lead_id } = req.body;
        const result = await db.execute({
            sql: 'UPDATE projects SET title = ?, client = ?, status = ?, progress = ?, tasks = ?, assignee = ?, proposal_id = ?, lead_id = ?, updated_at = datetime("now") WHERE id = ? RETURNING *',
            args: [title, client, status, progress, tasks, assignee, proposal_id, lead_id, req.params.id]
        });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        // Cleanup related data (Cascade should handle tasks if FK is set, but explicit cleanup doesn't hurt)
        await db.execute({ sql: 'DELETE FROM tasks WHERE project_id = ?', args: [req.params.id] });
        await db.execute({ sql: 'DELETE FROM project_notes WHERE project_id = ?', args: [req.params.id] });
        await db.execute({ sql: 'DELETE FROM project_infra WHERE project_id = ?', args: [req.params.id] });
        await db.execute({ sql: 'DELETE FROM project_assets WHERE project_id = ?', args: [req.params.id] }); // Cleanup legacy if exists
        await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [req.params.id] });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// ============ PROJECT TASKS ============
router.get('/:projectId/tasks', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC',
            args: [req.params.projectId]
        });
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching project tasks:', error);
        res.status(500).json({ error: 'Failed to fetch project tasks' });
    }
});

router.post('/:projectId/tasks', async (req, res) => {
    try {
        const { text, status, notes, dependencies, credentials } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO tasks (project_id, text, status, notes, dependencies, credentials, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [req.params.projectId, text, status || 'todo', notes || '', dependencies || '', credentials || '']
        });
        await updateProjectStats(req.params.projectId);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating project task:', error);
        res.status(500).json({ error: 'Failed to create project task' });
    }
});

router.put('/:projectId/tasks/:taskId', async (req, res) => {
    try {
        const { text, status, notes, dependencies, credentials } = req.body;
        const result = await db.execute({
            sql: 'UPDATE tasks SET text = COALESCE(?, text), status = COALESCE(?, status), notes = COALESCE(?, notes), dependencies = COALESCE(?, dependencies), credentials = COALESCE(?, credentials), updated_at = datetime("now") WHERE id = ? AND project_id = ? RETURNING *',
            args: [text, status, notes, dependencies, credentials, req.params.taskId, req.params.projectId]
        });
        await updateProjectStats(req.params.projectId);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating project task:', error);
        res.status(500).json({ error: 'Failed to update project task' });
    }
});

router.delete('/:projectId/tasks/:taskId', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM tasks WHERE id = ? AND project_id = ?',
            args: [req.params.taskId, req.params.projectId]
        });
        await updateProjectStats(req.params.projectId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting project task:', error);
        res.status(500).json({ error: 'Failed to delete project task' });
    }
});

// ============ PROJECT NOTES ============
router.get('/:projectId/notes', async (req, res) => {
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

router.post('/:projectId/notes', async (req, res) => {
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

// ============ PROJECT ASSETS (INFRA) ============
router.get('/:projectId/assets', async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT ia.* FROM infra_assets ia 
                  INNER JOIN project_infra pi ON ia.id = pi.infra_id 
                  WHERE pi.project_id = ?`,
            args: [req.params.projectId]
        });
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching project assets:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/:projectId/assets', async (req, res) => {
    try {
        const { asset_id } = req.body;
        await db.execute({
            sql: 'INSERT INTO project_infra (project_id, infra_id, created_at) VALUES (?, ?, datetime("now"))',
            args: [req.params.projectId, asset_id]
        });
        res.status(201).json({ success: true });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Already linked' });
        }
        res.status(500).json({ error: 'Failed' });
    }
});

router.delete('/:projectId/assets/:assetId', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM project_infra WHERE project_id = ? AND infra_id = ?',
            args: [req.params.projectId, req.params.assetId]
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
