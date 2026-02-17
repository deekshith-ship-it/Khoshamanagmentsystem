import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/common';
import { teamAPI } from '../services/api';
import { Calendar, Search, Clock, Timer } from 'lucide-react';

const Team = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [workSessions, setWorkSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    // Used to trigger re-renders for timer updates
    // eslint-disable-next-line no-unused-vars
    const [currentTime, setCurrentTime] = useState(new Date());

    // Get current user from local storage (may be null if not logged in)
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // 1️⃣ Session Tracking Logic — only for logged-in users
    useEffect(() => {
        if (!user) return;

        // Set session start time if not exists
        let sessionStart = localStorage.getItem('team_session_start');
        if (!sessionStart) {
            sessionStart = Date.now().toString();
            localStorage.setItem('team_session_start', sessionStart);
        }

        // Update current time every minute for UI refresh of timers
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, [user]);

    // Format relative time (e.g., "5 mins ago")
    const formatLastSeen = (dateString, status) => {
        if (status === 'active') return 'Now';
        if (!dateString) return 'Offline';

        const safeDateStr = dateString.replace(' ', 'T') + 'Z';
        const past = new Date(safeDateStr);
        const now = new Date();
        const diffMs = now - past;

        if (isNaN(diffMs)) return 'Offline';

        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return past.toLocaleDateString();
    };

    // Calculate active duration for current user from localStorage
    const getActiveDuration = (userId) => {
        if (user && (user.id === userId || user.email === teamMembers.find(m => m.id === userId)?.email)) {
            const start = parseInt(localStorage.getItem('team_session_start') || Date.now());
            const diff = Date.now() - start;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        }
        return null;
    };

    // Calculate total working hours for a specific team member from DB sessions
    const getTodayWorkingHours = (userId) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        let totalMs = 0;
        const userSessions = workSessions.filter(s => s.user_id === userId);

        userSessions.forEach(session => {
            const loginStr = session.login_time?.replace(' ', 'T') + 'Z';
            const loginTime = new Date(loginStr);

            // Only count today's sessions
            if (loginTime >= todayStart) {
                let logoutTime;
                if (session.logout_time) {
                    const logoutStr = session.logout_time.replace(' ', 'T') + 'Z';
                    logoutTime = new Date(logoutStr);
                } else {
                    // Session still active — count up to now
                    logoutTime = new Date();
                }
                totalMs += logoutTime - loginTime;
            }
        });

        if (totalMs === 0) return null;

        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // Calculate total working hours for the last 7 days
    const getWeeklyWorkingHours = (userId) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        let totalMs = 0;
        const userSessions = workSessions.filter(s => s.user_id === userId);

        userSessions.forEach(session => {
            const loginStr = session.login_time?.replace(' ', 'T') + 'Z';
            const loginTime = new Date(loginStr);

            if (loginTime >= weekStart) {
                let logoutTime;
                if (session.logout_time) {
                    const logoutStr = session.logout_time.replace(' ', 'T') + 'Z';
                    logoutTime = new Date(logoutStr);
                } else {
                    logoutTime = new Date();
                }
                totalMs += logoutTime - loginTime;
            }
        });

        if (totalMs === 0) return null;

        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const fetchTeamData = useCallback(async () => {
        try {
            // Only show loader on initial load
            if (teamMembers.length === 0) setLoading(true);

            const [team, activity, hours] = await Promise.all([
                teamAPI.getAll(),
                teamAPI.getActivity(),
                teamAPI.getHours().catch(() => [])
            ]);
            setTeamMembers(team);
            setActivityLog(activity || []);
            setWorkSessions(hours || []);
        } catch (error) {
            console.error('Error fetching team data:', error);
        } finally {
            setLoading(false);
        }
    }, [teamMembers.length]);

    useEffect(() => {
        fetchTeamData();
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchTeamData, 30000);
        return () => clearInterval(interval);
    }, [fetchTeamData]);

    if (loading && teamMembers.length === 0) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 dark:text-gray-500">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent mb-4"></div>
                    <p className="font-medium animate-pulse">Syncing team activity...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto px-4 lg:px-6 transition-all duration-500">
                {/* 1️⃣ Page Header */}
                <header className="flex items-center justify-between mb-10 pt-2">
                    <div>
                        <h1 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">Team Activity</h1>
                        <p className="text-[13px] font-medium text-gray-400 dark:text-gray-500 mt-1">
                            Real-time collaboration status & working hours
                        </p>
                    </div>
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => alert('Calendar feature coming soon!')}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                            <Calendar size={20} />
                        </button>
                        <button
                            onClick={() => alert('Search feature coming soon!')}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                            <Search size={20} />
                        </button>
                    </div>
                </header>

                {/* 2️⃣ Active Focus Section Subheading */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <h2 className="text-xs text-gray-400 dark:text-gray-500 font-bold tracking-widest uppercase">
                            Team Members • <span className="text-primary-600 dark:text-primary-400">{teamMembers.filter(m => m.status === 'active').length} Active</span>
                        </h2>
                    </div>
                    {user && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-dark-surface/50 rounded-lg border border-gray-100 dark:border-dark-border">
                            <Clock size={12} className="text-gray-500 dark:text-gray-400" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                                My Session: {getActiveDuration(user.id)}
                            </span>
                        </div>
                    )}
                </div>

                {/* 3️⃣ Team Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 stagger-children">
                    {teamMembers.map((member) => {
                        const isCurrentUser = user && (user.id === member.id || user.email === member.email);
                        const status = isCurrentUser ? 'active' : (member.status || 'offline');
                        const activeDuration = getActiveDuration(member.id);
                        const lastSeenText = formatLastSeen(member.last_active, status);
                        const todayHours = getTodayWorkingHours(member.id);
                        const weeklyHours = getWeeklyWorkingHours(member.id);

                        return (
                            <Card key={member.id} className="flex flex-col w-full group card-hover hover:border-primary-200 dark:hover:border-primary-900/50 transition-all duration-300">
                                {/* Top row: avatar + name */}
                                <div className="flex items-start gap-5">
                                    <div className="relative shrink-0">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-lg border border-gray-100 dark:border-gray-700">
                                            {member.initials || member.name?.charAt(0)}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-[2px] border-white dark:border-dark-surface rounded-full shadow-sm ${status === 'active' ? 'bg-success-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate leading-tight mb-0.5">
                                                    {member.name} {isCurrentUser && <span className="text-xs text-gray-400 font-normal">(You)</span>}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                                                    {member.role || 'Member'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status + Session row */}
                                <div className="mt-4 flex items-center gap-4 border-t border-gray-50 dark:border-gray-800 pt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                                        <span className={`text-xs font-bold ${status === 'active' ? 'text-success-600 dark:text-success-400' : 'text-gray-400'}`}>
                                            {status === 'active' ? 'Active Now' : 'Offline'}
                                        </span>
                                    </div>
                                    <div className="w-px h-6 bg-gray-100 dark:bg-gray-800"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {isCurrentUser ? 'Session' : 'Last Seen'}
                                        </span>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                            <Clock size={10} />
                                            {isCurrentUser ? activeDuration : lastSeenText}
                                        </span>
                                    </div>
                                </div>

                                {/* Working Hours row */}
                                <div className="mt-3 flex items-center gap-4 border-t border-gray-50 dark:border-gray-800 pt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Today</span>
                                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                                            <Timer size={10} />
                                            {todayHours || '0h 0m'}
                                        </span>
                                    </div>
                                    <div className="w-px h-6 bg-gray-100 dark:bg-gray-800"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">This Week</span>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                            <Timer size={10} />
                                            {weeklyHours || '0h 0m'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* 4️⃣ Activity Log Section */}
                <div className="mb-8 flex items-center gap-2">
                    <Clock size={18} className="text-primary-500" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Recent Activity Log</h2>
                </div>

                <div className="relative border-l-2 border-dashed border-gray-200 dark:border-gray-800 ml-3.5 space-y-8 pb-10">
                    {activityLog.length > 0 ? (
                        activityLog.map((log) => (
                            <div key={log.id} className="pl-8 relative group">
                                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-dark-bg border-2 border-gray-300 dark:border-gray-600 group-hover:border-primary-500 dark:group-hover:border-primary-400 group-hover:scale-110 transition-all"></div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{log.action || 'Updated project details'}</h4>
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded uppercase tracking-wider">
                                        {new Date(log.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">{log.user_name}</span> working on <span className="text-primary-600 dark:text-primary-400 font-medium">{log.type || 'General Task'}</span>
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="pl-8 text-sm text-gray-400 italic">No recent activity recorded.</div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Team;
