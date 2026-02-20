// ========================================
// KHOSHA MANAGEMENT SYSTEM - Express Server
// Modular Architecture v2.0
// ========================================
const express = require('express');
const cors = require('cors');
const { db, initializeDatabase } = require('./config/db');

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

app.use('/api/activity', require('./routes/activity'));
app.use('/l', require('./routes/redirect'));

// ============ INITIALIZE DATABASE ============
initializeDatabase();

// ============ START SERVER (local only) ============
if (require.main === module) {
    const os = require('os');
    app.listen(PORT, () => {
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
