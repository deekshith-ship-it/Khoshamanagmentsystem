const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all tasks (unified: general + project tasks)
router.get('/', async (req, res) => {
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

// CREATE task
router.post('/', async (req, res) => {
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

// UPDATE task
router.put('/:id', async (req, res) => {
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

// DELETE task
router.delete('/:id', async (req, res) => {
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

module.exports = router;
