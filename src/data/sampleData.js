// Sample data for the admin dashboard

export const leads = [
    {
        id: 1,
        name: 'Pramod Jain',
        role: 'Owner',
        company: 'Sree Manish Telecom',
        status: 'completed',
    },
    {
        id: 2,
        name: 'Dilip',
        role: 'Partner',
        company: 'Simtel',
        status: 'follow-up',
    },
    {
        id: 3,
        name: 'Rahul Sharma',
        role: 'Manager',
        company: 'Tech Solutions',
        status: 'new',
    },
    {
        id: 4,
        name: 'Priya Patel',
        role: 'CEO',
        company: 'Digital Wave',
        status: 'negotiation',
    },
];

export const proposals = [
    {
        id: 1,
        title: "Sujit's Website Redesign",
        client: 'Sujit',
        views: 0,
        createdAt: '3h ago',
        status: 'sent',
    },
    {
        id: 2,
        title: 'Develop Retailer OS (GT Version)',
        client: 'Khosha Systems',
        views: 0,
        createdAt: '3h ago',
        status: 'draft',
    },
    {
        id: 3,
        title: 'App Development RetailerOS (Chain Version)',
        client: 'Khosha Systems',
        views: 0,
        createdAt: '3h ago',
        status: 'draft',
    },
];

export const projects = [
    {
        id: 1,
        title: 'Video creation - Product Video',
        client: 'Khosha System',
        status: 'in-progress',
        progress: 0,
        tasks: 7,
        assignee: 'User A',
    },
    {
        id: 2,
        title: 'App Development Develop Retailer OS (GT Version)',
        client: 'Khosha Systems',
        status: 'in-progress',
        progress: 0,
        tasks: 1,
        assignee: 'User A',
    },
    {
        id: 3,
        title: 'App Development RetailerOS (Chain Version)',
        client: 'Khosha Systems',
        status: 'in-progress',
        progress: 0,
        tasks: 0,
        assignee: 'User A',
    },
    {
        id: 4,
        title: 'Website Development',
        client: 'Khosha System',
        status: 'in-progress',
        progress: 0,
        tasks: 0,
        assignee: 'User A',
    },
];

export const tasks = [
    {
        id: 1,
        title: 'Documentation of ROS',
        description: 'Full software',
        status: 'todo',
        assignee: 'Nischal',
        date: null,
    },
    {
        id: 2,
        title: 'build onboarding application',
        description: 'build an onboarding application with given details',
        status: 'todo',
        assignee: 'Nischal',
        date: '2026-02-05',
    },
    {
        id: 3,
        title: 'Verified UI Update',
        description: 'Activate 10 retailers',
        status: 'completed',
        assignee: 'Nischal',
        date: null,
    },
    {
        id: 4,
        title: 'Verify Design Task',
        description: null,
        status: 'todo',
        assignee: 'Nischal',
        date: null,
    },
    {
        id: 5,
        title: 'Buy domain',
        description: 'Purchased @ 3252/-',
        status: 'completed',
        assignee: 'Ankit',
        date: null,
    },
    {
        id: 6,
        title: 'Hiring developers',
        description: null,
        status: 'todo',
        assignee: 'Nischal',
        date: null,
    },
    {
        id: 7,
        title: 'Billing software',
        description: null,
        status: 'todo',
        assignee: 'Ankit',
        date: null,
    },
    {
        id: 8,
        title: 'Accountant (gst)',
        description: 'Unhive ventures LLP',
        status: 'in-progress',
        assignee: 'Ankit',
        date: null,
    },
    {
        id: 9,
        title: 'Hunting Office space',
        description: null,
        status: 'in-progress',
        assignee: 'Nischal',
        date: null,
    },
];

export const infraAssets = [
    {
        id: 1,
        name: 'Staging Database v2',
        altName: 'Staging DB',
        type: 'database',
        status: 'active',
        linked: false,
    },
    {
        id: 2,
        name: 'website',
        type: 'domain',
        status: 'active',
        linked: false,
    },
    {
        id: 3,
        name: 'website',
        type: 'server',
        status: 'active',
        linked: false,
    },
    {
        id: 4,
        name: 'Test Domain',
        type: 'domain',
        status: 'active',
        linked: false,
    },
];

export const links = [
    {
        id: 1,
        name: 'Marketing Campaign Q1',
        url: 'https://example.com/campaign-q1',
        opens: 156,
        createdAt: '2 days ago',
    },
    {
        id: 2,
        name: 'Product Launch Page',
        url: 'https://example.com/product-launch',
        opens: 89,
        createdAt: '1 week ago',
    },
    {
        id: 3,
        name: 'Client Presentation',
        url: 'https://example.com/presentation',
        opens: 23,
        createdAt: '3 days ago',
    },
];

export const teamMembers = [
    {
        id: 1,
        name: 'User A',
        initials: 'UA',
        activity: 'Drafting SEO Proposal',
        activeMinutes: 25,
        isOnline: true,
    },
    {
        id: 2,
        name: 'User B',
        initials: 'UB',
        activity: 'Reviewing Project Tasks',
        activeMinutes: 12,
        isOnline: true,
    },
];

export const dailyLog = [
    {
        id: 1,
        user: 'User A',
        action: 'Completed task "UI Review"',
        time: '2:30 PM',
    },
    {
        id: 2,
        user: 'User B',
        action: 'Created new proposal for Client X',
        time: '1:45 PM',
    },
    {
        id: 3,
        user: 'User A',
        action: 'Updated project status',
        time: '11:20 AM',
    },
    {
        id: 4,
        user: 'User B',
        action: 'Added 3 new leads',
        time: '10:00 AM',
    },
];

export const recentActivity = [
    {
        id: 1,
        type: 'lead',
        title: 'New lead added',
        description: 'Pramod Jain from Sree Manish Telecom',
        time: '5 min ago',
    },
    {
        id: 2,
        type: 'proposal',
        title: 'Proposal sent',
        description: "Sujit's Website Redesign",
        time: '1 hour ago',
    },
    {
        id: 3,
        type: 'task',
        title: 'Task completed',
        description: 'Buy domain - Purchased @ 3252/-',
        time: '2 hours ago',
    },
    {
        id: 4,
        type: 'project',
        title: 'Project updated',
        description: 'Website Development progress updated',
        time: '3 hours ago',
    },
];

export const interestSignals = [
    {
        id: 1,
        lead: 'Pramod Jain',
        signal: 'Opened proposal 3 times',
        urgency: 'high',
    },
    {
        id: 2,
        lead: 'Dilip',
        signal: 'Requested callback',
        urgency: 'medium',
    },
    {
        id: 3,
        lead: 'Rahul Sharma',
        signal: 'Visited pricing page',
        urgency: 'low',
    },
];

export const infraTypes = [
    { value: 'all', label: 'All Assets' },
    { value: 'domain', label: 'Domain' },
    { value: 'server', label: 'Server / Hosting' },
    { value: 'database', label: 'Database' },
    { value: 'cloud', label: 'Cloud Service' },
    { value: 'email', label: 'Email / SMTP' },
    { value: 'api', label: 'API / Tool' },
    { value: 'storage', label: 'Storage / CDN' },
    { value: 'ssl', label: 'SSL / Security' },
];

export const leadFilters = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'converted', label: 'Converted' },
    { value: 'completed', label: 'Completed' },
];

export const projectFilters = [
    { value: 'all', label: 'All' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'reviewing', label: 'Reviewing' },
];

export const assignees = ['All Assignees', 'Nischal', 'Ankit', 'User A'];
export const statuses = ['All Statuses', 'To Do', 'In Progress', 'Completed'];
