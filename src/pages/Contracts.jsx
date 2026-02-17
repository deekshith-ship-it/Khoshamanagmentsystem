import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/common';
import {
    FileSignature,
    FileText,
    Plus,
    X,
    Edit2,
    Trash2,
    Calendar,
    Search,
    FileCheck2,
    Loader2
} from 'lucide-react';
import { agreementsAPI } from '../services/api';

const Contracts = () => {
    const [agreements, setAgreements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAgreement, setEditingAgreement] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [formData, setFormData] = useState({
        title: '',
        client_name: '',
        type: 'service',
        status: 'draft',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        value: '',
        description: '',
    });

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    const fetchAgreements = useCallback(async () => {
        try {
            setLoading(true);
            let data;
            if (agreementsAPI && agreementsAPI.getAll) {
                data = await agreementsAPI.getAll();
            } else {
                const response = await fetch(`${API_BASE}/agreements`);
                data = response.ok ? await response.json() : [];
            }
            setAgreements(data);
        } catch (error) {
            console.error('Error fetching agreements:', error);
        } finally {
            setLoading(false);
        }
    }, [API_BASE]);

    useEffect(() => {
        fetchAgreements();
    }, [fetchAgreements]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingAgreement) {
                if (agreementsAPI && agreementsAPI.update) {
                    await agreementsAPI.update(editingAgreement.id, formData);
                } else {
                    await fetch(`${API_BASE}/agreements/${editingAgreement.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData),
                    });
                }
            } else {
                if (agreementsAPI && agreementsAPI.create) {
                    await agreementsAPI.create(formData);
                } else {
                    await fetch(`${API_BASE}/agreements`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData),
                    });
                }
            }
            setShowModal(false);
            resetForm();
            fetchAgreements();
        } catch (error) {
            console.error('Error saving agreement:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (agreement) => {
        setEditingAgreement(agreement);
        setFormData({
            title: agreement.title || '',
            client_name: agreement.client_name || '',
            type: agreement.type || 'service',
            status: agreement.status || 'draft',
            start_date: agreement.start_date || new Date().toISOString().split('T')[0],
            end_date: agreement.end_date || '',
            value: agreement.value || '',
            description: agreement.description || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this agreement?')) return;
        try {
            if (agreementsAPI && agreementsAPI.delete) {
                await agreementsAPI.delete(id);
            } else {
                await fetch(`${API_BASE}/agreements/${id}`, { method: 'DELETE' });
            }
            fetchAgreements();
        } catch (error) {
            console.error('Error deleting agreement:', error);
        }
    };

    const resetForm = () => {
        setEditingAgreement(null);
        setFormData({
            title: '',
            client_name: '',
            type: 'service',
            status: 'draft',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            value: '',
            description: '',
        });
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const formatCurrency = (value) => {
        if (!value) return '—';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'badge-success';
            case 'draft': return 'badge-draft';
            case 'expired': return 'badge-danger';
            case 'pending': return 'badge-warning';
            default: return 'badge-neutral';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'nda': return FileSignature;
            case 'service': return FileCheck2;
            default: return FileText;
        }
    };

    const filters = [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'expired', label: 'Expired' },
    ];

    const filteredAgreements = agreements.filter((a) => {
        const matchesFilter = activeFilter === 'all' || a.status === activeFilter;
        const matchesSearch =
            a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <MainLayout
            title="Contracts & Agreements"
            headerAction={
                <div className="flex items-center gap-3">
                    <div className="relative w-48">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="input pl-10"
                        />
                    </div>
                    <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
                        <Plus size={18} />
                        New Agreement
                    </button>
                </div>
            }
        >
            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto custom-scrollbar">
                {filters.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setActiveFilter(f.value)}
                        className={`filter-pill ${activeFilter === f.value ? 'active' : ''}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="card flex flex-col items-center justify-center py-32 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading contracts...</p>
                </div>
            ) : (
                <div className="space-y-4 stagger-children">
                    {filteredAgreements.map((agreement) => {
                        const TypeIcon = getTypeIcon(agreement.type);
                        return (
                            <Card key={agreement.id} className="group card-hover hover:border-primary-200 dark:hover:border-primary-900/50 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-5 min-w-0 flex-1">
                                    <div className="icon-circle-primary shrink-0">
                                        <TypeIcon size={22} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{agreement.title}</h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{agreement.client_name}</span>
                                            <span className="text-gray-200 dark:text-gray-700">•</span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                <Calendar size={11} /> {formatDate(agreement.start_date)}
                                            </span>
                                            {agreement.value && (
                                                <>
                                                    <span className="text-gray-200 dark:text-gray-700">•</span>
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{formatCurrency(agreement.value)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`badge ${getStatusColor(agreement.status)}`}>
                                        {agreement.status}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => handleEdit(agreement)}
                                            className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(agreement.id)}
                                            className="p-2 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}

                    {filteredAgreements.length === 0 && (
                        <div className="text-center py-24 bg-gray-50/50 dark:bg-dark-surface rounded-2xl border border-dashed border-gray-200 dark:border-dark-border">
                            <FileSignature size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No contracts found</p>
                            <button onClick={openAddModal} className="btn btn-primary mt-6">
                                Create First Agreement
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-enter relative">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingAgreement ? 'Edit Agreement' : 'New Agreement'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="input"
                                    placeholder="Agreement title"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Client Name</label>
                                    <input
                                        type="text"
                                        value={formData.client_name}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                        className="input"
                                        placeholder="Client"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="input appearance-none cursor-pointer"
                                    >
                                        <option value="service">Service Agreement</option>
                                        <option value="nda">NDA</option>
                                        <option value="employment">Employment</option>
                                        <option value="partnership">Partnership</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Value (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="input"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="input appearance-none cursor-pointer"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input min-h-[100px] resize-none"
                                    placeholder="Brief description..."
                                />
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 btn btn-secondary text-xs uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 btn btn-primary text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    {editingAgreement ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default Contracts;
