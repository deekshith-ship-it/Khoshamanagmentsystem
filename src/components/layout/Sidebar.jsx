import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    FolderKanban,
    Server,
    CheckSquare,
    Link as LinkIcon,
    UsersRound,
    UserPlus,
    CreditCard,
    FileSignature,
    Settings,
    Menu,
    X,
    LogOut,
    ChevronUp
} from 'lucide-react';
import { authAPI } from '../../services/api';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/leads', label: 'Leads', icon: Users },
    { path: '/proposals', label: 'Proposals', icon: FileText },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/infra', label: 'Infra', icon: Server },
    { path: '/tasks', label: 'General Tasks', icon: CheckSquare },
    { path: '/links', label: 'Links', icon: LinkIcon },
    { path: '/team', label: 'Team', icon: UsersRound },
    { path: '/onboarding', label: 'Onboarding', icon: UserPlus },
    { path: '/billing', label: 'Billing', icon: CreditCard },
    { path: '/contracts', label: 'Contracts', icon: FileSignature },
    { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ collapsed, toggleCollapse }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user?.id) {
                await authAPI.logout(user.id);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('team_session_start');
            localStorage.removeItem('sessionId');
            window.location.href = '/login'; // Force reload/redirect
        }
    };

    // Get Admin user details (fallback to 'Admin' for UI consistency)
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userName = (user?.name === 'Test User' || !user?.name) ? 'Admin' : user.name;
    const userRole = (user?.role === 'Test User' || !user?.role) ? 'Admin' : user.role;
    const userInitials = userName.charAt(0).toUpperCase();

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={toggleMobile}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md text-gray-700 dark:text-white rounded-xl border border-gray-200/60 dark:border-[#1F2937] transition-all duration-200 hover:bg-gray-50 dark:hover:bg-[#1F2937]"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
                {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity duration-300"
                    onClick={toggleMobile}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed top-0 left-0 h-full z-40
                    bg-white dark:bg-[#0F1525]
                    border-r border-gray-200/60 dark:border-[#1F2937]
                    flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${collapsed ? 'w-20' : 'w-64'}
                    ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
                `}
                style={{ boxShadow: '1px 0 0 rgba(0,0,0,0.02)' }}
            >
                {/* 1️⃣ Logo Section */}
                <div className="h-[72px] flex items-center justify-between px-5 border-b border-gray-100 dark:border-[#1F2937]">
                    <div className={`flex items-center gap-2.5 transition-opacity duration-300 ${collapsed ? 'justify-center w-full' : ''}`}>
                        <img
                            src="/khosha-logo.png"
                            alt="Khosha Systems"
                            className={`object-contain shrink-0 transition-all duration-300 ${collapsed ? 'h-9 w-9' : 'h-10'}`}
                            style={collapsed ? { objectPosition: 'left center', width: '36px', clipPath: 'inset(15% 55% 15% 0%)' } : {}}
                        />
                    </div>
                    {/* Desktop Toggle Button */}
                    <button
                        onClick={toggleCollapse}
                        className="hidden lg:flex items-center justify-center w-6 h-6 rounded-lg bg-white dark:bg-[#1F2937] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#283548] transition-all duration-200 absolute -right-3 top-[22px] border border-gray-200 dark:border-[#374151] z-50"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                    >
                        {collapsed ? <ChevronUp className="rotate-90" size={14} /> : <ChevronUp className="-rotate-90" size={14} />}
                    </button>
                </div>

                {/* 2️⃣ Navigation Section */}
                <nav className="flex-1 px-3 py-5 overflow-y-auto custom-scrollbar">
                    <ul className="space-y-0.5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.path === '/'
                                ? location.pathname === '/'
                                : location.pathname.startsWith(item.path);

                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        onClick={() => setIsMobileOpen(false)}
                                        title={collapsed ? item.label : ''}
                                        className={`
                                            group flex items-center ${collapsed ? 'justify-center px-0' : 'px-3 gap-3'} 
                                            py-2.5 rounded-xl transition-all duration-200 relative
                                            ${isActive
                                                ? 'bg-primary-50 dark:bg-primary-500/[0.08] text-primary-600 dark:text-primary-400 font-semibold'
                                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-800 dark:hover:text-gray-200 font-medium'
                                            }
                                        `}
                                    >
                                        {/* Active indicator bar */}
                                        {isActive && !collapsed && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full"
                                                style={{ animation: 'slideDown 0.2s ease-out' }}
                                            />
                                        )}
                                        <Icon
                                            size={20}
                                            className={`transition-colors duration-200 shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}
                                            strokeWidth={isActive ? 2.2 : 1.8}
                                        />
                                        {!collapsed && (
                                            <span className="text-[13px] relative z-10 whitespace-nowrap">{item.label}</span>
                                        )}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* 3️⃣ Admin User Footer & Dropdown */}
                <div className="p-3 border-t border-gray-100 dark:border-[#1F2937]" ref={profileRef}>
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className={`
                                    w-full flex items-center ${collapsed ? 'justify-center p-2' : 'gap-3 p-2.5'} 
                                    rounded-xl transition-all duration-200
                                    ${isProfileOpen
                                        ? 'bg-gray-50 dark:bg-white/[0.04]'
                                        : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                                    }
                                `}
                            >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-500/10 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm shrink-0">
                                    {userInitials}
                                </div>
                                {!collapsed && (
                                    <>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {userName}
                                            </p>
                                            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                {userRole}
                                            </p>
                                        </div>
                                        <ChevronUp
                                            size={16}
                                            className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? '' : 'rotate-180'}`}
                                        />
                                    </>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className={`absolute bottom-full ${collapsed ? 'left-full ml-2 w-48' : 'left-0 w-full mb-1.5'} bg-white dark:bg-[#1F2937] border border-gray-200/60 dark:border-[#374151] rounded-xl overflow-hidden dropdown-enter z-50`}
                                    style={{ boxShadow: '0 8px 24px -6px rgba(0,0,0,0.1), 0 4px 8px -4px rgba(0,0,0,0.04)' }}
                                >
                                    <div className="p-1.5">
                                        <button
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors duration-150"
                                            onClick={handleLogout}
                                        >
                                            <LogOut size={16} className="text-red-500 dark:text-red-400" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className={`w-full flex items-center ${collapsed ? 'justify-center p-2' : 'gap-3 p-2.5'} rounded-xl bg-primary-50 dark:bg-primary-500/[0.08] text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/[0.12] transition-all duration-200`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1F2937] flex items-center justify-center shrink-0"
                                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                            >
                                <LogOut size={16} className="ml-0.5" />
                            </div>
                            {!collapsed && (
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-semibold">Sign In</p>
                                </div>
                            )}
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
