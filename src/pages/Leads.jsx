import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, Avatar, StatusBadge, SearchInput, FloatingAddButton } from '../components/common';
import { ChevronRight, X } from 'lucide-react';
import { leadsAPI } from '../services/api';

const leadFilters = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'converted', label: 'Converted' },
    { value: 'completed', label: 'Completed' },
];

const Leads = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: '', company: '', status: 'new' });

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await leadsAPI.getAll();
            setLeads(data);
        } catch (error) {
            console.error('Error fetching leads:', error);
            setError('Failed to fetch leads. Please check if the server is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await leadsAPI.create(formData);
            setShowModal(false);
            setFormData({ name: '', email: '', phone: '', role: '', company: '', status: 'new' });
            fetchLeads();
        } catch (error) {
            console.error('Error creating lead:', error);
            alert('Failed to create lead');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                await leadsAPI.delete(id);
                fetchLeads();
            } catch (error) {
                console.error('Error deleting lead:', error);
            }
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesFilter = filter === 'all' || lead.status === filter;
        const matchesSearch = lead.name?.toLowerCase().includes(search.toLowerCase()) ||
            lead.company?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <MainLayout
            title="Leads"
            headerAction={
                <div className="flex items-center gap-3">
                    <SearchInput
                        placeholder="Search leads..."
                        value={search}
                        onChange={setSearch}
                        className="w-48"
                    />
                    <button
                        onClick={() => setSearch('')}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Clear Search"
                    >
                        <X size={20} />
                    </button>
                </div>
            }
        >
            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 border border-red-100 dark:border-red-900/20 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={fetchLeads} className="text-xs font-bold uppercase tracking-wider underline">Retry</button>
                </div>
            )}

            {/* Filter Pills */}
            <div className="mb-8 mt-2 overflow-x-auto custom-scrollbar">
                <nav className="flex items-center gap-2 min-w-max px-1">
                    {leadFilters.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilter(tab.value)}
                            className={`filter-pill ${filter === tab.value ? 'active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <Card padding="none" className="overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading leads...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredLeads.map((lead) => (
                            <div
                                key={lead.id}
                                onClick={() => navigate(`/leads/${lead.id}`)}
                                className="flex items-center justify-between p-4 table-row-hover cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar name={lead.name} size="md" />
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{lead.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {lead.role} <span className="text-gray-300 dark:text-gray-600">•</span> {lead.company}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <StatusBadge status={lead.status} />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 transition-all rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20"
                                    >
                                        <X size={16} />
                                    </button>
                                    <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors" />
                                </div>
                            </div>
                        ))}

                        {filteredLeads.length === 0 && !loading && (
                            <div className="p-12 text-center">
                                <p className="text-gray-500 dark:text-gray-400">No leads found</p>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            <FloatingAddButton onClick={() => setShowModal(true)} />

            {/* Add Lead Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border w-full max-w-md p-6 relative animate-enter">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Lead</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input"
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input"
                                        placeholder="Enter email address"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Role</label>
                                        <input
                                            type="text"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="input"
                                            placeholder="e.g., CEO"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Company</label>
                                        <input
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            className="input"
                                            placeholder="Company"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Status</label>
                                    <div className="relative">
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="input appearance-none cursor-pointer"
                                        >
                                            <option value="new">New</option>
                                            <option value="negotiation">Negotiation</option>
                                            <option value="follow-up">Follow-up</option>
                                            <option value="converted">Converted</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <ChevronRight size={14} className="rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 btn btn-secondary text-xs uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn btn-primary text-xs uppercase tracking-wider">
                                    Add Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default Leads;
