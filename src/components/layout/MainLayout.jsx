import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children, title, subtitle, headerAction }) => {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;

        try {
            const user = JSON.parse(userStr);
            if (!user?.id) return;

            const sendHeartbeat = async () => {
                try {
                    await fetch('/api/auth/heartbeat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id })
                    });
                } catch (err) {
                    console.error('Heartbeat failed', err);
                }
            };

            // Send initial heartbeat
            sendHeartbeat();

            // Send heartbeat every 1 minute
            const interval = setInterval(sendHeartbeat, 60000);
            return () => clearInterval(interval);
        } catch (e) {
            console.error('Error parsing user data', e);
        }
    }, []);

    const sidebarWidth = collapsed ? '80px' : '260px';

    return (
        <div className="min-h-screen bg-[#F5F6FA] dark:bg-[#0B0F1A] transition-colors duration-300">
            <Sidebar collapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />

            {/* Main Content */}
            <main
                className="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pt-16 lg:pt-0"
                style={{ marginLeft: `var(--sidebar-width, ${sidebarWidth})` }}
            >
                <div className="px-4 sm:px-6 lg:px-10 xl:px-14 py-6 lg:py-10 max-w-[1400px] mx-auto">
                    {/* Page Header */}
                    {(title || subtitle || headerAction) && (
                        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 lg:mb-10 page-enter">
                            <div>
                                {title && (
                                    <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p className="mt-1 text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed font-medium">{subtitle}</p>
                                )}
                            </div>
                            {headerAction && (
                                <div className="ml-4 flex-shrink-0">
                                    {headerAction}
                                </div>
                            )}
                        </header>
                    )}

                    {/* Page Content */}
                    <div className="page-enter-delay">
                        {children}
                    </div>
                </div>
            </main>

            {/* CSS Variable for responsive sidebar width */}
            <style>{`
        @media (min-width: 1024px) {
          :root {
            --sidebar-width: ${sidebarWidth};
          }
        }
        @media (max-width: 1023px) {
          :root {
            --sidebar-width: 0px;
          }
        }
      `}</style>
        </div>
    );
};

export default MainLayout;
