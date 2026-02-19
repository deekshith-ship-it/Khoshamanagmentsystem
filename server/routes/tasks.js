const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const result = await db.execute({
            sql: `
                SELECT t.*, p.title as project_name 
                FROM tasks t 
                LEFT JOIN projects p ON t.project_id = p.id 
                ORDER BY t.created_at DESC
            `,
            args: []
        });
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get single task details with subtasks and comments
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const taskResult = await db.execute({
            sql: `SELECT t.*, p.title as project_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = ?`,
            args: [id]
        });

        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const subtasksResult = await db.execute({
            sql: 'SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC',
            args: [id]
        });

        const commentsResult = await db.execute({
            sql: 'SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at DESC',
            args: [id]
        });

        res.json({
            ...taskResult.rows[0],
            subtasks: subtasksResult.rows,
            comments: commentsResult.rows
        });
    } catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).json({ error: 'Failed to fetch task details' });
    }
});

// Create task
router.post('/', async (req, res) => {
    try {
        const { text, status, project_id, notes, dependencies, credentials } = req.body;

        // Validation
        if (!text) return res.status(400).json({ error: 'Task title is required' });

        const result = await db.execute({
            sql: 'INSERT INTO tasks (text, status, project_id, notes, dependencies, credentials) VALUES (?, ?, ?, ?, ?, ?) RETURNING *',
            args: [text, status || 'todo', project_id || null, notes, dependencies, credentials]
        });

        const newTask = result.rows[0];

        // Update Project Progress if linked
        if (project_id) {
            await updateProjectProgress(project_id);
        }

        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { text, status, project_id, notes, dependencies, credentials } = req.body;

        await db.execute({
            sql: 'UPDATE tasks SET text = ?, status = ?, project_id = ?, notes = ?, dependencies = ?, credentials = ?, updated_at = datetime("now") WHERE id = ?',
            args: [text, status, project_id, notes, dependencies, credentials, id]
        });

        // Update Project Progress if linked
        if (project_id) {
            await updateProjectProgress(project_id);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get project_id before delete to update progress later
        const taskCheck = await db.execute({ sql: 'SELECT project_id FROM tasks WHERE id = ?', args: [id] });
        const projectId = taskCheck.rows[0]?.project_id;

        await db.execute({
            sql: 'DELETE FROM tasks WHERE id = ?',
            args: [id]
        });

        if (projectId) {
            await updateProjectProgress(projectId);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// --- SUBTASKS ---

router.post('/:id/subtasks', async (req, res) => {
    try {
        const { id } = req.params; // task_id
        const { title } = req.body;
        if (!title) return res.status(400).json({ error: 'Subtask title required' });

        const result = await db.execute({
            sql: 'INSERT INTO subtasks (task_id, title, is_completed) VALUES (?, ?, 0) RETURNING *',
            args: [id, title]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding subtask:', error);
        res.status(500).json({ error: 'Failed to add subtask' });
    }
});

router.put('/subtasks/:subtaskId', async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { is_completed } = req.body; // 0 or 1

        await db.execute({
            sql: 'UPDATE subtasks SET is_completed = ? WHERE id = ?',
            args: [is_completed, subtaskId]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.delete('/subtasks/:subtaskId', async (req, res) => {
    try {
        const { subtaskId } = req.params;
        await db.execute({ sql: 'DELETE FROM subtasks WHERE id = ?', args: [subtaskId] });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// --- COMMENTS ---

router.post('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params; // task_id
        const { text, user_initials } = req.body;

        if (!text) return res.status(400).json({ error: 'Comment text required' });

        const result = await db.execute({
            sql: 'INSERT INTO task_comments (task_id, text, user_initials, created_at) VALUES (?, ?, ?, datetime("now")) RETURNING *',
            args: [id, text, user_initials || 'U']
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});


// HELPER: Update Project Progress
async function updateProjectProgress(projectId) {
    try {
        // Count total tasks
        const totalResult = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM tasks WHERE project_id = ?',
            args: [projectId]
        });
        const totalTasks = totalResult.rows[0].count;

        // Count completed tasks
        const completedResult = await db.execute({
            sql: `SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = 'completed'`,
            args: [projectId]
        });
        const completedTasks = completedResult.rows[0].count;

        let progress = 0;
        if (totalTasks === 0) {
            progress = 0; // Or 100? Requirement says IF totalTasks = 0: progress = 100%. User Request: "IF totalTasks = 0: progress = 100%"
            progress = 100;
        } else {
            progress = Math.round((completedTasks / totalTasks) * 100);
        }

        // Update Project
        await db.execute({
            sql: 'UPDATE projects SET progress = ?, updated_at = datetime("now") WHERE id = ?',
            args: [progress, projectId]
        });

    } catch (error) {
        console.error(`Failed to update progress for project ${projectId}:`, error);
    }
}

module.exports = router;
