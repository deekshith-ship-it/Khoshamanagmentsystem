import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card } from '../components/common';
import {
    ArrowLeft, Globe, Server, Mail, Link as LinkIcon,
    Trash2, Plus, X, ExternalLink, Calendar,
    ShieldCheck, Cpu, HardDrive, Key
} from 'lucide-react';
import { infraAPI, projectsAPI } from '../services/api';

const InfraDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allProjects, setAllProjects] = useState([]);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState('');

    const fetchDetails = useCallback(async () => {
        try {
            setLoading(true);
            const [assetData, projectsData] = await Promise.all([
                infraAPI.getById(id),
                projectsAPI.getAll()
            ]);
            setAsset(assetData);
            setAllProjects(projectsData || []);
        } catch (error) {
            console.error('Error fetching infra details:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleLinkProject = async () => {
        if (!selectedProjectId) return;
        try {
            await infraAPI.linkProject(id, selectedProjectId);
            setShowLinkModal(false);
            fetchDetails();
        } catch (error) {
            console.error('Error linking project:', error);
        }
    };

    const handleUnlinkProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to unlink this project?')) return;
        try {
            await infraAPI.unlinkProject(id, projectId);
            fetchDetails();
        } catch (error) {
            console.error('Error unlinking project:', error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this infrastructure asset? This cannot be undone.')) return;
        try {
            await infraAPI.delete(id);
            navigate('/infra');
        } catch (error) {
            console.error('Error deleting asset:', error);
        }
    };

    if (loading) return (
        <MainLayout>
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        </MainLayout>
    );

    if (!asset) return (
        <MainLayout>
            <div className="p-8 text-center bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border">
                <p className="text-gray-500">Infrastructure asset not found.</p>
                <button onClick={() => navigate('/infra')} className="mt-4 btn btn-primary">Back to Infra</button>
            </div>
        </MainLayout>
    );

    const metadata = asset.metadata || {};

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">

                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/infra')}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Infrastructure
                    </button>
                    <div className="flex gap-3">
                        <button onClick={handleDelete} className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 transition-all">
                            <Trash2 size={20} />
                        </button>
                        <button className="btn btn-primary px-6">Edit Details</button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Asset Profile & Dynamic Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="!p-8 overflow-hidden relative">
                            {/* Decorative Background Icon */}
                            <div className="absolute -top-12 -right-12 text-primary-500/5 dark:text-primary-500/10 transform rotate-12">
                                {asset.type === 'DOMAIN' && <Globe size={180} />}
                                {asset.type === 'SERVER' && <Server size={180} />}
                                {asset.type === 'EMAIL' && <Mail size={180} />}
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-700 dark:text-primary-400 shrink-0 shadow-inner">
                                    {asset.type === 'DOMAIN' && <Globe size={40} />}
                                    {asset.type === 'SERVER' && <Server size={40} />}
                                    {asset.type === 'EMAIL' && <Mail size={40} />}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{asset.name}</h1>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${asset.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                                            }`}>
                                            {asset.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        {asset.type} • {asset.server_type || 'General'}
                                    </p>
                                </div>
                            </div>

                            {/* Dynamic Fields Display */}
                            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50 dark:border-white/5">
                                {asset.type === 'DOMAIN' && (
                                    <>
                                        <DetailItem icon={Globe} label="Domain Name" value={metadata.domain} copyable />
                                        <DetailItem icon={ShieldCheck} label="Registrar" value={metadata.registrar} />
                                        <DetailItem icon={Calendar} label="Expiry Date" value={metadata.expiry} />
                                        <DetailItem icon={ShieldCheck} label="Auto Renewal" value={metadata.autoRenew} />
                                        <DetailItem icon={Globe} label="DNS Provider" value={metadata.dnsProvider} />
                                    </>
                                )}

                                {asset.type === 'SERVER' && (
                                    <>
                                        <DetailItem icon={Server} label="Provider" value={metadata.provider} />
                                        <DetailItem icon={Cpu} label="IP Address" value={metadata.ip} copyable />
                                        <DetailItem icon={HardDrive} label="Control Panel" value={metadata.panel} />
                                        <DetailItem icon={Calendar} label="Renewal Date" value={metadata.renewal} />
                                        <DetailItem icon={Key} label="Root Access" value={metadata.rootAccess} />
                                    </>
                                )}

                                {asset.type === 'EMAIL' && (
                                    <>
                                        <DetailItem icon={Mail} label="Email Address" value={metadata.email} copyable />
                                        <DetailItem icon={Key} label="Password" value={metadata.password} copyable secret />
                                        <DetailItem icon={Server} label="Email Provider" value={metadata.provider} />
                                        <DetailItem icon={Mail} label="Recovery Email" value={metadata.recovery} />
                                        <DetailItem icon={Globe} label="Linked Domain" value={metadata.linkedDomain} />
                                    </>
                                )}
                            </div>

                            {metadata.notes && (
                                <div className="mt-8 p-6 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Administrator Notes</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-mono">{metadata.notes}</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Linked Projects */}
                    <div className="space-y-8">
                        <Card className="!p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Linked Projects</h3>
                                <button
                                    onClick={() => setShowLinkModal(true)}
                                    className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-all"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="flex-1 space-y-3">
                                {asset.projects?.length > 0 ? (
                                    asset.projects.map(project => (
                                        <div
                                            key={project.id}
                                            className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-primary-500/30 transition-all cursor-pointer"
                                            onClick={() => navigate(`/projects/${project.id}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-dark-surface shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary-500 transition-colors">
                                                    <LinkIcon size={14} />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {project.title}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUnlinkProject(project.id); }}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-danger-500 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                                        <LinkIcon size={32} className="text-gray-300 dark:text-gray-700 mb-3" />
                                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 italic">No projects linked yet</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Link Project Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 overflow-hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLinkModal(false)}></div>
                    <div className="relative z-[1110] w-full max-w-md bg-white dark:bg-dark-surface rounded-3xl p-8 shadow-2xl animate-enter">
                        <header className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Link New Project</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Select a project to connect with this asset</p>
                        </header>
                        <div className="space-y-4">
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary-500 outline-none text-sm appearance-none cursor-pointer text-gray-900 dark:text-white"
                            >
                                <option value="">-- Choose Project --</option>
                                {allProjects
                                    .filter(p => !asset.projects?.find(ap => ap.id === p.id))
                                    .map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))
                                }
                            </select>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowLinkModal(false)} className="flex-1 btn btn-secondary py-3 text-xs uppercase tracking-widest font-bold">Cancel</button>
                                <button onClick={handleLinkProject} className="flex-1 btn btn-primary py-3 text-xs uppercase tracking-widest font-bold">Link Now</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                .dropdown-enter {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </MainLayout>
    );
};

const DetailItem = ({ icon: Icon, label, value, copyable, secret }) => {
    const [hidden, setHidden] = useState(secret);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        alert('Copied to clipboard');
    };

    return (
        <div className="group space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Icon size={10} className="text-primary-500/60" />
                {label}
            </label>
            <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${hidden ? 'blur-[4px] select-none text-gray-300' : 'text-gray-800 dark:text-gray-200'}`}>
                    {value || 'N/A'}
                </span>
                <div className="hidden group-hover:flex items-center gap-1">
                    {copyable && value && (
                        <button onClick={handleCopy} className="p-1 rounded bg-gray-100 dark:bg-white/10 text-gray-400 hover:text-primary-500 transition-colors">
                            <Plus size={10} className="rotate-45" /> {/* Using Plus rotated as a placeholder for copy if needed, but the user is fine with minimal icon sets */}
                            <ExternalLink size={10} />
                        </button>
                    )}
                    {secret && (
                        <button onClick={() => setHidden(!hidden)} className="text-[10px] text-primary-500 font-bold hover:underline ml-2">
                            {hidden ? 'SHOW' : 'HIDE'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InfraDetails;
