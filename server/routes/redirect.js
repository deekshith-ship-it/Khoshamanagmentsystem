const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// Link redirect tracking
router.get('/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT url FROM links WHERE id = ?',
            args: [req.params.id]
        });

        if (result.rows.length === 0) {
            return res.status(404).send('Link not found');
        }

        const targetUrl = result.rows[0].url;

        db.execute({
            sql: 'UPDATE links SET opens = opens + 1 WHERE id = ?',
            args: [req.params.id]
        }).catch(err => console.error('Error incrementing opens:', err));

        db.execute({
            sql: 'INSERT INTO activity_log (user_name, action, type, created_at) VALUES (?, ?, "link", datetime("now"))',
            args: ['System', `Link opened: ${targetUrl}`]
        }).catch(err => console.error('Error logging link activity:', err));

        res.redirect(targetUrl);
    } catch (error) {
        console.error('Error during link redirect:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
