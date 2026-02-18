import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, StatusBadge, FloatingAddButton } from '../components/common';
import { Database, Globe, Server, Trash2, Plus, Box, Shield, Zap, Search, ArrowRight } from 'lucide-react';
import { infraAPI } from '../services/api';

const typeIcons = {
    database: Database,
    domain: Globe,
    server: Server,
    ssl: Shield,
    cloud: Box,
    api: Zap,
};

const typeLabels = {
    database: 'DATABASE',
    domain: 'DOMAIN',
    server: 'SERVER / HOSTING',
    cloud: 'CLOUD SERVICE',
    email: 'EMAIL / SMTP',
    api: 'API / TOOL',
    storage: 'STORAGE / CDN',
    ssl: 'SSL / SECURITY',
};

const Infra = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All Assets');

    const tabs = [
        'All Assets',
        'Domains',
        'Servers',
        'Databases',
        'Email',
        'API',
        'Storage',
        'SSL'
    ];

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const data = await infraAPI.getAll();
            setAssets(data);
        } catch (error) {
            console.error('Error fetching infra assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            try {
                await infraAPI.delete(id);
                fetchAssets();
            } catch (error) {
                console.error('Error deleting asset:', error);
            }
        }
    };

    const filteredAssets = assets.filter(asset => {
        if (activeTab === 'All Assets') return true;
        if (activeTab === 'Domains') return asset.type === 'domain';
        if (activeTab === 'Servers') return asset.type === 'server';
        if (activeTab === 'Databases') return asset.type === 'database';
        if (activeTab === 'Email') return asset.type === 'email';
        if (activeTab === 'API') return asset.type === 'api';
        if (activeTab === 'Storage') return asset.type === 'storage';
        if (activeTab === 'SSL') return asset.type === 'ssl';
        return true;
    });

    return (
        <MainLayout
            title="Infrastructure"
            headerAction={
                <Link to="/infra/add" className="btn btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    Add Infra
                </Link>
            }
        >
            {/* Filter Navigation Bar */}
            <div className="bg-white/50 dark:bg-dark-surface/50 rounded-xl border border-gray-100 dark:border-dark-border p-1.5 mb-8 overflow-x-auto">
                <nav className="flex items-center min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
                        >
                            {tab}
                        </button>
                    ))}
                    <div
                        onClick={() => alert('Search feature coming soon!')}
                        className="ml-auto pr-4 flex items-center text-gray-400 hover:text-primary-600 cursor-pointer transition-colors"
                    >
                        <Search size={18} />
                    </div>
                </nav>
            </div>

            {loading ? (
                <div className="card flex flex-col items-center justify-center py-32 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading assets...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                    {filteredAssets.map((asset) => {
                        const Icon = typeIcons[asset.type] || Globe;
                        const hasProjects = asset.projects && asset.projects.length > 0;

                        return (
                            <Card key={asset.id} className="group card-hover hover:border-primary-200 dark:hover:border-primary-900/50 transition-all flex flex-col h-full">
                                <div className="p-1 flex-grow">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 truncate tracking-tight">{asset.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded tracking-widest uppercase">
                                                    {typeLabels[asset.type] || asset.type?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 dark:group-hover:text-primary-400 text-gray-400 dark:text-gray-500 transition-colors border border-gray-100 dark:border-gray-700">
                                            <Icon size={24} />
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        {asset.domain_name && (
                                            <div className="flex items-center justify-between text-xs font-medium">
                                                <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px] font-bold">Domain</span>
                                                <span className="text-gray-900 dark:text-white truncate max-w-[150px] font-mono">{asset.domain_name}</span>
                                            </div>
                                        )}
                                        {asset.expire_date && (
                                            <div className="flex items-center justify-between text-xs font-medium">
                                                <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px] font-bold">Expires</span>
                                                <span className="font-mono text-gray-900 dark:text-white">{asset.expire_date}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Linked Projects Section - Relational Enhancement */}
                                    {hasProjects && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                    Linked Projects ({asset.projects.length})
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {asset.projects.map(project => (
                                                    <Link
                                                        key={project.id}
                                                        to={`/projects/${project.id}`}
                                                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/10 border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 transition-all group/project"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 truncate">{project.title}</span>
                                                                <StatusBadge status={project.status} className="scale-75 origin-left" />
                                                            </div>
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full mt-1.5 overflow-hidden">
                                                                <div
                                                                    className="bg-primary-500 h-full rounded-full"
                                                                    style={{ width: `${project.progress || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <ArrowRight size={12} className="text-gray-400 group-hover/project:text-primary-500 ml-2 transition-transform group-hover/project:translate-x-0.5" />
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <StatusBadge status={asset.status} />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(asset.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
                                            title="Delete Asset"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {!loading && filteredAssets.length === 0 && (
                <div className="text-center py-32 bg-gray-50/50 dark:bg-dark-surface rounded-2xl border border-dashed border-gray-200 dark:border-dark-border">
                    <Box className="mx-auto text-gray-300 dark:text-gray-600 mb-6" size={64} />
                    <p className="text-gray-800 dark:text-gray-200 font-medium text-xl mb-2 tracking-tight">No Assets Found</p>
                    <p className="text-gray-500 dark:text-gray-400 mb-10 text-sm">Try adjusting your filters or add a new asset.</p>
                    <Link to="/infra/add" className="btn btn-primary px-10 py-4">
                        <Plus size={20} className="mr-2" />
                        Add First Asset
                    </Link>
                </div>
            )}
            <FloatingAddButton onClick={() => navigate('/infra/add')} />
        </MainLayout>
    );
};

export default Infra;
