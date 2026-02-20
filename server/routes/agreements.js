const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// GET all agreements
router.get('/', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM agreements ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching agreements:', error);
        res.status(500).json({ error: 'Failed to fetch agreements' });
    }
});

// CREATE agreement
router.post('/', async (req, res) => {
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

// UPDATE agreement
router.put('/:id', async (req, res) => {
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

// DELETE agreement
router.delete('/:id', async (req, res) => {
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

module.exports = router;
