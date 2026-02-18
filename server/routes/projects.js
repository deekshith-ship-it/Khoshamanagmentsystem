const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Helper to update project stats after task changes
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
    try {
        await db.execute({ sql: 'DELETE FROM project_tasks WHERE project_id = ?', args: [req.params.id] });
        await db.execute({ sql: 'DELETE FROM project_notes WHERE project_id = ?', args: [req.params.id] });
        await db.execute({ sql: 'DELETE FROM project_assets WHERE project_id = ?', args: [req.params.id] });
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
            sql: 'SELECT * FROM project_tasks WHERE project_id = ? ORDER BY created_at DESC',
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
        const { title, date, status } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO project_tasks (project_id, title, date, status, created_at) VALUES (?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [req.params.projectId, title, date, status || 'todo']
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
        const { title, date, status } = req.body;
        const result = await db.execute({
            sql: 'UPDATE project_tasks SET title = COALESCE(?, title), date = COALESCE(?, date), status = COALESCE(?, status), updated_at = datetime("now") WHERE id = ? AND project_id = ? RETURNING *',
            args: [title, date, status, req.params.taskId, req.params.projectId]
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
            sql: 'DELETE FROM project_tasks WHERE id = ? AND project_id = ?',
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

// ============ PROJECT ASSETS ============
router.get('/:projectId/assets', async (req, res) => {
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

router.post('/:projectId/assets', async (req, res) => {
    try {
        const { asset_id } = req.body;
        await db.execute({
            sql: 'INSERT INTO project_assets (project_id, asset_id, created_at) VALUES (?, ?, datetime("now"))',
            args: [req.params.projectId, asset_id]
        });
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

router.delete('/:projectId/assets/:assetId', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM project_assets WHERE project_id = ? AND asset_id = ?',
            args: [req.params.projectId, req.params.assetId]
        });
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

module.exports = router;
