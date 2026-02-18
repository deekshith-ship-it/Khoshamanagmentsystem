const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all proposals
router.get('/', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM proposals ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
});

// CREATE proposal
router.post('/', async (req, res) => {
    try {
        const { title, client, value } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO proposals (title, client, value, lead_id, file_url, notes, status, views, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime("now")) RETURNING *',
            args: [title, client, value || 0, req.body.lead_id || null, req.body.file_url || null, req.body.notes || null, req.body.status || 'draft']
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating proposal:', error);
        res.status(500).json({ error: 'Failed to create proposal' });
    }
});

// UPDATE proposal
router.put('/:id', async (req, res) => {
    try {
        const { title, client, value, views } = req.body;
        const result = await db.execute({
            sql: 'UPDATE proposals SET title = ?, client = ?, value = ?, status = ?, file_url = ?, notes = ?, views = ?, updated_at = datetime("now") WHERE id = ? RETURNING *',
            args: [title, client, value, req.body.status, req.body.file_url, req.body.notes, views, req.params.id]
        });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating proposal:', error);
        res.status(500).json({ error: 'Failed to update proposal' });
    }
});

// DELETE proposal
router.delete('/:id', async (req, res) => {
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

module.exports = router;
