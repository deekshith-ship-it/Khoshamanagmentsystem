import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, StatusBadge, FloatingAddButton } from '../components/common';
import { Globe, Server, Mail, Trash2, Plus, Search, ArrowRight, ExternalLink } from 'lucide-react';
import { infraAPI } from '../services/api';

const typeIcons = {
    DOMAIN: Globe,
    SERVER: Server,
    EMAIL: Mail
};

const Infra = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    const tabs = ['All', 'Domain', 'Server', 'Email'];

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const data = await infraAPI.getAll();
            setAssets(data || []);
        } catch (error) {
            console.error('Error fetching infra assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
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
        if (activeTab === 'All') return true;
        return asset.type === activeTab.toUpperCase();
    });

    return (
        <MainLayout
            title="Infrastructure"
            headerAction={
                <Link to="/infra/add" className="btn btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    New Infrastructure
                </Link>
            }
        >
            {/* Tabs */}
            <div className="flex gap-2 mb-8 p-1 bg-gray-100/50 dark:bg-white/[0.04] rounded-2xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-white dark:bg-[#1f2937] text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssets.map((asset) => {
                        const Icon = typeIcons[asset.type] || Globe;

                        return (
                            <Card
                                key={asset.id}
                                className="group cursor-pointer hover:border-primary-500/50 dark:hover:border-primary-500/30 transition-all !p-0 overflow-hidden"
                                onClick={() => navigate(`/infra/${asset.id}`)}
                            >
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-500/10 group-hover:text-primary-600 transition-all shadow-inner">
                                            <Icon size={24} />
                                        </div>
                                        <StatusBadge status={asset.status} />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors truncate">
                                            {asset.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider flex items-center gap-2">
                                            {asset.type}
                                            {asset.server_type && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-[10px]">
                                                    {asset.server_type}
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-white/5">
                                        <span className="text-[10px] uppercase font-bold tracking-widest">
                                            Click for Details
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleDelete(e, asset.id)}
                                                className="p-2 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="p-2 text-primary-500">
                                                <ArrowRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {!loading && filteredAssets.length === 0 && (
                <div className="text-center py-24 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                    <Globe className="mx-auto text-gray-300 dark:text-gray-700 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No infrastructure found</h3>
                    <p className="text-sm text-gray-500 mb-6">Start by adding your first domain or server.</p>
                    <Link to="/infra/add" className="btn btn-primary">
                        Add New Asset
                    </Link>
                </div>
            )}

            <FloatingAddButton onClick={() => navigate('/infra/add')} />
        </MainLayout>
    );
};

export default Infra;
