import React, { useState } from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/common';
import {
    User,
    Moon,
    Sun,
    Monitor,
    Bell,
    Globe,
    Mail,
    MessageSquare,
    Lock,
    Save
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';

const Settings = () => {
    const { theme, setTheme } = useTheme();
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false
    });

    const [profile, setProfile] = useState({
        name: (() => {
            const storedName = JSON.parse(localStorage.getItem('user'))?.name;
            return (storedName === 'Test User' || !storedName) ? 'Khosha Admin' : storedName;
        })(),
        email: (() => {
            const storedEmail = JSON.parse(localStorage.getItem('user'))?.email;
            return (storedEmail === 'test@example.com' || !storedEmail) ? 'admin@khoshasystems.com' : storedEmail;
        })(),
    });

    return (
        <MainLayout title="Settings">
            <div className="max-w-4xl space-y-8 pb-20 page-enter">

                {/* Theme Settings */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Monitor size={20} className="text-primary-500" />
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 tracking-[0.02em]">Appearance</h2>
                    </div>
                    <Card className="shadow-none border border-gray-100 dark:border-dark-border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'light', label: 'Light Mode', icon: Sun },
                                { id: 'dark', label: 'Dark Mode', icon: Moon },
                                { id: 'system', label: 'System Default', icon: Monitor },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${theme === t.id
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                                        : 'border-gray-100 dark:border-dark-border bg-gray-50/30 dark:bg-white/5 hover:border-gray-200 dark:hover:border-gray-700'
                                        }`}
                                >
                                    <t.icon size={24} className={theme === t.id ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'} />
                                    <span className={`text-sm font-medium ${theme === t.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {t.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Card>
                </section>

                {/* Profile Settings */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <User size={20} className="text-primary-500" />
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 tracking-[0.02em]">Profile Settings</h2>
                    </div>
                    <Card className="shadow-none border border-gray-100 dark:border-dark-border p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    className="input"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    className="input"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-50 dark:border-dark-border">
                            <button className="btn btn-secondary flex items-center gap-2 text-xs uppercase tracking-wider">
                                <Lock size={16} /> Update Password
                            </button>
                        </div>
                    </Card>
                </section>

                {/* Notification Settings */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Bell size={20} className="text-primary-500" />
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 tracking-[0.02em]">Notifications</h2>
                    </div>
                    <Card className="shadow-none border border-gray-100 dark:border-dark-border divide-y divide-gray-50 dark:divide-dark-border">
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="icon-circle-primary">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Receive project updates via email</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                                className={`w-12 h-6 rounded-full transition-all relative ${notifications.email ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${notifications.email ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="icon-circle-success">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">SMS Notifications</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Critical alerts sent to your phone</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, sms: !notifications.sms })}
                                className={`w-12 h-6 rounded-full transition-all relative ${notifications.sms ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${notifications.sms ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </Card>
                </section>

                {/* Preferences */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Globe size={20} className="text-primary-500" />
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 tracking-[0.02em]">General Preferences</h2>
                    </div>
                    <Card className="shadow-none border border-gray-100 dark:border-dark-border p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Language</label>
                                <select className="input appearance-none cursor-pointer">
                                    <option>English (US)</option>
                                    <option>English (UK)</option>
                                    <option>Hindi</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Time Zone</label>
                                <select className="input appearance-none cursor-pointer">
                                    <option>(GMT+05:30) India</option>
                                    <option>(GMT-08:00) Pacific</option>
                                    <option>(GMT+00:00) UTC</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Date Format</label>
                                <select className="input appearance-none cursor-pointer">
                                    <option>DD/MM/YYYY</option>
                                    <option>MM/DD/YYYY</option>
                                    <option>YYYY-MM-DD</option>
                                </select>
                            </div>
                        </div>
                    </Card>
                </section>

                <div className="flex justify-end pt-4">
                    <button className="btn btn-primary flex items-center gap-2 px-10 py-3 text-xs uppercase tracking-wider font-bold">
                        <Save size={18} /> Save All Changes
                    </button>
                </div>
            </div>
        </MainLayout>
    );
};

export default Settings;
