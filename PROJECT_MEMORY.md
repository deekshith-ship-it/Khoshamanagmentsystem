# Project Memory: Khosha Management System (KMS)

## 📌 Project Overview
**Name**: khoshamanagment  
**Description**: A comprehensive management system for Khosha Systems, handling Leads, Projects, Infrastructure, Teams, and more.  
**Location**: `c:/Users/Deekshith Gowda/Documents/KMS/khoshamanagment`  
**Last Updated**: February 17, 2026

## 🛠 Tech Stack
- **Frontend**: React 19, TailwindCSS, Lucide React (Icons), React Router DOM v7.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (via Turso / @libsql/client).
- **Tooling**: React Scripts (CRA), Concurrently (for running dev & server together).

## 📂 Project Structure
```text
khoshamanagment/
├── public/                 # Static assets
├── server/                 # Backend Application
│   ├── index.js            # Main Express Server & API Routes
│   ├── schema.sql          # Database Schema Definition
│   └── init-db.js          # Database Initialization Script
├── src/                    # Frontend Application
│   ├── components/         # Reusable Components
│   │   ├── auth/           # Authentication related components
│   │   ├── common/         # Generic UI components (Buttons, Inputs, etc.)
│   │   └── layout/         # Layout components (Sidebar, MainLayout)
│   ├── context/            # React Context (ThemeContext, etc.)
│   ├── data/               # Static data / Mock data
│   ├── pages/              # Main Page Components
│   │   ├── Dashboard.jsx
│   │   ├── Leads.jsx
│   │   ├── Projects.jsx
│   │   ├── Team.jsx
│   │   └── ... (See Routing Section)
│   ├── services/           # API Service calls
│   ├── App.js              # Main App Component & Routing
│   ├── index.css           # Global Styles & Tailwind Directives
│   └── index.js            # Entry Point
├── package.json            # Dependencies & Scripts
├── tailwind.config.js      # Tailwind Configuration
└── .env                    # Environment Variables
```

## 🚀 Setup & Execution
### Prerequisites
- Node.js & npm installed.
- `.env` file configured with Turso credentials.

### Commands
- **Install Dependencies**: `npm install`
- **Start Dev Server (Frontend + Backend)**: `npm run dev`
    - Frontend: `http://localhost:3000`
    - Backend: `http://localhost:5000`
- **Start Frontend Only**: `npm start`
- **Start Backend Only**: `npm run server`
- **Build**: `npm run build`

### Environment Variables
Required in `.env`:
```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
PORT=5000 (Optional, default 5000)
```

## 🗄️ Database Schema
The database uses SQLite (LibSQL). Key tables include:

- **leads**: CRM leads (id, name, email, status, etc.)
- **proposals**: Proposals linked to leads.
- **projects**: Active projects (progress, tasks, client).
- **project_tasks**: Tasks specific to a project.
- **project_notes**: Internal notes for projects.
- **project_assets**: Infrastructure assets linked to projects.
- **tasks**: General tasks.
- **infra_assets**: Domains, Servers, Databases (expiry dates, registrars).
- **links**: Link tracker (short links, open counts).
- **employees**: Detailed employee records (bank info, emergency contacts).
- **team_members**: App users (auth, role, activity status).
- **activity_log**: Audit log of system actions.
- **agreements**: Contracts and agreements management.

## 🔗 Routing & Pages
| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Dashboard` | Overview stats and quick actions |
| `/leads` | `Leads` | List of leads |
| `/leads/:id` | `LeadDetails` | Detailed lead view with comments/activity |
| `/proposals` | `Proposals` | Business proposals |
| `/projects` | `Projects` | Project tracking grid |
| `/projects/:id` | `ProjectDetails` | Project deep dive (tasks, notes, assets) |
| `/infra` | `Infra` | Infrastructure inventory |
| `/tasks` | `GeneralTasks` | To-do list |
| `/links` | `Links` | Link management & analytics |
| `/team` | `Team` | Team member availability & status |
| `/onboarding` | `Onboarding` | Employee onboarding |
| `/billing` | `Billing` | Billing information |
| `/contracts` | `Contracts` | Legal agreements |
| `/settings` | `Settings` | App configuration |

## 📡 API Endpoints (Backend)
Base URL: `/api`
- **Leads**: `GET /leads`, `POST /leads`, `PUT/DELETE /leads/:id`
- **Projects**: `GET /projects`, `POST /projects`, `GET /projects/:id/tasks`
- **Tasks**: `GET /tasks`, `POST /tasks`
- **Infra**: `GET /infra`, `POST /infra`
- **Team**: Implicitly handled via `team_members` table interaction (auth logic likely exists).
- **Links**: `GET /links`, `GET /l/:id` (Redirect)

## 📝 Recent Development Context
- **Team Activity**: Implemented real-time tracking of user status (Active/Offline) and current activity text.
- **UI/UX Refinement**: Moving towards a cleaner, minimalist SaaS aesthetic. "Active Focus" subheadings, consistent card shadows, and green status indicators.
- **Database Integration**: Connected Frontend to Turso backend. Removed mock data in favor of live API calls.
- **Infra Linking**: Added ability to link infrastructure assets to specific projects.

## ⚠️ Key Considerations for Next Session
- **Auth**: Ensure `team_members` table is properly used for login. Current logic checks distinct tables.
- **Real-time**: Activity tracking is currently polling or state-based; consider WebSockets if real-time needs increase.
- **Validation**: Ensure all forms (Leads, Employees) satisfy the schema constraints (e.g., unique phone numbers).
