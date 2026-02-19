import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { infraAPI, projectsAPI } from '../services/api';
import { X, Globe, Server, Mail, ChevronDown } from 'lucide-react';

const AddInfra = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);

    // Core Infra Data
    const [name, setName] = useState('');
    const [type, setType] = useState('DOMAIN'); // DOMAIN | SERVER | EMAIL
    const [serverType, setServerType] = useState('Cloud Server');
    const [status, setStatus] = useState('active');
    const [selectedProjectId, setSelectedProjectId] = useState('');

    // Dynamic Metadata
    const [metadata, setMetadata] = useState({});

    // Fetch projects for linking
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectsAPI.getAll();
                setProjects(data || []);
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };
        fetchProjects();

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Reset metadata when type changes
    useEffect(() => {
        setMetadata({});
        if (type === 'SERVER') setServerType('Cloud Server');
    }, [type]);

    const handleMetadataChange = (key, value) => {
        setMetadata(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                name,
                type,
                server_type: type === 'SERVER' ? serverType : null,
                metadata,
                status
            };

            const result = await infraAPI.create(payload);

            // If project selected, link it
            if (selectedProjectId && result.id) {
                await infraAPI.linkProject(result.id, selectedProjectId);
            }

            navigate('/infra');
        } catch (error) {
            console.error('Error creating infra asset:', error);
            alert('Failed to save infrastructure asset');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300" onClick={() => navigate('/infra')}></div>

                <div className="relative z-[1010] w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#0F1525] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col overflow-hidden animate-enter">

                    {/* Header */}
                    <header className="flex-shrink-0 p-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                {type === 'DOMAIN' && <Globe size={20} />}
                                {type === 'SERVER' && <Server size={20} />}
                                {type === 'EMAIL' && <Mail size={20} />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Infrastructure</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Add and link your technical assets</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/infra')} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </header>

                    {/* Form Body */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <form id="add-infra-form" onSubmit={handleSubmit} className="space-y-8">

                            {/* 1. Infra Type Selection */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Infrastructure Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'DOMAIN', label: 'Domain', icon: Globe },
                                        { id: 'SERVER', label: 'Server', icon: Server },
                                        { id: 'EMAIL', label: 'Email', icon: Mail }
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setType(item.id)}
                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${type === item.id
                                                    ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-500/10 dark:border-primary-500/30 dark:text-primary-400'
                                                    : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 dark:bg-white/5 dark:border-white/5 dark:text-gray-400'
                                                }`}
                                        >
                                            <item.icon size={20} />
                                            <span className="text-xs font-bold">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Asset Display Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. My Website, AWS Production"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary-500 dark:focus:border-primary-500 outline-none transition-all text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Link to Project</label>
                                    <select
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary-500 outline-none transition-all text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">-- No Project --</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 3. DYNAMIC FIELDS */}
                            <div className="pt-6 border-t border-gray-100 dark:border-white/5 space-y-6">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Configuration Details
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                        {type}
                                    </span>
                                </h3>

                                {type === 'DOMAIN' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                        <Field label="Domain Name" value={metadata.domain} onChange={v => handleMetadataChange('domain', v)} placeholder="example.com" />
                                        <Field label="Registrar" value={metadata.registrar} onChange={v => handleMetadataChange('registrar', v)} placeholder="GoDaddy, AWS Route53" />
                                        <Field label="Expiry Date" type="date" value={metadata.expiry} onChange={v => handleMetadataChange('expiry', v)} />
                                        <SelectField label="Auto Renewal" value={metadata.autoRenew} onChange={v => handleMetadataChange('autoRenew', v)} options={['Yes', 'No']} />
                                        <Field label="DNS Provider" value={metadata.dnsProvider} onChange={v => handleMetadataChange('dnsProvider', v)} placeholder="Cloudflare, AWS" />
                                    </div>
                                )}

                                {type === 'SERVER' && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <SelectField
                                                label="Server Type"
                                                value={serverType}
                                                onChange={v => setServerType(v)}
                                                options={['Cloud Server', 'VPS Server', 'Dedicated Server', 'Shared Linux Server']}
                                            />
                                            <Field label="Provider Name" value={metadata.provider} onChange={v => handleMetadataChange('provider', v)} placeholder="DigitalOcean, AWS, GCP" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <Field label="IP Address" value={metadata.ip} onChange={v => handleMetadataChange('ip', v)} placeholder="1.2.3.4" />
                                            <Field label="Hosting Panel" value={metadata.panel} onChange={v => handleMetadataChange('panel', v)} placeholder="cPanel, CyberPanel" />
                                            <Field label="Renewal Date" type="date" value={metadata.renewal} onChange={v => handleMetadataChange('renewal', v)} />
                                        </div>
                                        <SelectField label="Root Access" value={metadata.rootAccess} onChange={v => handleMetadataChange('rootAccess', v)} options={['Yes', 'No']} />
                                    </div>
                                )}

                                {type === 'EMAIL' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                        <Field label="Email Address" type="email" value={metadata.email} onChange={v => handleMetadataChange('email', v)} placeholder="admin@domain.com" />
                                        <Field label="Password" type="text" value={metadata.password} onChange={v => handleMetadataChange('password', v)} placeholder="••••••••" />
                                        <Field label="Provider" value={metadata.provider} onChange={v => handleMetadataChange('provider', v)} placeholder="Google, Zoho, Outlook" />
                                        <Field label="Recovery Email" type="email" value={metadata.recovery} onChange={v => handleMetadataChange('recovery', v)} />
                                        <Field label="Linked Domain" value={metadata.linkedDomain} onChange={v => handleMetadataChange('linkedDomain', v)} placeholder="domain.com" className="md:col-span-2" />
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Notes</label>
                                    <textarea
                                        value={metadata.notes || ''}
                                        onChange={(e) => handleMetadataChange('notes', e.target.value)}
                                        placeholder="Add any additional details, access URLs, or instructions..."
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary-500 outline-none transition-all text-sm min-h-[100px] resize-none"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <footer className="flex-shrink-0 p-6 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                        <button type="button" onClick={() => navigate('/infra')} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="add-infra-form"
                            disabled={loading}
                            className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Save Infrastructure'}
                        </button>
                    </footer>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
};

const Field = ({ label, value = '', onChange, type = 'text', placeholder, className = '' }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary-500 outline-none transition-all text-sm"
        />
    </div>
);

const SelectField = ({ label, value, onChange, options }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary-500 outline-none transition-all text-sm appearance-none cursor-pointer"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
    </div>
);

export default AddInfra;
