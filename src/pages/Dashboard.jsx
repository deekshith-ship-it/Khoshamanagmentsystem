import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { Card, Avatar, StatsCard } from '../components/common';
import {
    Users,
    FileText,
    FolderKanban,
    ArrowRight,
    Activity,
    Loader2,
    ClipboardList,
    Server,
    CheckCircle2,
    Clock,
    AlertCircle,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { leadsAPI, proposalsAPI, projectsAPI, tasksAPI, infraAPI } from '../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        leads: 0, proposals: 0, projects: 0,
        tasks: { total: 0, completed: 0, pending: 0, overdue: 0 },
        infra: { total: 0, active: 0, inactive: 0 }
    });
    const [recentLeads, setRecentLeads] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        fetchDashboardData();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [leads, proposals, projects, tasks, infra] = await Promise.all([
                leadsAPI.getAll(),
                proposalsAPI.getAll(),
                projectsAPI.getAll(),
                tasksAPI.getAll(),
                infraAPI.getAll()
            ]);

            // Calculate Task Stats
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const taskStats = {
                total: tasks.length,
                completed: tasks.filter(t => t.status === 'completed').length,
                pending: tasks.filter(t => t.status !== 'completed').length,
                overdue: tasks.filter(t => {
                    if (!t.date || t.status === 'completed') return false;
                    const taskDate = new Date(t.date);
                    return taskDate < today;
                }).length
            };

            // Calculate Infra Stats
            const infraStats = {
                total: infra.length,
                active: infra.filter(i => i.status === 'active').length,
                inactive: infra.filter(i => i.status !== 'active').length
            };

            setStats({
                leads: leads.filter(l => !['closed-won', 'closed-lost', 'completed', 'converted'].includes(l.status)).length,
                proposals: proposals ? proposals.filter(p => !p.status || p.status === 'sent').length : 0,
                projects: projects.filter(p => p.status === 'in-progress').length,
                tasks: taskStats,
                infra: infraStats
            });

            setRecentLeads(leads.slice(0, 4));

            // Mock recent activity for now, merged with real if available
            // In a real app, this would come from an activity log API
            const activityItems = [
                { id: 1, type: 'lead', title: 'New lead added', description: 'Latest activity from leads', time: 'Just now', link: '/leads' },
                { id: 2, type: 'proposal', title: 'Proposal sent', description: 'Check your proposals', time: '1 hour ago', link: '/proposals' },
                { id: 3, type: 'project', title: 'Project updated', description: 'Progress on active projects', time: '2 hours ago', link: '/projects' },
            ];
            setRecentActivity(activityItems);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSessionDuration = () => {
        const start = localStorage.getItem('team_session_start');
        if (!start) return '0m';
        const diff = Date.now() - parseInt(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto transition-all duration-500">
                {/* 1️⃣ Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-10 page-enter">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            Here's what's happening with your projects today.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-5 justify-end">
                        <div className="text-right">
                            <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Current Session</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white font-mono">{getSessionDuration()}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                        <div className="text-right">
                            <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Date</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2️⃣ KPI Cards Row 1 - Sales & Projects */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6 stagger-children">
                    <div onClick={() => navigate('/leads')} className="cursor-pointer">
                        <StatsCard
                            title="Active Leads"
                            value={loading ? '...' : stats.leads}
                            icon={Users}
                            trend={12}
                        />
                    </div>
                    <div onClick={() => navigate('/proposals')} className="cursor-pointer">
                        <StatsCard
                            title="Pending Proposals"
                            value={loading ? '...' : stats.proposals}
                            icon={FileText}
                            subtitle="Awaiting approval"
                        />
                    </div>
                    <div onClick={() => navigate('/projects')} className="cursor-pointer">
                        <StatsCard
                            title="Active Projects"
                            value={loading ? '...' : stats.projects}
                            icon={FolderKanban}
                            subtitle="In progress"
                        />
                    </div>
                </div>

                {/* 3️⃣ KPI Cards Row 2 - Operations (Tasks & Infra) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-10 stagger-children">
                    {/* General Tasks Card - Custom Design for Detailed Stats */}
                    <Card
                        className="cursor-pointer group hover:border-primary-200 dark:hover:border-primary-900/50 transition-all"
                        onClick={() => navigate('/tasks')}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">General Tasks</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {loading ? '...' : stats.tasks.total}
                                </h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400">
                                <ClipboardList size={22} />
                            </div>
                        </div>

                        {/* Task Breakdown */}
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 justify-center md:justify-start">
                                    <CheckCircle2 size={10} className="text-success-500" /> Completed
                                </p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    {loading ? '...' : stats.tasks.completed}
                                </p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 justify-center md:justify-start">
                                    <Clock size={10} className="text-warning-500" /> Pending
                                </p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    {loading ? '...' : stats.tasks.pending}
                                </p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 justify-center md:justify-start">
                                    <AlertCircle size={10} className="text-danger-500" /> Overdue
                                </p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    {loading ? '...' : stats.tasks.overdue}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Infra Card - Custom Design for Detailed Stats */}
                    <Card
                        className="cursor-pointer group hover:border-primary-200 dark:hover:border-primary-900/50 transition-all"
                        onClick={() => navigate('/infra')}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Infrastructure</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {loading ? '...' : stats.infra.total}
                                </h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/10 text-cyan-600 dark:text-cyan-400">
                                <Server size={22} />
                            </div>
                        </div>

                        {/* Infra Breakdown */}
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 justify-center md:justify-start">
                                    <Wifi size={10} className="text-success-500" /> Active
                                </p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    {loading ? '...' : stats.infra.active}
                                </p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 justify-center md:justify-start">
                                    <WifiOff size={10} className="text-gray-500" /> Inactive
                                </p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    {loading ? '...' : stats.infra.inactive}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 4️⃣ Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Activity Timeline */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
                                <div className="icon-circle-primary w-8 h-8">
                                    <Activity size={16} strokeWidth={2} />
                                </div>
                                Recent Activity
                            </h2>
                        </div>
                        <Card padding="none" hover={false} className="overflow-hidden">
                            <div className="p-6">
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent dark:before:via-gray-700/50">
                                    {recentActivity.map((activity, index) => (
                                        <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-xl border-[3px] border-[#F5F6FA] dark:border-[#0B0F1A] bg-white dark:bg-dark-surface shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:scale-105 transition-transform duration-200"
                                                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                                            >
                                                {activity.type === 'lead' && <Users size={16} className="text-primary-500" />}
                                                {activity.type === 'proposal' && <FileText size={16} className="text-violet-500" />}
                                                {activity.type === 'project' && <FolderKanban size={16} className="text-emerald-500" />}
                                            </div>

                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-gray-50/60 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer group/card" onClick={() => navigate(activity.link)}>
                                                <div className="flex items-center justify-between space-x-2 mb-1">
                                                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{activity.title}</div>
                                                    <time className="font-mono text-[11px] text-gray-400 dark:text-gray-500">{activity.time}</time>
                                                </div>
                                                <div className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                                                    {activity.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Recent Leads Sidebar */}
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">New Leads</h2>
                            <button
                                onClick={() => navigate('/leads')}
                                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 uppercase tracking-wider flex items-center gap-1 transition-all duration-200 hover:gap-1.5"
                            >
                                View All <ArrowRight size={12} />
                            </button>
                        </div>
                        <div className="space-y-3 stagger-children">
                            {loading ? (
                                <Card className="!p-8 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" /></Card>
                            ) : (
                                recentLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        onClick={() => navigate(`/leads/${lead.id}`)}
                                        className="card card-hover flex items-center gap-4 p-4 cursor-pointer group"
                                    >
                                        <Avatar name={lead.name} size="sm" color="primary" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                                                {lead.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                {lead.company || 'No Company'}
                                            </p>
                                        </div>
                                        <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" />
                                    </div>
                                ))
                            )}
                            {!loading && recentLeads.length === 0 && (
                                <div className="text-center py-10 bg-gray-50 dark:bg-dark-surface rounded-2xl border border-dashed border-gray-200 dark:border-dark-border">
                                    <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">No active leads</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Dashboard;
