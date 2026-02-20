const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// GET link stats
router.get('/stats', async (req, res) => {
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

// GET all links
router.get('/', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM links ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ error: 'Failed to fetch links' });
    }
});

// CREATE link
router.post('/', async (req, res) => {
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

module.exports = router;
