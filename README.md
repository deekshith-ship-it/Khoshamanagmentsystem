[![Netlify Status](https://api.netlify.com/api/v1/badges/97cf12f3-7d34-4243-b5ed-77bc25a03e43/deploy-status)](https://app.netlify.com/projects/friendly-pegasus-99eef2/deploys)
# Khosha Admin Dashboard

A modern, responsive admin dashboard built with React and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app runs at `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable components
│   │   ├── Avatar.jsx
│   │   ├── Card.jsx
│   │   ├── FilterPills.jsx
│   │   ├── FloatingAddButton.jsx
│   │   ├── SearchInput.jsx
│   │   ├── StatsCard.jsx
│   │   └── StatusBadge.jsx
│   └── layout/
│       ├── MainLayout.jsx
│       └── Sidebar.jsx
├── data/
│   └── sampleData.js    # Mock data
├── pages/
│   ├── Dashboard.jsx
│   ├── GeneralTasks.jsx
│   ├── Infra.jsx
│   ├── Leads.jsx
│   ├── Links.jsx
│   ├── Projects.jsx
│   ├── Proposals.jsx
│   └── Team.jsx
├── App.js
└── index.css
```

## Design Tokens

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#2B6EF6` | CTAs, active states |
| Background | `#F5F7FA` | Page background |
| Success | `#22C55E` | Completed badges |
| Gray 500 | `#6B7280` | Muted text |
| Gray 600 | `#4B5563` | Body text |

### Typography
- **Font**: Inter
- **Headline**: Bold (700), 48px
- **Body**: 14-16px
- **Meta**: 12px

### Spacing
- **Baseline**: 16px
- **Card padding**: 20-28px
- **Card gutters**: 24px
- **Page padding**: 32-48px

### Components
- **Card border-radius**: 12px
- **Card shadow**: `0 8px 20px rgba(30,35,40,0.04)`
- **Pill border-radius**: 20px
- **FAB size**: 56px

## Responsive Breakpoints

| Breakpoint | Sidebar | Grid |
|------------|---------|------|
| Desktop (1440px+) | Full (260px) | 3 columns |
| Tablet (768-1439px) | Icon-only | 2 columns |
| Mobile (<768px) | Off-canvas | 1 column |

## Pages

1. **Dashboard** - KPI cards, activity timeline, interest signals
2. **Leads** - Filterable lead list with status badges
3. **Proposals** - Stats cards and proposal tracking
4. **Projects** - Project cards with progress bars
5. **Infra** - Infrastructure asset management
6. **General Tasks** - Task grid with filters
7. **Links** - Trackable link generator
8. **Team** - Team activity and daily log

## Component Props

### Card
```jsx
<Card 
  padding="default|sm|lg|xl|none"
  hover={true|false}
  onClick={fn}
/>
```

### StatusBadge
```jsx
<StatusBadge status="todo|in-progress|completed|sent|draft|active" />
```

### FilterPills
```jsx
<FilterPills 
  options={[{ value: 'all', label: 'All' }]}
  value="all"
  onChange={(value) => {}}
/>
```

### Avatar
```jsx
<Avatar 
  name="John Doe"
  size="xs|sm|md|lg|xl"
  color="default|primary|success"
  showStatus={true}
  isOnline={true}
/>
```
