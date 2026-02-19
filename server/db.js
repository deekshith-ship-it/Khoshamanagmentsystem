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

        // Ensure loss_reason column exists in leads
        const leadsInfo = await db.execute('PRAGMA table_info(leads)');
        const hasLossReason = leadsInfo.rows.some(col => col.name === 'loss_reason');

        if (!hasLossReason) {
            console.log('➕ Adding loss_reason column to leads...');
            await db.execute('ALTER TABLE leads ADD COLUMN loss_reason TEXT');
        }

        // SALES PIPELINE: Check for proposal/project linkage in leads
        const leadsInfo2 = await db.execute('PRAGMA table_info(leads)');
        if (!leadsInfo2.rows.some(c => c.name === 'proposal_id')) await db.execute('ALTER TABLE leads ADD COLUMN proposal_id INTEGER');
        if (!leadsInfo2.rows.some(c => c.name === 'project_id')) await db.execute('ALTER TABLE leads ADD COLUMN project_id INTEGER');
        if (!leadsInfo2.rows.some(c => c.name === 'source')) await db.execute('ALTER TABLE leads ADD COLUMN source TEXT');

        // PROPOSALS TABLE ENHANCEMENTS
        const propsInfo = await db.execute('PRAGMA table_info(proposals)');
        if (!propsInfo.rows.some(c => c.name === 'project_id')) await db.execute('ALTER TABLE proposals ADD COLUMN project_id INTEGER');
        if (!propsInfo.rows.some(c => c.name === 'status')) await db.execute('ALTER TABLE proposals ADD COLUMN status TEXT DEFAULT "draft"');
        if (!propsInfo.rows.some(c => c.name === 'scope')) await db.execute('ALTER TABLE proposals ADD COLUMN scope TEXT');
        if (!propsInfo.rows.some(c => c.name === 'exclusions')) await db.execute('ALTER TABLE proposals ADD COLUMN exclusions TEXT');
        if (!propsInfo.rows.some(c => c.name === 'terms')) await db.execute('ALTER TABLE proposals ADD COLUMN terms TEXT');
        if (!propsInfo.rows.some(c => c.name === 'file_url')) await db.execute('ALTER TABLE proposals ADD COLUMN file_url TEXT');
        if (!propsInfo.rows.some(c => c.name === 'notes')) await db.execute('ALTER TABLE proposals ADD COLUMN notes TEXT');
        if (!propsInfo.rows.some(c => c.name === 'assumptions')) await db.execute('ALTER TABLE proposals ADD COLUMN assumptions TEXT');

        // PROJECTS TABLE ENHANCEMENTS
        const projInfo = await db.execute('PRAGMA table_info(projects)');
        if (!projInfo.rows.some(c => c.name === 'proposal_id')) await db.execute('ALTER TABLE projects ADD COLUMN proposal_id INTEGER');
        if (!projInfo.rows.some(c => c.name === 'lead_id')) await db.execute('ALTER TABLE projects ADD COLUMN lead_id INTEGER');

        // TASKS TABLE ENHANCEMENTS
        const tasksInfo = await db.execute("PRAGMA table_info('tasks')");
        if (tasksInfo.rows.length === 0) {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    text TEXT NOT NULL,
                    status TEXT DEFAULT 'todo', -- todo, in_progress, completed
                    project_id INTEGER,
                    notes TEXT,
                    dependencies TEXT,
                    credentials TEXT,
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now')),
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                )
            `);
        } else {
            if (!tasksInfo.rows.some(c => c.name === 'notes')) await db.execute('ALTER TABLE tasks ADD COLUMN notes TEXT');
            if (!tasksInfo.rows.some(c => c.name === 'dependencies')) await db.execute('ALTER TABLE tasks ADD COLUMN dependencies TEXT');
            if (!tasksInfo.rows.some(c => c.name === 'credentials')) await db.execute('ALTER TABLE tasks ADD COLUMN credentials TEXT');
            if (!tasksInfo.rows.some(c => c.name === 'project_id')) await db.execute('ALTER TABLE tasks ADD COLUMN project_id INTEGER');
        }

        // TASK COMMENTS TABLE
        await db.execute(`
            CREATE TABLE IF NOT EXISTS task_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                user_initials TEXT DEFAULT 'U',
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `);

        // SUBTASKS TABLE
        await db.execute(`
            CREATE TABLE IF NOT EXISTS subtasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                is_completed INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `);

        // LEAD METRICS ENHANCEMENTS
        if (!leadsInfo2.rows.some(c => c.name === 'progress_percentage')) await db.execute('ALTER TABLE leads ADD COLUMN progress_percentage INTEGER DEFAULT 0');

        // LEAD ACTIVITIES TABLE
        const activitiesInfo = await db.execute("PRAGMA table_info('lead_activities')");
        if (activitiesInfo.rows.length === 0) {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS lead_activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lead_id INTEGER NOT NULL,
                    type TEXT NOT NULL, -- NOTE, CALL, MEETING, STATUS_CHANGE, SYSTEM
                    title TEXT,
                    description TEXT,
                    metadata TEXT, -- JSON string for extra details (duration, outcome, etc.)
                    created_by TEXT DEFAULT 'System',
                    created_at TEXT DEFAULT (datetime('now')),
                    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
                )
            `);
        } else {
            // Check for new columns if table exists
            if (!activitiesInfo.rows.some(c => c.name === 'metadata')) await db.execute('ALTER TABLE lead_activities ADD COLUMN metadata TEXT');
            if (!activitiesInfo.rows.some(c => c.name === 'created_by')) await db.execute('ALTER TABLE lead_activities ADD COLUMN created_by TEXT DEFAULT "System"');
        }

        // Create index for faster Lookups
        await db.execute('CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id)');

        // PROJECT NOTES TABLE
        await db.execute(`
            CREATE TABLE IF NOT EXISTS project_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                author TEXT DEFAULT 'User',
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        `);

        // INFRA ASSETS TABLE
        await db.execute(`
            CREATE TABLE IF NOT EXISTS infra_assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL, -- DOMAIN, SERVER, EMAIL
                server_type TEXT, -- Cloud, VPS, etc.
                metadata TEXT, -- JSON string
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);

        // PROJECT INFRA TABLE (Many-to-Many Link)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS project_infra (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                infra_id INTEGER NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (infra_id) REFERENCES infra_assets(id) ON DELETE CASCADE,
                UNIQUE(project_id, infra_id)
            )
        `);

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
