const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all leads
router.get('/', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM leads ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// GET single lead
router.get('/:id', async (req, res) => {
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

// CREATE lead
router.post('/', async (req, res) => {
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

// UPDATE lead
router.put('/:id', async (req, res) => {
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

// DELETE lead
router.delete('/:id', async (req, res) => {
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

// ============ LEAD COMMENTS ============
router.get('/:leadId/comments', async (req, res) => {
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

router.post('/:leadId/comments', async (req, res) => {
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

router.delete('/:leadId/comments/:commentId', async (req, res) => {
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

// ============ LEAD ACTIVITIES ============
router.get('/:leadId/activities', async (req, res) => {
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

router.post('/:leadId/activities', async (req, res) => {
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

// ============ LEAD LINKED PROPOSALS ============
router.get('/:leadId/proposals', async (req, res) => {
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

module.exports = router;
