-- Leads table
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
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  client TEXT,
  lead_id INTEGER,
  value REAL DEFAULT 0,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Lead Comments table
CREATE TABLE IF NOT EXISTS lead_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Lead Activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Projects table
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
);

-- Project Tasks table (tasks specific to a project)
CREATE TABLE IF NOT EXISTS project_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  date TEXT,
  status TEXT DEFAULT 'todo',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project Notes table (team sync notes for a project)
CREATE TABLE IF NOT EXISTS project_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project Assets table (link between projects and infra assets)
CREATE TABLE IF NOT EXISTS project_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  asset_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES infra_assets(id) ON DELETE CASCADE,
  UNIQUE(project_id, asset_id)
);


-- Tasks table
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
);

-- Infrastructure assets table
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
);

-- Links table
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  opens INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Team members table
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
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT,
  action TEXT NOT NULL,
  type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- OTPs table
CREATE TABLE IF NOT EXISTS otps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unique_id TEXT UNIQUE,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  project_name TEXT,
  agreement_type TEXT, -- NDA / Service / Partnership / Other
  start_date TEXT NOT NULL,
  end_date TEXT,
  value REAL DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft / active / completed
  document_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Employees table
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
);

-- Insert sample data
INSERT INTO leads (name, role, company, status) VALUES
  ('Pramod Jain', 'Owner', 'Sree Manish Telecom', 'completed'),
  ('Dilip', 'Partner', 'Simtel', 'follow-up'),
  ('Rahul Sharma', 'Manager', 'Tech Solutions', 'new'),
  ('Priya Patel', 'CEO', 'Digital Wave', 'negotiation');

INSERT INTO proposals (title, client, status, views) VALUES
  ('Sujit''s Website Redesign', 'Sujit', 'sent', 0),
  ('Develop Retailer OS (GT Version)', 'Khosha Systems', 'draft', 0),
  ('App Development RetailerOS (Chain Version)', 'Khosha Systems', 'draft', 0);

INSERT INTO projects (title, client, status, progress, tasks, assignee) VALUES
  ('Video creation - Product Video', 'Khosha System', 'in-progress', 0, 7, 'User A'),
  ('App Development Develop Retailer OS', 'Khosha Systems', 'in-progress', 0, 1, 'User A'),
  ('Website Development', 'Khosha System', 'in-progress', 0, 0, 'User A');

INSERT INTO tasks (title, description, status, assignee, date) VALUES
  ('Documentation of ROS', 'Full software', 'todo', 'Nischal', NULL),
  ('build onboarding application', 'build an onboarding application with given details', 'todo', 'Nischal', '2026-02-05'),
  ('Verified UI Update', 'Activate 10 retailers', 'completed', 'Nischal', NULL),
  ('Buy domain', 'Purchased @ 3252/-', 'completed', 'Ankit', NULL),
  ('Billing software', NULL, 'todo', 'Ankit', NULL),
  ('Accountant (gst)', 'Unhive ventures LLP', 'in-progress', 'Ankit', NULL);

INSERT INTO infra_assets (name, alt_name, type, status, linked) VALUES
  ('Staging Database v2', 'Staging DB', 'database', 'active', 0),
  ('website', NULL, 'domain', 'active', 0),
  ('website', NULL, 'server', 'active', 0),
  ('Test Domain', NULL, 'domain', 'active', 0);

INSERT INTO team_members (name, email, password, initials, role, status, activity) VALUES
  ('User A', 'usera@example.com', 'password123', 'UA', 'Developer', 'active', 'Drafting SEO Proposal'),
  ('User B', 'userb@example.com', 'password123', 'UB', 'Designer', 'offline', 'Reviewing Project Tasks');
