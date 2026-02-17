// Script to initialize the Turso database with schema and sample data
const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initializeDatabase() {
  console.log('🚀 Connecting to Turso database...');
  console.log(`📍 URL: ${process.env.TURSO_DATABASE_URL}`);

  try {
    // Create tables
    console.log('\n📊 Creating tables...');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        role TEXT,
        company TEXT,
        status TEXT DEFAULT 'new',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      )
    `);
    console.log('✅ leads table created');

    // Add email and phone columns if they don't exist (for existing tables)
    try {
      await db.execute(`ALTER TABLE leads ADD COLUMN email TEXT`);
      console.log('✅ email column added to leads');
    } catch (e) {
      // Column already exists
    }
    try {
      await db.execute(`ALTER TABLE leads ADD COLUMN phone TEXT`);
      console.log('✅ phone column added to leads');
    } catch (e) {
      // Column already exists
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        client TEXT,
        lead_id INTEGER,
        status TEXT DEFAULT 'draft',
        value REAL DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      )
    `);
    console.log('✅ proposals table created');

    // Add status column if it doesn't exist (for existing tables)
    try {
      await db.execute(`ALTER TABLE proposals ADD COLUMN status TEXT DEFAULT 'draft'`);
      console.log('✅ status column added to proposals');
    } catch (e) {
      // Column already exists
    }

    // Add value column if it doesn't exist (for existing tables)
    try {
      await db.execute(`ALTER TABLE proposals ADD COLUMN value REAL DEFAULT 0`);
      console.log('✅ value column added to proposals');
    } catch (e) {
      // Column already exists
    }

    // Add lead_id column if it doesn't exist (for existing tables)
    try {
      await db.execute(`ALTER TABLE proposals ADD COLUMN lead_id INTEGER`);
      console.log('✅ lead_id column added to proposals');
    } catch (e) {
      // Column already exists
    }

    // Create lead_comments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS lead_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        author TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ lead_comments table created');

    // Create lead_activities table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS lead_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        type TEXT,
        title TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ lead_activities table created');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        client TEXT,
        status TEXT DEFAULT 'in-progress',
        progress INTEGER DEFAULT 0,
        tasks INTEGER DEFAULT 0,
        assignee TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      )
    `);
    console.log('✅ projects table created');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS project_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        date TEXT,
        status TEXT DEFAULT 'todo',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      )
    `);
    console.log('✅ project_tasks table created');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS project_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        author TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ project_notes table created');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS project_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        asset_id INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ project_assets table created');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo',
        assignee TEXT,
        date TEXT,
        priority TEXT DEFAULT 'Medium',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      )
    `);
    console.log('✅ tasks table created');

    // Add priority column if it doesn't exist
    try {
      await db.execute(`ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'Medium'`);
      console.log('✅ priority column added to tasks');
    } catch (e) {
      // Column already exists
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS infra_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        alt_name TEXT,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        linked INTEGER DEFAULT 0,
        project_name TEXT,
        domain_name TEXT,
        registrar TEXT,
        expire_date TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT
      )
    `);
    console.log('✅ infra_assets table created');

    // Add missing columns to infra_assets if they don't exist
    const infraColumns = ['project_name', 'domain_name', 'registrar', 'expire_date', 'notes'];
    for (const col of infraColumns) {
      try {
        await db.execute(`ALTER TABLE infra_assets ADD COLUMN ${col} TEXT`);
        console.log(`✅ ${col} column added to infra_assets`);
      } catch (e) {
        // Column already exists
      }
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        opens INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ links table created');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password TEXT,
        google_id TEXT UNIQUE,
        initials TEXT,
        role TEXT,
        status TEXT DEFAULT 'offline',
        activity TEXT,
        last_login TEXT,
        last_active TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ team_members table created');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT,
        action TEXT NOT NULL,
        type TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ activity_log table created');

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
    console.log('✅ agreements table created');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ otps table created');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_name TEXT NOT NULL,
        employee_address TEXT NOT NULL,
        employee_number TEXT NOT NULL UNIQUE,
        employee_email TEXT,
        employee_dob TEXT,
        employee_designation TEXT NOT NULL,
        employee_department TEXT NOT NULL,
        employee_join_date TEXT,
        bank_name TEXT,
        bank_account_number TEXT NOT NULL,
        ifsc_code TEXT NOT NULL,
        pan_number TEXT NOT NULL,
        aadhar_number TEXT NOT NULL,
        emergency_contact_name TEXT NOT NULL,
        emergency_contact_relationship TEXT,
        emergency_contact_phone TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ employees table created');

    // Insert sample data
    console.log('\n📝 Inserting sample data...');

    // Check if data already exists
    const existingLeads = await db.execute('SELECT COUNT(*) as count FROM leads');
    if (existingLeads.rows[0].count === 0) {
      await db.execute(`
        INSERT INTO leads (name, role, company, status) VALUES
        ('Pramod Jain', 'Owner', 'Sree Manish Telecom', 'completed'),
        ('Dilip', 'Partner', 'Simtel', 'follow-up'),
        ('Rahul Sharma', 'Manager', 'Tech Solutions', 'new'),
        ('Priya Patel', 'CEO', 'Digital Wave', 'negotiation')
      `);
      console.log('✅ leads data inserted');
    } else {
      console.log('⏭️  leads already has data, skipping');
    }

    const existingProposals = await db.execute('SELECT COUNT(*) as count FROM proposals');
    if (existingProposals.rows[0].count === 0) {
      await db.execute(`
        INSERT INTO proposals (title, client, status, views) VALUES
        ('Sujit''s Website Redesign', 'Sujit', 'sent', 0),
        ('Develop Retailer OS (GT Version)', 'Khosha Systems', 'draft', 0),
        ('App Development RetailerOS (Chain Version)', 'Khosha Systems', 'draft', 0)
      `);
      console.log('✅ proposals data inserted');
    } else {
      console.log('⏭️  proposals already has data, skipping');
    }

    const existingProjects = await db.execute('SELECT COUNT(*) as count FROM projects');
    if (existingProjects.rows[0].count === 0) {
      await db.execute(`
        INSERT INTO projects (title, client, status, progress, tasks, assignee) VALUES
        ('Video creation - Product Video', 'Khosha System', 'in-progress', 0, 7, 'User A'),
        ('App Development Develop Retailer OS', 'Khosha Systems', 'in-progress', 0, 1, 'User A'),
        ('Website Development', 'Khosha System', 'in-progress', 0, 0, 'User A')
      `);
      console.log('✅ projects data inserted');
    } else {
      console.log('⏭️  projects already has data, skipping');
    }

    // Insert sample project tasks
    const existingProjectTasks = await db.execute('SELECT COUNT(*) as count FROM project_tasks');
    if (existingProjectTasks.rows[0].count === 0) {
      // Get first project ID
      const firstProject = await db.execute('SELECT id FROM projects LIMIT 1');
      if (firstProject.rows.length > 0) {
        const projectId = firstProject.rows[0].id;
        await db.execute({
          sql: `INSERT INTO project_tasks (project_id, title, date, status) VALUES
            (?, 'video V1', NULL, 'todo'),
            (?, 'Script Writing', '2026-02-10', 'doing'),
            (?, 'Storyboard Creation', '2026-02-12', 'todo'),
            (?, 'Voice Over Recording', NULL, 'todo'),
            (?, 'Video Editing', NULL, 'todo'),
            (?, 'Final Review', NULL, 'todo'),
            (?, 'Publish Video', NULL, 'done')`,
          args: [projectId, projectId, projectId, projectId, projectId, projectId, projectId]
        });
        console.log('✅ project_tasks data inserted');
      }
    } else {
      console.log('⏭️  project_tasks already has data, skipping');
    }

    // Insert sample project notes
    const existingProjectNotes = await db.execute('SELECT COUNT(*) as count FROM project_notes');
    if (existingProjectNotes.rows[0].count === 0) {
      // Get first project ID
      const firstProject = await db.execute('SELECT id FROM projects LIMIT 1');
      if (firstProject.rows.length > 0) {
        const projectId = firstProject.rows[0].id;
        await db.execute({
          sql: `INSERT INTO project_notes (project_id, content, author) VALUES
            (?, 'script in progress', 'Me')`,
          args: [projectId]
        });
        console.log('✅ project_notes data inserted');
      }
    } else {
      console.log('⏭️  project_notes already has data, skipping');
    }


    const existingTasks = await db.execute('SELECT COUNT(*) as count FROM tasks');
    if (existingTasks.rows[0].count === 0) {
      await db.execute(`
        INSERT INTO tasks (title, description, status, assignee, date) VALUES
        ('Documentation of ROS', 'Full software', 'todo', 'Nischal', NULL),
        ('build onboarding application', 'build an onboarding application with given details', 'todo', 'Nischal', '2026-02-05'),
        ('Verified UI Update', 'Activate 10 retailers', 'completed', 'Nischal', NULL),
        ('Buy domain', 'Purchased @ 3252/-', 'completed', 'Ankit', NULL),
        ('Billing software', NULL, 'todo', 'Ankit', NULL),
        ('Accountant (gst)', 'Unhive ventures LLP', 'in-progress', 'Ankit', NULL)
      `);
      console.log('✅ tasks data inserted');
    } else {
      console.log('⏭️  tasks already has data, skipping');
    }

    const existingInfra = await db.execute('SELECT COUNT(*) as count FROM infra_assets');
    if (existingInfra.rows[0].count === 0) {
      await db.execute(`
        INSERT INTO infra_assets (name, alt_name, type, status, linked) VALUES
        ('Staging Database v2', 'Staging DB', 'database', 'active', 0),
        ('website', NULL, 'domain', 'active', 0),
        ('website', NULL, 'server', 'active', 0),
        ('Test Domain', NULL, 'domain', 'active', 0)
      `);
      console.log('✅ infra_assets data inserted');
    } else {
      console.log('⏭️  infra_assets already has data, skipping');
    }

    const existingTeam = await db.execute('SELECT COUNT(*) as count FROM team_members');
    if (existingTeam.rows[0].count === 0) {
      await db.execute(`
        INSERT INTO team_members (name, email, phone, password, initials, role, status, activity) VALUES
        ('User A', 'usera@example.com', '1234567890', 'password123', 'UA', 'Developer', 'active', 'Drafting SEO Proposal'),
        ('User B', 'userb@example.com', '0987654321', 'password123', 'UB', 'Designer', 'offline', 'Reviewing Project Tasks')
      `);
      console.log('✅ team_members data inserted');
    } else {
      console.log('⏭️  team_members already has data, skipping');
    }

    console.log('\n🎉 Database initialization complete!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
