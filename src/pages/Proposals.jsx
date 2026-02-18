import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { Card, SearchInput, FloatingAddButton } from '../components/common';
import { Eye, Clock, X, Plus } from 'lucide-react';
import { proposalsAPI } from '../services/api';

const Proposals = () => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', client: '', value: '' });

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        try {
            setLoading(true);
            const data = await proposalsAPI.getAll();
            setProposals(data);
        } catch (error) {
            console.error('Error fetching proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await proposalsAPI.create(formData);
            setShowModal(false);
            setFormData({ title: '', client: '', value: '' });
            fetchProposals();
        } catch (error) {
            console.error('Error creating proposal:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this proposal?')) {
            try {
                await proposalsAPI.delete(id);
                fetchProposals();
            } catch (error) {
                console.error('Error deleting proposal:', error);
            }
        }
    };

    const stats = {
        totalSent: proposals.length,
        viewed: proposals.filter(p => p.views > 0).length,
        accepted: proposals.filter(p => p.status === 'accepted').length,
    };

    const filteredProposals = proposals.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.client?.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Just now';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60));
        if (diff < 1) return 'Just now';
        if (diff < 24) return `${diff}h ago`;
        return `${Math.floor(diff / 24)}d ago`;
    };

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <MainLayout
            title="Proposal Tracking"
            headerAction={
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary py-2.5 px-5 rounded-xl flex items-center gap-2"
                    aria-label="Add new proposal"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    <span className="hidden sm:inline text-sm font-semibold">New Proposal</span>
                </button>
            }
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 stagger-children">
                <Card hover={false} className="text-center py-6">
                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Total Sent</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight stats-value">{stats.totalSent}</p>
                </Card>
                <Card hover={false} className="text-center py-6">
                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Viewed</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight stats-value">{stats.viewed}</p>
                </Card>
                <Card hover={false} className="text-center py-6">
                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Accepted</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight stats-value">{stats.accepted}</p>
                </Card>
            </div>

            <SearchInput
                placeholder="Search client or project.."
                value={search}
                onChange={setSearch}
                className="mb-6 max-w-xs"
            />

            <Card padding="none" hover={false} className="overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-gray-500 dark:text-gray-400">
                        <div className="w-10 h-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-medium">Loading proposals...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredProposals.map((proposal) => (
                            <div key={proposal.id} className="p-5 lg:p-6 table-row-hover group">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white tracking-tight text-[15px]">{proposal.title}</h3>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">{proposal.client}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${Number(proposal.value) === 0
                                            ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                            }`}>
                                            {formatCurrency(proposal.value)}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(proposal.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5">
                                            <Eye size={13} />
                                            {proposal.views || 0} views
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={13} />
                                            {formatDate(proposal.created_at)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setFormData({
                                                id: proposal.id,
                                                title: proposal.title,
                                                client: proposal.client,
                                                value: proposal.value
                                            });
                                            setShowModal(true);
                                        }}
                                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-semibold uppercase tracking-wider transition-all duration-200"
                                    >
                                        Edit Details
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredProposals.length === 0 && !loading && (
                            <div className="p-16 text-center">
                                <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">No proposals found</p>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            <FloatingAddButton onClick={() => setShowModal(true)} />

            {/* Add Proposal Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border w-full max-w-md p-6 relative animate-enter"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Proposal</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="input"
                                        placeholder="Proposal title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Client</label>
                                    <input
                                        type="text"
                                        value={formData.client}
                                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                        className="input"
                                        placeholder="Client name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Value (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium text-sm">₹</span>
                                        <input
                                            type="number"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                            className="input pl-8"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 btn btn-secondary text-sm"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn btn-primary text-sm">
                                    {formData.id ? 'Update' : 'Create'} Proposal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default Proposals;
