import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { infraAPI } from '../services/api';
import { X } from 'lucide-react';

const AddInfra = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'domain',
        status: 'active',
        project_name: '',
        domain_name: '',
        registrar: '',
        expire_date: '',
        notes: ''
    });

    // Handle background scroll lock
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await infraAPI.create(formData);
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
            {/* Background Overlay: Fixed, Dimmed, and Blurred */}
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                {/* Backdrop Overlay */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
                    onClick={() => navigate('/infra')}
                ></div>

                {/* Modal Card */}
                <div className="relative z-[1010] w-full max-w-2xl max-h-[85vh] bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border flex flex-col overflow-hidden animate-enter">

                    {/* FIXED HEADER */}
                    <header className="flex-shrink-0 p-8 flex items-center justify-between bg-white dark:bg-dark-surface border-b border-gray-100 dark:border-dark-border z-30">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Add Infrastructure Asset</h2>
                        <button
                            onClick={() => navigate('/infra')}
                            className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all flex items-center justify-center"
                        >
                            <X size={20} />
                        </button>
                    </header>

                    {/* SCROLLABLE BODY */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white dark:bg-dark-bg custom-scrollbar scrollbar-thin">
                        <form id="add-infra-form" onSubmit={handleSubmit} className="space-y-8">
                            {/* General Asset Info */}
                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Asset Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Production DB, Main Website"
                                        className="input"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="input appearance-none cursor-pointer"
                                        >
                                            <option value="domain">Domain</option>
                                            <option value="server">Server</option>
                                            <option value="database">Database</option>
                                            <option value="email">Email</option>
                                            <option value="api">API</option>
                                            <option value="storage">Storage</option>
                                            <option value="ssl">SSL</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="input appearance-none cursor-pointer"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="expired">Expired</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Linked Project (Optional)</label>
                                    <select
                                        value={formData.project_name}
                                        onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                                        className="input appearance-none cursor-pointer"
                                    >
                                        <option value="">-- None --</option>
                                        <option value="Website Redesign">Website Redesign</option>
                                        <option value="CRM System">CRM System</option>
                                        <option value="Mobile App">Mobile App</option>
                                    </select>
                                </div>
                            </div>

                            {/* Conditional Section: Domain Details */}
                            {formData.type === 'domain' && (
                                <div className="pt-8 border-t border-gray-100 dark:border-dark-border space-y-6">
                                    <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Domain Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Domain Name</label>
                                            <input
                                                type="text"
                                                value={formData.domain_name}
                                                onChange={(e) => setFormData({ ...formData, domain_name: e.target.value })}
                                                placeholder="example.com"
                                                className="input"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Registrar</label>
                                            <input
                                                type="text"
                                                value={formData.registrar}
                                                onChange={(e) => setFormData({ ...formData, registrar: e.target.value })}
                                                placeholder="GoDaddy / Namecheap"
                                                className="input"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                        <input
                                            type="date"
                                            value={formData.expire_date}
                                            onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Additional Notes Area */}
                            <div className="flex flex-col gap-2 pt-4">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Add any additional details or login info..."
                                    className="input min-h-[140px] resize-none"
                                />
                            </div>
                        </form>
                    </div>

                    {/* FIXED FOOTER */}
                    <footer className="flex-shrink-0 p-6 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface z-30">
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/infra')}
                                className="btn btn-secondary text-xs uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="add-infra-form"
                                disabled={loading}
                                className="btn btn-primary px-10 text-xs uppercase tracking-wider"
                            >
                                {loading ? 'Saving...' : 'Add Asset'}
                            </button>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default AddInfra;
