import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, Avatar, StatusBadge } from '../components/common';
import {
    ArrowLeft, Phone, Mail, MessageCircle, Clock, Send, Link2, X,
    ArrowRight, CheckCircle, XCircle, FileText, Upload, Calendar, User, Edit2, ChevronDown, Save, Briefcase, Globe
} from 'lucide-react';
import { leadsAPI, leadActivitiesAPI, proposalsAPI, projectsAPI } from '../services/api';
import LeadManagementForm from '../components/leads/LeadManagementForm';


const PIPELINE_STAGES = [
    { key: 'new', label: 'New', percent: 0 },
    { key: 'qualified', label: 'Qualified', percent: 20 },
    { key: 'proposal_sent', label: 'Proposal Sent', percent: 40 },
    { key: 'negotiation', label: 'Negotiation', percent: 60 },
    { key: 'follow_up', label: 'Follow Up', percent: 80 },
    { key: 'closed_won', label: 'Closed Won', percent: 100 },
    { key: 'closed_lost', label: 'Closed Lost', percent: 0 }
];

const LOST_REASONS = [
    'Price Too High',
    'No Budget',
    'Competitor Won',
    'No Response',
    'Not Interested',
    'Timeline Mismatch'
];

const LeadDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [activities, setActivities] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Activity State
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityType, setActivityType] = useState('note'); // note, call, meeting
    const [activityContent, setActivityContent] = useState('');

    // Status Modals State
    // Proposal Modal State
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [proposalForm, setProposalForm] = useState({
        title: '', value: '', scope: '', assumptions: '', exclusions: '', terms: '', note: ''
    });
    const [proposalFile, setProposalFile] = useState(null);

    const [showLostModal, setShowLostModal] = useState(false);
    const [lostReason, setLostReason] = useState('');
    const [otherReason, setOtherReason] = useState('');

    const [showConvertModal, setShowConvertModal] = useState(false);
    const [conversionDocs, setConversionDocs] = useState({
        scope: null, agreement: null, contract: null, pricing: null
    });

    // Edit Lead State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '', email: '', phone: '', role: '', company: ''
    });

    const fetchLeadData = useCallback(async () => {
        try {
            setLoading(true);
            const [leadData, activitiesData, proposalsData] = await Promise.all([
                leadsAPI.getById(id),
                leadActivitiesAPI.getByLeadId(id),
                proposalsAPI.getByLeadId(id)
            ]);
            setLead(leadData);
            setActivities(activitiesData || []);
            setProposals(proposalsData || []);
            setEditForm({
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone,
                role: leadData.role,
                company: leadData.company
            });
        } catch (error) {
            console.error('Error fetching lead data:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLeadData();
    }, [id, fetchLeadData]);

    const handleUpload = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fileName: file.name,
                            content: reader.result,
                            type: file.type
                        })
                    });
                    const data = await response.json();
                    if (data.url) resolve(data.url);
                    else reject('Upload failed');
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = error => reject(error);
        });
    };

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingStage, setPendingStage] = useState(null);

    const updateStatus = async (status, extraData = {}) => {
        try {
            // Calculate Progress
            const stage = PIPELINE_STAGES.find(s => s.key === status);
            const progress = stage ? stage.percent : lead.progress_percentage;

            await leadsAPI.update(id, {
                ...lead,
                status,
                progress_percentage: progress,
                ...extraData
            });

            // Log automated activity
            await leadActivitiesAPI.create({
                lead_id: id,
                type: 'status_change',
                title: `Moved to ${stage?.label || status}`,
                description: `Lead status updated to ${stage?.label || status}. Progress: ${progress}%`,
                created_by: 'System'
            });

            fetchLeadData();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleStageClick = (stageKey) => {
        if (!lead || lead.status === stageKey) return;

        const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.key === lead.status);
        const targetStageIndex = PIPELINE_STAGES.findIndex(s => s.key === stageKey);

        // Rule 1: Allow backward movement
        if (targetStageIndex < currentStageIndex) {
            if (window.confirm(`Move lead back to ${PIPELINE_STAGES[targetStageIndex].label}?`)) {
                updateStatus(stageKey);
            }
            return;
        }

        // Rule 2: Prevent skipping stages (Strict Sequential)
        if (targetStageIndex > currentStageIndex + 1) {
            alert(`You cannot skip stages. Please complete ${PIPELINE_STAGES[currentStageIndex + 1].label} first.`);
            return;
        }

        // Rule 3: Specific Stage Validations
        if (stageKey === 'proposal_sent') {
            setProposalForm(prev => ({ ...prev, title: `Proposal for ${lead.company}`, value: '0' }));
            setShowProposalModal(true);
            return;
        }

        if (stageKey === 'negotiation') {
            if (!proposals.length) {
                alert('A proposal must be created and attached before starting negotiation.');
                return;
            }
        }

        if (stageKey === 'follow_up') {
            const activeProposal = proposals[0];
            if (!activeProposal || (activeProposal.status !== 'negotiation' && activeProposal.status !== 'sent')) {
                alert('Proposal must be in Negotiation or Sent stage to follow up.');
                return;
            }
        }

        if (stageKey === 'closed_won') {
            const acceptedProposal = proposals.find(p => p.status === 'accepted');
            if (!acceptedProposal) {
                alert('You cannot close this deal until a proposal is formally accepted.');
                return;
            }
            setShowConvertModal(true);
            return;
        }

        if (stageKey === 'closed_lost') {
            setShowLostModal(true);
            return;
        }

        // Show Confirmation for standard forward moves
        setPendingStage(stageKey);
        setShowConfirmModal(true);
    };

    const confirmStageChange = () => {
        if (pendingStage) {
            updateStatus(pendingStage);
            setShowConfirmModal(false);
            setPendingStage(null);
        }
    };

    const handleSubmitProposal = async (e) => {
        e.preventDefault();

        try {
            setIsUploading(true);
            let fileUrl = '';
            if (proposalFile) {
                fileUrl = await handleUpload(proposalFile);
            }

            // Create Proposal Record
            // Backend will auto-update Lead status to 'proposal_sent'
            await proposalsAPI.create({
                title: proposalForm.title,
                client: lead.company,
                lead_id: id,
                value: parseFloat(proposalForm.value) || 0,
                scope: proposalForm.scope,
                exclusions: proposalForm.exclusions,
                terms: proposalForm.terms,
                file_url: fileUrl,
                notes: proposalForm.note,
                status: 'sent'
            });

            setShowProposalModal(false);
            setProposalFile(null);
            setProposalForm({ title: '', value: '', scope: '', assumptions: '', exclusions: '', terms: '', note: '' });

            // Refresh logic handled by backend sync, but we fetch to see changes
            setTimeout(fetchLeadData, 500); // Small delay to ensure DB triggers
        } catch (error) {
            console.error('Proposal submission failed:', error);
            alert('Failed to submit proposal');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmitLost = async (e) => {
        e.preventDefault();
        if (!lostReason) return;

        await updateStatus('closed_lost', { loss_reason: lostReason });
        setShowLostModal(false);
        setLostReason('');
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        if (!activityContent.trim()) return;

        let metadata = {};
        let title = 'Note Added';
        let description = activityContent;

        if (activityType === 'call') {
            title = 'Logged a Call';
            const outcome = document.getElementById('call-outcome')?.value;
            const duration = document.getElementById('call-duration')?.value;
            const followup = document.getElementById('call-followup')?.value;
            metadata = { outcome, duration, followup };
            description = `Called: ${activityContent}\nOutcome: ${outcome || 'N/A'} | Duration: ${duration || 'N/A'}`;
        } else if (activityType === 'meeting') {
            title = 'Logged a Meeting';
            const date = document.getElementById('meeting-date')?.value;
            metadata = { date };
            description = `Meeting: ${activityContent}\nDate: ${date ? new Date(date).toLocaleString() : 'N/A'}`;
        }

        try {
            await leadActivitiesAPI.create({
                lead_id: id,
                type: activityType,
                title,
                description,
                metadata: JSON.stringify(metadata),
                created_by: 'Me'
            });
            setActivityContent('');
            fetchLeadData();
        } catch (error) {
            console.error('Error adding activity:', error);
        }
    };

    const handleConvertToProject = async () => {
        // Strict Validation
        const acceptedProposal = proposals.find(p => p.status === 'accepted');
        if (!acceptedProposal) {
            alert('Validation Failed: An accepted proposal is required to convert.');
            return;
        }

        // Validate docs
        const requiredDocs = ['scope', 'agreement', 'contract', 'pricing'];
        const missing = requiredDocs.filter(d => !conversionDocs[d]);

        if (missing.length > 0) {
            alert(`Missing required documents: ${missing.join(', ')}`);
            return;
        }

        try {
            setIsUploading(true);

            // Upload all
            const uploadedUrls = {};
            for (const docType of requiredDocs) {
                if (conversionDocs[docType]) {
                    uploadedUrls[`${docType}_url`] = await handleUpload(conversionDocs[docType]);
                }
            }

            const projectData = {
                title: `${lead.name} - Project`,
                client: lead.company,
                status: 'in-progress',
                assignee: 'Unassigned',
                proposal_id: acceptedProposal.id,
                lead_id: lead.id,
                value: acceptedProposal.value,
                ...uploadedUrls
            };

            const newProject = await projectsAPI.create(projectData);

            await leadActivitiesAPI.create({
                lead_id: id,
                type: 'conversion',
                title: 'Converted to Project',
                description: `Lead successfully converted to project: ${projectData.title}`,
                created_by: 'System'
            });

            // Update lead status and link project
            await leadsAPI.update(id, {
                ...lead,
                status: 'closed_won',
                progress_percentage: 100,
                project_id: newProject.id
            });

            navigate(`/projects/${newProject.id}`);
        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Failed to convert project');
        } finally {
            setIsUploading(false);
            setShowConvertModal(false);
        }
    };

    const handleUpdateLead = async (e) => {
        e.preventDefault();
        try {
            await leadsAPI.update(id, { ...lead, ...editForm });
            setLead({ ...lead, ...editForm });
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating lead:', error);
            alert('Failed to update lead');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Just now';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return (
        <MainLayout><div className="flex justify-center h-64 items-center"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div></div></MainLayout>
    );

    if (!lead) return <MainLayout><div className="p-8 text-center text-gray-500">Lead not found</div></MainLayout>;

    return (
        <MainLayout title="">
            <button onClick={() => navigate('/leads')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                <ArrowLeft size={18} /> Back to Leads
            </button>

            {/* HEADER & PIPELINE */}
            <div className="mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{lead.name}</h1>
                        <p className="text-gray-500">{lead.role} at <span className="font-semibold text-gray-700 dark:text-gray-300">{lead.company}</span></p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="btn btn-secondary"
                        >
                            <Edit2 size={16} className="mr-2" /> Edit Lead
                        </button>
                        {lead.status !== 'closed-lost' && (
                            <button
                                onClick={() => setShowConvertModal(true)}
                                className="btn btn-primary shadow-lg shadow-primary-500/20"
                            >
                                Convert to Project <ArrowRight size={16} className="ml-2" />
                            </button>
                        )}
                    </div>
                </div>

                {/* VISUAL PIPELINE PROGRESS BAR */}
                <Card padding="none" className="relative z-0 overflow-hidden mb-8">
                    {/* Progress Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-gray-700 -z-10 mt-[-10px] hidden md:block"></div>
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-primary-500 -z-10 mt-[-10px] transition-all duration-1000 ease-out hidden md:block"
                        style={{ width: `${lead.progress_percentage || PIPELINE_STAGES.find(s => s.key === lead.status)?.percent || 0}%` }}
                    ></div>

                    <div className="flex justify-between items-start px-4 py-8 overflow-x-auto scrollbar-hide">
                        {PIPELINE_STAGES.map((stage, index) => {
                            const currentStage = PIPELINE_STAGES.find(s => s.key === lead.status);
                            const currentPercent = currentStage?.percent || 0;
                            const isCompleted = stage.percent <= currentPercent && stage.key !== 'closed_lost';
                            const isCurrent = lead.status === stage.key;
                            const isLost = lead.status === 'closed_lost' && stage.key === 'closed_lost';

                            return (
                                <div key={stage.key} className="flex flex-col items-center min-w-[100px] relative group">
                                    <button
                                        onClick={() => handleStageClick(stage.key)}
                                        className={`
                                            w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10
                                            ${isCurrent
                                                ? 'bg-white border-primary-500 text-primary-600 scale-125 shadow-lg shadow-primary-500/30'
                                                : isLost
                                                    ? 'bg-red-500 border-red-200 text-white'
                                                    : isCompleted
                                                        ? 'bg-primary-500 border-primary-200 text-white'
                                                        : 'bg-gray-50 border-gray-200 text-gray-300 dark:bg-dark-surface dark:border-gray-700'
                                            }
                                        `}
                                    >
                                        {isLost ? <XCircle size={18} /> :
                                            isCompleted && !isCurrent ? <CheckCircle size={18} /> :
                                                <span className="text-[10px] font-bold">{index + 1}</span>}
                                    </button>

                                    <div className={`mt-3 text-center transition-colors duration-300 ${isCurrent ? 'opacity-100 transform translate-y-0' : 'opacity-70'}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-primary-600' : isLost ? 'text-red-500' : 'text-gray-500'}`}>
                                            {stage.label}
                                        </p>
                                        {isCurrent && (
                                            <span className="text-[10px] font-medium text-gray-400">{stage.percent}%</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* SALES PROGRESS SECTION */}
                <div className="mt-8 mb-8 animate-enter">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Briefcase size={16} /> Sales Pipeline Progress
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* 1. CURRENT STAGE CARD */}
                        <Card className="flex flex-col justify-between h-full bg-gradient-to-br from-white to-gray-50 dark:from-dark-surface dark:to-dark-bg border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Current Status</p>
                                <div className="flex items-center gap-2 mb-2">
                                    <StatusBadge status={lead.status} className="!text-sm !px-3 !py-1" />
                                </div>
                                <p className="text-sm text-gray-500">
                                    {lead.status === 'new' && 'Lead needs qualification.'}
                                    {lead.status === 'contacted' && 'Initial contact made.'}
                                    {lead.status === 'qualified' && 'Ready for proposal.'}
                                    {lead.status === 'proposal_sent' && 'Proposal sent to client.'}
                                    {lead.status === 'negotiation' && 'Finalizing terms.'}
                                    {lead.status === 'closed_won' && 'Won! Ready for project.'}
                                    {lead.status === 'closed_lost' && 'Lost.'}
                                </p>
                            </div>
                            {lead.status === 'qualified' && (
                                <button
                                    onClick={() => setShowProposalModal(true)}
                                    className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
                                >
                                    <FileText size={16} /> Create Proposal
                                </button>
                            )}
                            {lead.status === 'closed_won' && (
                                <button
                                    onClick={() => setShowConvertModal(true)}
                                    className="btn btn-success w-full mt-4 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} /> Convert to Project
                                </button>
                            )}
                        </Card>

                        {/* 2. PROPOSAL CARD */}
                        <Card className="flex flex-col justify-between h-full relative overflow-hidden">
                            {proposals.length > 0 ? (
                                <>
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <FileText size={80} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-xs font-bold text-gray-400 uppercase">Active Proposal</p>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-100 text-green-700`}>
                                                {proposals[0].status}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{proposals[0].title}</h4>
                                        <p className="text-2xl font-bold text-primary-600">₹{proposals[0].value?.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{proposals[0].scope}</p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/proposals/${proposals[0].id}`)} // Assuming proposal details page exists/will exist
                                        className="btn btn-secondary w-full mt-4 flex items-center justify-center gap-2"
                                    >
                                        View Proposal <ArrowRight size={14} />
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                        <FileText size={24} />
                                    </div>
                                    <p className="font-bold text-gray-500">No Proposal Yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Create a proposal to move forward.</p>
                                </div>
                            )}
                        </Card>

                        {/* 3. PROJECT CARD */}
                        <Card className="flex flex-col justify-between h-full relative overflow-hidden">
                            {lead.project_id ? (
                                <>
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <Briefcase size={80} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Linked Project</p>
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">Project #{lead.project_id}</h4>
                                        <p className="text-sm text-gray-500">Active and In Progress</p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/projects/${lead.project_id}`)}
                                        className="btn btn-secondary w-full mt-4 flex items-center justify-center gap-2"
                                    >
                                        View Project <ArrowRight size={14} />
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-60">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                        <Briefcase size={24} />
                                    </div>
                                    <p className="font-bold text-gray-500">No Project</p>
                                    <p className="text-xs text-gray-400 mt-1">Project required after winning deal</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: INFO */}
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Contact Info</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg"><Phone size={16} /></div>
                                <span className="font-medium">{lead.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><Mail size={16} /></div>
                                <span className="font-medium">{lead.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 rounded-lg"><Briefcase size={16} /></div>
                                <span className="font-medium">{lead.role || 'Role N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 rounded-lg"><User size={16} /></div>
                                <span className="font-medium">{lead.assigned_to || 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 rounded-lg"><Calendar size={16} /></div>
                                <span className="font-medium">Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 rounded-lg"><Globe size={16} /></div>
                                <span className="font-medium">{lead.source || 'No Source'}</span>
                            </div>
                        </div>
                    </Card>

                    {lead.closed_lost_reason && (
                        <Card className="border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10">
                            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2">Lost Reason</h3>
                            <p className="text-red-700 dark:text-red-400 font-medium">{lead.closed_lost_reason}</p>
                        </Card>
                    )}
                </div>

                {/* RIGHT: ACTIVITY TIMELINE */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Activity Timeline</h3>
                        <button
                            onClick={() => setShowActivityModal(true)}
                            className="btn btn-primary py-1.5 px-4 text-xs flex items-center gap-2"
                        >
                            <Calendar size={14} /> Add Activity
                        </button>
                    </div>

                    <div className="relative pl-6 space-y-8 before:absolute before:inset-y-0 before:left-2 before:w-[2px] before:bg-gray-100 dark:before:bg-gray-800">
                        {activities.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No activities logged yet.</p>
                        )}
                        {activities.map((activity) => {
                            let metadata = {};
                            try { metadata = activity.metadata ? JSON.parse(activity.metadata) : {}; } catch (e) { }

                            return (
                                <div key={activity.id} className="relative animate-enter">
                                    <div className={`
                                        absolute top-1 left-[-29px] w-8 h-8 rounded-full border-4 border-white dark:border-dark-bg flex items-center justify-center z-10
                                        ${activity.type === 'call' ? 'bg-blue-100 text-blue-600' :
                                            activity.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                                                activity.type === 'status_change' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-gray-100 text-gray-600'}
                                    `}>
                                        {activity.type === 'call' ? <Phone size={14} /> :
                                            activity.type === 'meeting' ? <User size={14} /> :
                                                activity.type === 'status_change' ? <Clock size={14} /> :
                                                    <FileText size={14} />}
                                    </div>
                                    <Card className="!p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                    {activity.title}
                                                    {metadata.outcome && <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full uppercase">{metadata.outcome}</span>}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                    <User size={10} /> {activity.created_by || 'Me'}
                                                    {metadata.duration && <span className="flex items-center gap-1"><Clock size={10} /> {metadata.duration}</span>}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                                                {formatDate(activity.created_at)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50/50 dark:bg-gray-800/20 p-3 rounded-lg border border-gray-100 dark:border-gray-800/50">
                                            {activity.description}
                                        </div>
                                        {metadata.date && (
                                            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 p-2 rounded-lg inline-flex">
                                                <Calendar size={12} /> Date: {new Date(metadata.date).toLocaleString()}
                                            </div>
                                        )}
                                        {metadata.followup && (
                                            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 p-2 rounded-lg inline-flex ml-2">
                                                <ArrowRight size={12} /> Follow-up: {new Date(metadata.followup).toLocaleDateString()}
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>



            {/* MODALS */}

            {/* 1. Proposal Modal - Enhanced */}
            {
                showProposalModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-enter">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Create & Attach Proposal</h2>
                                <button onClick={() => setShowProposalModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmitProposal} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Proposal Name *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input"
                                            value={proposalForm.title}
                                            onChange={e => setProposalForm(p => ({ ...p, title: e.target.value }))}
                                            placeholder="e.g. Website Redesign Q3"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Total Value (₹) *</label>
                                        <input
                                            type="number"
                                            required
                                            className="input"
                                            value={proposalForm.value}
                                            onChange={e => setProposalForm(p => ({ ...p, value: e.target.value }))}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Scope of Work</label>
                                    <textarea
                                        className="input min-h-[80px]"
                                        value={proposalForm.scope}
                                        onChange={e => setProposalForm(p => ({ ...p, scope: e.target.value }))}
                                        placeholder="Define the scope..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Exclusions</label>
                                        <textarea
                                            className="input min-h-[60px]"
                                            value={proposalForm.exclusions}
                                            onChange={e => setProposalForm(p => ({ ...p, exclusions: e.target.value }))}
                                            placeholder="What is NOT included..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Terms & Conditions</label>
                                        <textarea
                                            className="input min-h-[60px]"
                                            value={proposalForm.terms}
                                            onChange={e => setProposalForm(p => ({ ...p, terms: e.target.value }))}
                                            placeholder="Payment terms, timeline..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Attachment (PDF)</label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => document.getElementById('prop-upload').click()}
                                    >
                                        <Upload className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm font-medium text-gray-600">
                                            {proposalFile ? proposalFile.name : 'Click to upload Proposal PDF'}
                                        </p>
                                        <input
                                            id="prop-upload"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            className="hidden"
                                            onChange={(e) => setProposalFile(e.target.files[0])}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowProposalModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                    <button type="submit" disabled={isUploading} className="btn btn-primary flex-1 shadow-lg shadow-primary-500/20">
                                        {isUploading ? 'Creating...' : 'Create Proposal & Send'}
                                    </button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )
            }

            {/* 2. Lost Reason Modal */}
            {
                showLostModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md animate-enter">
                            <h2 className="text-lg font-bold mb-4 text-red-600">Mark as Closed Lost</h2>
                            <form onSubmit={handleSubmitLost} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Reason (Mandatory)</label>
                                    <select
                                        className="input"
                                        required
                                        value={lostReason}
                                        onChange={(e) => setLostReason(e.target.value)}
                                    >
                                        <option value="">Select a reason...</option>
                                        {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                {lostReason === 'Other' && (
                                    <div>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Please specify..."
                                            required
                                            value={otherReason}
                                            onChange={(e) => setOtherReason(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowLostModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                    <button type="submit" disabled={!lostReason} className="btn bg-red-600 text-white hover:bg-red-700 flex-1">Confirm Lost</button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )
            }

            {/* 3. Project Conversion Modal */}
            {
                showConvertModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-lg animate-enter max-h-[90vh] overflow-y-auto">
                            <h2 className="text-lg font-bold mb-4">Convert to Project</h2>
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    Please upload the required documents to verify this deal before converting to a project.
                                </p>

                                {['scope', 'agreement', 'contract', 'pricing'].map(doc => (
                                    <div key={doc} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${conversionDocs[doc] ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                                {conversionDocs[doc] ? <CheckCircle size={16} /> : <FileText size={16} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm capitalize">{doc} Document</p>
                                                <p className="text-xs text-gray-400">{conversionDocs[doc] ? conversionDocs[doc].name : 'Required'}</p>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-secondary py-1 text-xs"
                                            onClick={() => document.getElementById(`doc-${doc}`).click()}
                                        >
                                            {conversionDocs[doc] ? 'Change' : 'Upload'}
                                        </button>
                                        <input
                                            id={`doc-${doc}`}
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => setConversionDocs(prev => ({ ...prev, [doc]: e.target.files[0] }))}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-6 mt-4 border-t border-gray-100">
                                <button onClick={() => setShowConvertModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <button
                                    onClick={handleConvertToProject}
                                    disabled={isUploading}
                                    className="btn btn-primary flex-1"
                                >
                                    {isUploading ? 'Verifying & Creating...' : 'Verify & Create Project'}
                                </button>
                            </div>
                        </Card>
                    </div>
                )
            }

            {/* 4. Edit Lead Modal */}
            {
                showEditModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-enter scrollbar-hide">
                            <LeadManagementForm
                                initialData={lead}
                                onSubmit={async (data) => {
                                    try {
                                        await leadsAPI.update(id, data);
                                        setShowEditModal(false);
                                        fetchLeadData();
                                    } catch (error) {
                                        console.error('Update error:', error);
                                    }
                                }}
                                onCancel={() => setShowEditModal(false)}
                            />
                        </div>
                    </div>
                )
            }
            {/* 5. Confirmation Modal */}
            {
                showConfirmModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-sm animate-enter text-center">
                            <h2 className="text-lg font-bold mb-2">Move to {PIPELINE_STAGES.find(s => s.key === pendingStage)?.label}?</h2>
                            <p className="text-sm text-gray-500 mb-6">This will update the pipeline stage and log an activity.</p>
                            <div className="flex gap-2">
                                <button onClick={() => setShowConfirmModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <button onClick={confirmStageChange} className="btn btn-primary flex-1">Confirm Move</button>
                            </div>
                        </Card>
                    </div>
                )
            }

            {/* 6. Add Activity Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg animate-enter">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Log Activity</h2>
                            <button onClick={() => setShowActivityModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl flex gap-2 mb-6">
                            {['note', 'call', 'meeting'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setActivityType(type)}
                                    className={`
                                        flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                                        ${activityType === type
                                            ? 'bg-white dark:bg-dark-surface shadow-sm text-primary-600 ring-1 ring-black/5 dark:ring-white/5'
                                            : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'}
                                    `}
                                >
                                    {type === 'note' && <FileText size={16} />}
                                    {type === 'call' && <Phone size={16} />}
                                    {type === 'meeting' && <User size={16} />}
                                    {type}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={(e) => { handleAddActivity(e); setShowActivityModal(false); }}>
                            {activityType === 'note' && (
                                <textarea
                                    value={activityContent}
                                    onChange={(e) => setActivityContent(e.target.value)}
                                    placeholder="Add a detailed note..."
                                    className="input min-h-[120px]"
                                    autoFocus
                                />
                            )}

                            {activityType === 'call' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Outcome</label>
                                            <input type="text" id="call-outcome" placeholder="e.g. Connected, Left Voicemail" className="input" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Duration</label>
                                            <input type="text" id="call-duration" placeholder="e.g. 15m" className="input" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Call Summary</label>
                                        <textarea
                                            value={activityContent}
                                            onChange={(e) => setActivityContent(e.target.value)}
                                            placeholder="What was discussed..."
                                            className="input min-h-[100px]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Follow-up Date</label>
                                        <input type="date" id="call-followup" className="input" />
                                    </div>
                                </div>
                            )}

                            {activityType === 'meeting' && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Meeting Date & Time</label>
                                        <input type="datetime-local" id="meeting-date" className="input" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Meeting Minutes</label>
                                        <textarea
                                            value={activityContent}
                                            onChange={(e) => setActivityContent(e.target.value)}
                                            placeholder="Key discussion points and next actions..."
                                            className="input min-h-[120px]"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex gap-3 border-t border-gray-100 pt-6">
                                <button type="button" onClick={() => setShowActivityModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={!activityContent.trim()}
                                    className="btn btn-primary flex-1 shadow-lg shadow-primary-500/20"
                                >
                                    Log {activityType.charAt(0).toUpperCase() + activityType.slice(1)}
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </MainLayout >
    );
};

export default LeadDetails;
