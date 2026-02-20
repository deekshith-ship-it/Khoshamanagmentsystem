import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, Avatar, SearchInput, FloatingAddButton, Modal } from '../components/common';
import { X, Briefcase, Phone, Calendar, Clock, MoreHorizontal } from 'lucide-react';
import { leadsAPI } from '../services/api';
import LeadManagementForm from '../components/leads/LeadManagementForm';

const PIPELINE_STAGES = [
    { key: 'new', label: 'New', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'qualified', label: 'Qualified', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { key: 'proposal_sent', label: 'Proposal Sent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { key: 'follow_up', label: 'Follow Up', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { key: 'closed_won', label: 'Closed Won', color: 'bg-green-50 text-green-700 border-green-200' },
    { key: 'closed_lost', label: 'Closed Lost', color: 'bg-red-50 text-red-700 border-red-200' }
];

const Leads = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchLeads();
    }, [debouncedSearch]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            setError(null);
            // Pass search query if exists
            const params = debouncedSearch ? { q: debouncedSearch } : {};
            const data = await leadsAPI.getAll(params);
            setLeads(data || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
            setError(`Failed to fetch leads: ${error.message}. Please check your connection.`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (data) => {
        try {
            await leadsAPI.create(data);
            setShowModal(false);
            fetchLeads();
        } catch (error) {
            console.error('Error creating lead:', error);
            alert('Failed to create lead');
        }
    };

    const getLeadsByStage = (stageKey) => {
        return leads.filter(lead => lead.status === stageKey);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <MainLayout
            title="Leads"
            headerAction={
                <div className="flex items-center gap-3">
                    <SearchInput
                        placeholder="Search name, phone, email..."
                        value={search}
                        onChange={setSearch}
                        className="w-64"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Clear Search"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            }
        >
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={fetchLeads} className="font-bold uppercase tracking-wider underline">Retry</button>
                </div>
            )}

            {/* KANBAN BOARD */}
            <div className="flex overflow-x-auto gap-4 pb-8 min-h-[calc(100vh-200px)]">
                {PIPELINE_STAGES.map(stage => {
                    const stageLeads = getLeadsByStage(stage.key);
                    const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0); // Assuming lead has value or linked proposal value

                    return (
                        <div key={stage.key} className="min-w-[320px] w-[320px] flex-shrink-0 flex flex-col">
                            {/* COLUMN HEADER */}
                            <div className={`p-3 rounded-t-xl border-b-2 flex justify-between items-center ${stage.color} bg-opacity-50`}>
                                <div>
                                    <h3 className="font-bold text-xs uppercase tracking-wider">{stage.label}</h3>
                                    <p className="text-[10px] opacity-80 mt-0.5">{formatCurrency(totalValue)} • {stageLeads.length} Leads</p>
                                </div>
                                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">{stageLeads.length}</span>
                            </div>

                            {/* COLUMN BODY */}
                            <div className="bg-gray-50/50 dark:bg-gray-800/20 flex-1 rounded-b-xl p-2 space-y-3 overflow-y-auto">
                                {loading ? (
                                    <div className="text-center py-4 text-gray-400 text-xs">Loading...</div>
                                ) : (
                                    stageLeads.map(lead => (
                                        <div
                                            key={lead.id}
                                            onClick={() => navigate(`/leads/${lead.id}`)}
                                            className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all cursor-pointer group animate-enter"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={lead.name} size="sm" />
                                                    <div>
                                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{lead.name}</h4>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{lead.company}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-3">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Phone size={12} className="text-gray-400" />
                                                    <span>{lead.phone || 'No Phone'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Briefcase size={12} className="text-gray-400" />
                                                    <span>{lead.project_id ? 'Linked Project' : 'Potential Project'}</span>
                                                </div>
                                                {lead.updated_at && (
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                        <Clock size={10} />
                                                        <span>Updated {new Date(lead.updated_at).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-900 dark:text-gray-300">
                                                    -- {/* Lead Value or Proposal Value could go here */}
                                                </span>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="text-gray-400 hover:text-primary-500"><MoreHorizontal size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {!loading && stageLeads.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-2 min-h-[100px]">
                                        <div className="w-16 h-1 rounded-full bg-gray-200"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <FloatingAddButton onClick={() => setShowModal(true)} />

            {/* Add Lead Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Lead Management"
                maxWidth="max-w-4xl"
            >
                <LeadManagementForm
                    onSubmit={handleCreate}
                    onCancel={() => setShowModal(false)}
                />
            </Modal>
        </MainLayout>
    );
};

export default Leads;
