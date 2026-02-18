const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all team members
router.get('/', async (req, res) => {
    try {
        // Auto-mark users offline if inactive for 5 minutes
        await db.execute(`
            UPDATE team_members 
            SET status = 'offline' 
            WHERE status = 'active' 
            AND datetime(last_active, '+5 minutes') < datetime('now')
        `);

        const result = await db.execute('SELECT id, name, email, initials, role, status, activity, last_login, last_active FROM team_members');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// GET working hours (last 30 days)
router.get('/hours', async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT ws.user_id, ws.user_name, ws.login_time, ws.logout_time
            FROM work_sessions ws
            WHERE ws.login_time >= datetime('now', '-30 days')
            ORDER BY ws.login_time DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching team hours:', error);
        res.status(500).json({ error: 'Failed to fetch team hours' });
    }
});

module.exports = router;
