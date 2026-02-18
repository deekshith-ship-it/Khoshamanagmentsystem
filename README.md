# Khosha Management System

A full-stack business management dashboard built with React + Express + Turso (SQLite).

## Project Structure

```
khoshamanagment/
├── public/                  # Static assets (favicon, logo, index.html)
├── server/                  # Express.js backend
│   ├── db.js                # Database connection (Turso)
│   ├── index.js             # Express app entry point
│   ├── schema.sql           # Full database schema + seed data
│   └── routes/              # API route handlers
│       ├── health.js        # Health check endpoint
│       ├── leads.js         # Leads CRUD + comments/activities
│       ├── proposals.js     # Proposals CRUD
│       ├── projects.js      # Projects CRUD + tasks/notes/assets
│       ├── tasks.js         # General tasks (unified view)
│       ├── infra.js         # Infrastructure assets
│       ├── links.js         # Trackable links
│       ├── employees.js     # Employee management
│       ├── agreements.js    # Business agreements
│       ├── auth.js          # Authentication (OTP + email)
│       └── team.js          # Team members & work sessions
├── src/                     # React frontend
│   ├── index.js             # React entry point
│   ├── index.css            # Global styles (Tailwind + custom)
│   ├── App.js               # Routes & app shell
│   ├── services/            # API client
│   │   └── api.js           # Centralized fetch helper
│   ├── context/             # React context providers
│   │   └── ThemeContext.jsx  # Dark/light theme
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared components (Card, Avatar, etc.)
│   │   └── layout/          # Layout components (MainLayout, Sidebar)
│   └── pages/               # Page components
│       ├── Dashboard.jsx
│       ├── Leads.jsx
│       ├── LeadDetails.jsx
│       ├── Proposals.jsx
│       ├── Projects.jsx
│       ├── ProjectDetails.jsx
│       ├── GeneralTasks.jsx
│       ├── AddTask.jsx
│       ├── Infra.jsx
│       ├── AddInfra.jsx
│       ├── Links.jsx
│       ├── Team.jsx
│       ├── Onboarding.jsx
│       ├── Billing.jsx
│       ├── Contracts.jsx
│       ├── Settings.jsx
│       ├── Login.jsx
│       └── index.js         # Barrel exports
├── netlify/                 # Netlify deployment
│   └── functions/
│       └── api.js           # Serverless function wrapper
├── netlify.toml             # Netlify config (redirects, build)
├── .env                     # Environment variables (not in git)
├── .env.example             # Example env file
├── tailwind.config.js       # Tailwind CSS config
├── postcss.config.js        # PostCSS config
└── package.json             # Dependencies & scripts
```

## Getting Started

### Prerequisites
- Node.js 18+
- A Turso database with credentials

### Setup
1. Clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your Turso credentials
4. Start the app: `npm run dev` (Database initializes automatically)

### Development
```bash
# Start both frontend (port 3000) and backend (port 5000)
npm run dev

# Or run them separately:
npm run server   # Backend only (port 5000)
npm start        # Frontend only (port 3000)
```

### Deployment (Netlify)
The app is configured for Netlify deployment:
- Frontend: Built by `npm run build`, served from `/build`
- Backend: Wrapped as a Netlify serverless function via `netlify/functions/api.js`
- API calls: Redirected from `/api/*` to the serverless function

## Tech Stack
- **Frontend**: React 19, React Router 7, Lucide Icons, Tailwind CSS
- **Backend**: Express.js
- **Database**: Turso (LibSQL / SQLite)
- **Deployment**: Netlify (static + serverless functions)
