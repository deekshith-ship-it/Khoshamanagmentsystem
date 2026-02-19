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

// GET single proposal
router.get('/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM proposals WHERE id = ?',
            args: [req.params.id]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching proposal:', error);
        res.status(500).json({ error: 'Failed to fetch proposal' });
    }
});

// CREATE proposal
router.post('/', async (req, res) => {
    try {
        const { title, client, value, lead_id, project_id, scope, exclusions, terms, assumptions, file_url, notes, status } = req.body;

        // Transaction-like logic
        const result = await db.execute({
            sql: `INSERT INTO proposals 
                  (title, client, value, lead_id, project_id, scope, exclusions, terms, assumptions, file_url, notes, status, views, created_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime("now")) RETURNING *`,
            args: [title, client, value || 0, lead_id, project_id, scope, exclusions, terms, assumptions, file_url, notes, status || 'draft']
        });

        const newProposal = result.rows[0];

        // Sync with Lead: Update status to proposal_sent and link proposal
        if (lead_id && status === 'sent') {
            await db.execute({
                sql: `UPDATE leads SET status = 'proposal_sent', proposal_id = ?, updated_at = datetime("now") WHERE id = ?`,
                args: [newProposal.id, lead_id]
            });

            // Log activity
            await db.execute({
                sql: `INSERT INTO lead_activities (lead_id, type, title, description, created_at) VALUES (?, 'proposal', 'Proposal Sent', ?, datetime("now"))`,
                args: [lead_id, `Proposal "${title}" was created and sent.`]
            });
        }

        res.status(201).json(newProposal);
    } catch (error) {
        console.error('Error creating proposal:', error);
        res.status(500).json({ error: 'Failed to create proposal' });
    }
});

// UPDATE proposal
router.put('/:id', async (req, res) => {
    try {
        const { title, client, value, status, scope, exclusions, terms, assumptions, notes, lead_id, project_id, file_url } = req.body;

        const result = await db.execute({
            sql: `UPDATE proposals SET 
                  title = ?, client = ?, value = ?, status = ?, 
                  scope = ?, exclusions = ?, terms = ?, assumptions = ?, notes = ?, file_url = ?,
                  project_id = ?, lead_id = ?,updated_at = datetime("now") 
                  WHERE id = ? RETURNING *`,
            args: [title, client, value, status, scope, exclusions, terms, assumptions, notes, file_url, project_id, lead_id, req.params.id]
        });

        const updatedProposal = result.rows[0];

        // Sync Lead Status based on Proposal Status
        if (lead_id && status) {
            let leadStatus = null;
            if (status === 'sent') leadStatus = 'proposal_sent';
            if (status === 'negotiation') leadStatus = 'negotiation';
            if (status === 'follow_up') leadStatus = 'follow_up';
            if (status === 'accepted') leadStatus = 'closed_won';
            if (status === 'rejected') leadStatus = 'closed_lost';

            if (leadStatus) {
                await db.execute({
                    sql: 'UPDATE leads SET status = ?, updated_at = datetime("now") WHERE id = ?',
                    args: [leadStatus, lead_id]
                });
            }
        }

        res.json(updatedProposal);
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
