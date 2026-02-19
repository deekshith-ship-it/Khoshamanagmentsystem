import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, StatusBadge } from '../components/common';
import {
    ArrowLeft, FileText, User, CheckCircle, XCircle, Clock,
    DollarSign, Briefcase, ChevronRight, Download, Send, AlertTriangle, Phone, Edit2
} from 'lucide-react';
import { proposalsAPI, leadsAPI, projectsAPI, leadActivitiesAPI } from '../services/api';
import ProposalModal from '../components/proposals/ProposalModal';

const PROPOSAL_STAGES = [
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'negotiation', label: 'Negotiation' },
    { key: 'follow_up', label: 'Follow Up' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'rejected', label: 'Rejected' },
];

const LOST_REASONS = [
    'Price Too High', 'No Budget', 'Competitor Won', 'No Response', 'Not Interested', 'Timeline Mismatch'
];

const ProposalDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [proposal, setProposal] = useState(null);
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLostModal, setShowLostModal] = useState(false);
    const [lostReason, setLostReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const proposalData = await proposalsAPI.getById(id);
            setProposal(proposalData);

            if (proposalData.lead_id) {
                const leadData = await leadsAPI.getById(proposalData.lead_id);
                setLead(leadData);
            }
        } catch (error) {
            console.error('Error fetching proposal details:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [id, fetchData]);

    const handleStatusChange = async (newStatus) => {
        if (!proposal) return;

        // Custom Logic for End States
        if (newStatus === 'accepted') {
            setShowConvertModal(true);
            return;
        }

        if (newStatus === 'rejected') {
            setShowLostModal(true);
            return;
        }

        // Standard Update
        await updateProposalStatus(newStatus);
    };

    const updateProposalStatus = async (status, extraLeadData = {}) => {
        try {
            setIsProcessing(true);

            // 1. Update Proposal
            await proposalsAPI.update(id, {
                ...proposal,
                status,
                lead_id: proposal.lead_id // Ensure lead_id is passed for sync
            });

            // 2. Extra Lead Updates (like loss reason)
            if (Object.keys(extraLeadData).length > 0 && proposal.lead_id) {
                await leadsAPI.update(proposal.lead_id, { status: 'closed_lost', ...extraLeadData });
            }

            // 3. Log Activity
            if (proposal.lead_id) {
                await leadActivitiesAPI.create({
                    lead_id: proposal.lead_id,
                    type: 'status_change',
                    title: `Proposal ${status.replace('_', ' ')}`,
                    description: `Proposal "${proposal.title}" moved to ${status}.`,
                    author: 'System'
                });
            }

            await fetchData();
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update status');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConvertConfirm = async () => {
        try {
            setIsProcessing(true);
            // 1. Create Project
            const projectData = {
                title: `Project: ${proposal.title}`,
                client: proposal.client,
                status: 'in-progress',
                proposal_id: proposal.id,
                lead_id: proposal.lead_id,
                value: proposal.value
            };
            const newProject = await projectsAPI.create(projectData);

            // 2. Mark Proposal as Accepted
            await updateProposalStatus('accepted');

            // 3. Link Project to Lead (backend sync might handle status, but we ensure linkage)
            if (proposal.lead_id) {
                await leadsAPI.update(proposal.lead_id, {
                    project_id: newProject.id,
                    status: 'closed_won'
                });
            }

            navigate(`/projects/${newProject.id}`);
        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Failed to convert to project');
        } finally {
            setIsProcessing(false);
            setShowConvertModal(false);
        }
    };

    const handleLostConfirm = async (e) => {
        e.preventDefault();
        if (!lostReason) return;

        await updateProposalStatus('rejected', { loss_reason: lostReason });
        setShowLostModal(false);
    };

    const handleCallClient = async () => {
        const phoneNumber = lead?.phone;
        if (!phoneNumber) {
            alert('No phone number available for this client.');
            return;
        }

        // 1. Log Activity
        if (proposal.lead_id) {
            try {
                await leadActivitiesAPI.create({
                    lead_id: proposal.lead_id, // Ensure this matches the API expectation
                    type: 'call',
                    title: 'Call Initiated from Proposal',
                    description: `Call initiated to ${phoneNumber} from Proposal #${proposal.id} page.`,
                    author: 'User' // Or current user if available
                });
            } catch (error) {
                console.error('Failed to log call activity:', error);
            }
        }

        // 2. Trigger Call
        window.location.href = `tel:${phoneNumber}`;
    };

    if (loading) return <MainLayout><div className="p-8 text-center text-gray-500">Loading proposal...</div></MainLayout>;
    if (!proposal) return <MainLayout><div className="p-8 text-center text-gray-500">Proposal not found</div></MainLayout>;

    return (
        <MainLayout title="">
            <div className="mb-6">
                <Link to="/proposals" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4">
                    <ArrowLeft size={18} /> Back to Proposals
                </Link>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{proposal.title}</h1>
                            <StatusBadge status={proposal.status} className="text-sm px-3 py-1" />
                        </div>
                        <p className="text-gray-500 flex items-center gap-2">
                            Ticket #{proposal.id} • Prepared for <span className="font-bold text-gray-700 dark:text-gray-300">{proposal.client}</span>
                            {lead && (
                                <Link to={`/leads/${lead.id}`} className="flex items-center gap-1 text-primary-600 hover:underline ml-2 bg-primary-50 px-2 py-0.5 rounded-full text-xs font-bold">
                                    <User size={12} /> {lead.name}
                                </Link>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <Edit2 size={18} /> <span className="hidden sm:inline">Edit Proposal</span>
                        </button>
                        <button
                            onClick={handleCallClient}
                            className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-500/20"
                            title={lead?.phone ? `Call ${lead.phone}` : 'No phone number'}
                        >
                            <Phone size={18} /> <span className="hidden sm:inline">Call Client</span>
                        </button>
                        <select
                            value={proposal.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-4 py-2.5 font-bold shadow-sm focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                        >
                            {PROPOSAL_STAGES.map(stage => (
                                <option key={stage.key} value={stage.key}>{stage.label}</option>
                            ))}
                        </select>
                        <button className="btn btn-primary shadow-lg shadow-primary-500/20">
                            <Download size={18} className="mr-2" /> Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* VISUAL TIMELINE */}
            <Card padding="none" className="mb-8 overflow-x-auto">
                <div className="flex min-w-max p-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    {PROPOSAL_STAGES.map((stage, index) => {
                        const getCurrentIndex = () => PROPOSAL_STAGES.findIndex(s => s.key === proposal.status);
                        const currentIndex = getCurrentIndex();
                        const isCurrent = index === currentIndex;
                        const isPast = index < currentIndex;

                        return (
                            <div key={stage.key} className={`
                                flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider text-center relative
                                ${isCurrent ? 'text-primary-600 bg-white shadow-sm rounded-lg' : isPast ? 'text-primary-600/60' : 'text-gray-400'}
                            `}>
                                <div className="flex items-center justify-center gap-2">
                                    {isPast && <CheckCircle size={14} />}
                                    {proposal.status === 'rejected' && stage.key === 'rejected' && <XCircle size={14} className="text-red-500" />}
                                    <span className={proposal.status === 'rejected' && stage.key === 'rejected' ? 'text-red-500' : ''}>{stage.label}</span>
                                </div>
                                {isCurrent && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full mb-1"></div>}
                            </div>
                        );
                    })}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: DETAILS */}
                <div className="lg:col-span-2 space-y-6">
                    {/* SUMMARY CARDS */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-primary-50/50 border-primary-100">
                            <p className="text-xs font-bold text-primary-400 uppercase mb-1">Total Value</p>
                            <p className="text-2xl font-bold text-primary-700">₹{proposal.value?.toLocaleString()}</p>
                        </Card>
                        <Card>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Created Date</p>
                            <p className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                <Clock size={16} className="text-gray-400" />
                                {new Date(proposal.created_at).toLocaleDateString()}
                            </p>
                        </Card>
                    </div>

                    <Card title="Scope of Work">
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {proposal.scope || 'No scope defined.'}
                        </p>
                    </Card>

                    {proposal.assumptions && (
                        <Card title="Assumptions">
                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {proposal.assumptions}
                            </p>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Exclusions" className="border-l-4 border-l-red-100">
                            <p className="text-gray-600 whitespace-pre-wrap text-sm">{proposal.exclusions || 'None.'}</p>
                        </Card>
                        <Card title="Terms & Conditions" className="border-l-4 border-l-blue-100">
                            <p className="text-gray-600 whitespace-pre-wrap text-sm">{proposal.terms || 'Standard terms apply.'}</p>
                        </Card>
                    </div>
                </div>

                {/* RIGHT: SIDEBAR */}
                <div className="space-y-6">
                    {lead && (
                        <Card className="border-l-4 border-l-primary-500">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Linked Lead</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary-50 text-primary-600 rounded-lg"><User size={20} /></div>
                                <div>
                                    <p className="font-bold text-gray-900">{lead.name}</p>
                                    <p className="text-xs text-gray-500">{lead.company}</p>
                                </div>
                            </div>
                            <Link to={`/leads/${lead.id}`} className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                View Lead Details <ChevronRight size={12} />
                            </Link>
                        </Card>
                    )}

                    {lead?.project_id && (
                        <Card className="border-l-4 border-l-green-500">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Linked Project</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Briefcase size={20} /></div>
                                <div>
                                    <p className="font-bold text-gray-900">Project #{lead.project_id}</p>
                                    <p className="text-xs text-green-600 font-bold uppercase">Active</p>
                                </div>
                            </div>
                            <Link to={`/projects/${lead.project_id}`} className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                                View Project <ChevronRight size={12} />
                            </Link>
                        </Card>
                    )}

                    {proposal.file_url && (
                        <Card>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Attachment</h3>
                            <a href={proposal.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                                <div className="p-2 bg-red-50 text-red-500 rounded-lg"><FileText size={20} /></div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold text-gray-700 truncate group-hover:text-primary-600 transition-colors">Proposal Document</p>
                                    <p className="text-xs text-gray-400">PDF • Click to open</p>
                                </div>
                                <Download size={16} className="text-gray-300 group-hover:text-primary-500" />
                            </a>
                        </Card>
                    )}
                </div>
            </div>

            {/* SHARED EDIT MODAL */}
            {showEditModal && (
                <ProposalModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    initialData={proposal}
                    onSuccess={() => {
                        fetchData();
                        setShowEditModal(false);
                    }}
                />
            )}

            {/* MODALS */}
            {showConvertModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm text-center animate-enter">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Proposal Accepted!</h2>
                        <p className="text-gray-500 mb-6 text-sm">Do you want to convert this into a live project now?</p>

                        <div className="space-y-3">
                            <button
                                onClick={handleConvertConfirm}
                                disabled={isProcessing}
                                className="btn btn-primary w-full py-2.5 justify-center shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 border-none"
                            >
                                {isProcessing ? 'Converting...' : 'Yes, Create Project'}
                            </button>
                            <button
                                onClick={() => {
                                    updateProposalStatus('accepted'); // Just update status
                                    setShowConvertModal(false);
                                }}
                                className="btn btn-secondary w-full justify-center"
                            >
                                No, later
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {showLostModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm animate-enter">
                        <div className="flex items-center gap-2 mb-4 text-red-600">
                            <AlertTriangle size={20} />
                            <h2 className="text-lg font-bold">Reason for Loss</h2>
                        </div>
                        <form onSubmit={handleLostConfirm}>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Why was it rejected?</label>
                                <select
                                    className="input"
                                    required
                                    value={lostReason}
                                    onChange={e => setLostReason(e.target.value)}
                                >
                                    <option value="">Select Reason...</option>
                                    {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowLostModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={!lostReason} className="btn bg-red-600 text-white hover:bg-red-700 flex-1">Confirm Lost</button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </MainLayout>
    );
};

export default ProposalDetails;
