const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// Activity log
router.get('/', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

module.exports = router;
