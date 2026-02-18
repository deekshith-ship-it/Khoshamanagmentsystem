// ========================================
// KHOSHA MANAGEMENT SYSTEM - Express Server
// Modular Architecture v2.0
// ========================================
const express = require('express');
const cors = require('cors');
const { db, initializeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ============ ROUTE REGISTRATION ============
// Each route file handles its own /api/* path prefix
app.use('/api', require('./routes/health'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/infra', require('./routes/infra'));
app.use('/api/links', require('./routes/links'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/agreements', require('./routes/agreements'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/team', require('./routes/team'));
app.use('/api/upload', require('./routes/upload'));

// Serve uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Activity log (standalone)
app.get('/api/activity', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// Link redirect tracking (needs to be at app level, not /api)
app.get('/l/:id', async (req, res) => {
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

// ============ INITIALIZE DATABASE ============
initializeDatabase();

// ============ START SERVER (local only) ============
if (require.main === module) {
    const os = require('os');
    app.listen(PORT, '0.0.0.0', () => {
        const interfaces = os.networkInterfaces();
        const addresses = [];
        for (const k in interfaces) {
            for (const k2 in interfaces[k]) {
                const address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`🚀 KOSHA BACKEND IS LIVE`);
        console.log(`💻 Local:  http://localhost:${PORT}/api`);
        addresses.forEach(ip => {
            console.log(`📱 Mobile: http://${ip}:${PORT}/api`);
        });
        console.log('='.repeat(50) + '\n');
    });
}

module.exports = app;
