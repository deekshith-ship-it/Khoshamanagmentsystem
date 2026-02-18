// ========================================
// DATABASE CONNECTION - Single Source of Truth
// ========================================
const { createClient } = require('@libsql/client');

// Load .env locally; on Netlify env vars are injected by the platform
try { require('dotenv').config(); } catch (e) { /* production */ }

// Validate required env vars
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ FATAL: Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    console.error('   Local: Check your .env file');
    console.error('   Netlify: Add them in Site Settings > Environment Variables');
}

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Database schema initialization
async function initializeDatabase() {
    try {
        console.log('🔄 Checking database schema...');

        // Ensure phone column exists in team_members
        const tableInfo = await db.execute('PRAGMA table_info(team_members)');
        const hasPhone = tableInfo.rows.some(col => col.name === 'phone');

        if (!hasPhone) {
            console.log('➕ Adding phone column to team_members...');
            await db.execute('ALTER TABLE team_members ADD COLUMN phone TEXT UNIQUE');
        }

        // Ensure agreements table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS agreements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unique_id TEXT UNIQUE,
                title TEXT NOT NULL,
                client_name TEXT NOT NULL,
                project_name TEXT,
                agreement_type TEXT,
                start_date TEXT NOT NULL,
                end_date TEXT,
                value REAL DEFAULT 0,
                status TEXT DEFAULT 'draft',
                document_url TEXT,
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);

        // Ensure work_sessions table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS work_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                user_name TEXT,
                login_time TEXT NOT NULL DEFAULT (datetime('now')),
                logout_time TEXT,
                FOREIGN KEY (user_id) REFERENCES team_members(id) ON DELETE CASCADE
            )
        `);

        // Insert admin user if not exists
        const userCheck = await db.execute({
            sql: 'SELECT * FROM team_members WHERE phone = ?',
            args: ['9019318041']
        });

        if (userCheck.rows.length === 0) {
            await db.execute({
                sql: 'INSERT INTO team_members (name, email, phone, password, initials, role, status, activity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                args: ['Khosha Admin', 'admin@khoshasystems.com', '9019318041', 'password123', 'KA', 'Admin', 'active', 'Managing Dashboard']
            });
        }

        console.log('✅ Database schema is up to date');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

module.exports = { db, initializeDatabase };
