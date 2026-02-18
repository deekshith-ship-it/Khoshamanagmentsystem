import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, Avatar } from '../components/common';
import {
    ArrowLeft, Phone, Mail, MessageCircle, Clock, Send, Link2, X,
    ArrowRight, CheckCircle, XCircle, FileText, Upload, Calendar, User, Edit2
} from 'lucide-react';
import { leadsAPI, leadActivitiesAPI, proposalsAPI, projectsAPI } from '../services/api';

const PIPELINE_STAGES = [
    { key: 'new', label: 'New' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'proposal-sent', label: 'Proposal Sent' },
    { key: 'negotiation', label: 'Negotiation' },
    { key: 'follow-up', label: 'Follow-up' },
    { key: 'closed-won', label: 'Closed Won' },
    { key: 'closed-lost', label: 'Closed Lost' }
];

const LOST_REASONS = [
    'Too Expensive',
    'Budget Issue',
    'Lost to Competitor',
    'Not Interested',
    'No Response',
    'Scope Mismatch',
    'Other'
];

const LeadDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Activity State
    const [activityType, setActivityType] = useState('note'); // note, call, meeting
    const [activityContent, setActivityContent] = useState('');

    // Status Modals State
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [proposalFile, setProposalFile] = useState(null);
    const [proposalNote, setProposalNote] = useState('');
    const [isUploading, setIsUploading] = useState(false);

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
            const [leadData, activitiesData] = await Promise.all([
                leadsAPI.getById(id),
                leadActivitiesAPI.getByLeadId(id),
            ]);
            setLead(leadData);
            setActivities(activitiesData || []);
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

    const updateStatus = async (status, extraData = {}) => {
        try {
            await leadsAPI.update(id, { ...lead, status, ...extraData });

            // Log automated activity
            await leadActivitiesAPI.create({
                lead_id: id,
                type: 'status_change',
                title: `Status updated to ${PIPELINE_STAGES.find(s => s.key === status)?.label}`,
                description: `Lead moved to ${status} stage.`,
                author: 'System'
            });

            fetchLeadData();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleStageClick = (stageKey) => {
        if (!lead || lead.status === stageKey) return;

        if (stageKey === 'proposal-sent') {
            setShowProposalModal(true);
            return;
        }

        if (stageKey === 'closed-lost') {
            setShowLostModal(true);
            return;
        }

        if (stageKey === 'closed-won') {
            if (window.confirm('Are you sure you want to mark this deal as Won?')) {
                updateStatus('closed-won');
            }
            return;
        }

        // Direct update for other stages
        updateStatus(stageKey);
    };

    const handleSubmitProposal = async (e) => {
        e.preventDefault();
        if (!proposalFile) return;

        try {
            setIsUploading(true);
            const fileUrl = await handleUpload(proposalFile);

            // Create Proposal Record
            await proposalsAPI.create({
                title: `Proposal for ${lead.company}`,
                client: lead.company,
                lead_id: id,
                file_url: fileUrl,
                notes: proposalNote,
                status: 'sent',
                value: 0
            });

            await updateStatus('proposal-sent');
            setShowProposalModal(false);
            setProposalFile(null);
            setProposalNote('');
        } catch (error) {
            console.error('Proposal submission failed:', error);
            alert('Failed to submit proposal');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmitLost = async (e) => {
        e.preventDefault();
        const reason = lostReason === 'Other' ? otherReason : lostReason;
        if (!reason) return;

        await updateStatus('closed-lost', { closed_lost_reason: reason });
        setShowLostModal(false);
        setLostReason('');
        setOtherReason('');
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        if (!activityContent.trim()) return;

        try {
            await leadActivitiesAPI.create({
                lead_id: id,
                type: activityType,
                title: activityType === 'call' ? 'Logged a Call' : activityType === 'meeting' ? 'Logged a Meeting' : 'Note Added',
                description: activityContent,
                author: 'Me' // Ideally current user
            });
            setActivityContent('');
            fetchLeadData();
        } catch (error) {
            console.error('Error adding activity:', error);
        }
    };

    const handleConvertToProject = async () => {
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
                ...uploadedUrls
            };

            const newProject = await projectsAPI.create(projectData);

            await leadActivitiesAPI.create({
                lead_id: id,
                type: 'conversion',
                title: 'Converted to Project',
                description: `Lead successfully converted to project: ${projectData.title}`,
                author: 'System'
            });

            // Update lead status if not already won
            if (lead.status !== 'closed-won') {
                await leadsAPI.update(id, { ...lead, status: 'closed-won' });
            }

            navigate(`/projects/${newProject.id}`);
        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Failed to convert project');
        } finally {
            setIsUploading(false);
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

                {/* VISUAL PIPELINE */}
                <Card padding="none" className="overflow-x-auto relative z-0">
                    <div className="flex min-w-max p-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        {PIPELINE_STAGES.map((stage, index) => {
                            const isCurrent = lead.status === stage.key;
                            const isPast = PIPELINE_STAGES.findIndex(s => s.key === lead.status) > index;

                            return (
                                <button
                                    key={stage.key}
                                    onClick={() => handleStageClick(stage.key)}
                                    className={`
                                        relative flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider text-center transition-all duration-300
                                        ${isCurrent
                                            ? 'bg-white dark:bg-dark-surface text-primary-600 shadow-sm rounded-lg z-10 scale-105'
                                            : isPast
                                                ? 'text-primary-600/70 hover:bg-white/50'
                                                : 'text-gray-400 hover:text-gray-600 dark:text-gray-600'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {isPast && <CheckCircle size={14} />}
                                        {stage.key === 'closed-lost' && lead.status === 'closed-lost' && <XCircle size={14} className="text-red-500" />}
                                        <span className={stage.key === 'closed-lost' && lead.status === 'closed-lost' ? 'text-red-500' : ''}>{stage.label}</span>
                                    </div>
                                    {isCurrent && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full mb-1"></div>}
                                </button>
                            );
                        })}
                    </div>
                </Card>
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
                    <Card className="!p-0 overflow-hidden">
                        {/* ACTIVITY INPUT TABS */}
                        <div className="bg-gray-50/80 dark:bg-gray-800/30 p-2 flex gap-2 border-b border-gray-100 dark:border-gray-800">
                            {['note', 'call', 'meeting'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setActivityType(type)}
                                    className={`
                                        flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                                        ${activityType === type
                                            ? 'bg-white dark:bg-dark-surface shadow-sm text-primary-600'
                                            : 'text-gray-500 hover:bg-white/50'
                                        }
                                    `}
                                >
                                    {type === 'note' && <FileText size={14} />}
                                    {type === 'call' && <Phone size={14} />}
                                    {type === 'meeting' && <User size={14} />}
                                    {type}
                                </button>
                            ))}
                        </div>
                        <form onSubmit={handleAddActivity} className="p-4">
                            <textarea
                                value={activityContent}
                                onChange={(e) => setActivityContent(e.target.value)}
                                placeholder={`Add a ${activityType}...`}
                                className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm min-h-[80px] resize-none placeholder-gray-400"
                            />
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="text-xs text-gray-400 font-medium">Author: Me</div>
                                <button
                                    type="submit"
                                    disabled={!activityContent.trim()}
                                    className="btn btn-primary py-1.5 px-4 text-xs"
                                >
                                    Add Activity
                                </button>
                            </div>
                        </form>
                    </Card>

                    <div className="relative pl-6 space-y-8 before:absolute before:inset-y-0 before:left-2 before:w-[2px] before:bg-gray-100 dark:before:bg-gray-800">
                        {activities.map((activity) => (
                            <div key={activity.id} className="relative">
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
                                <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{activity.title}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{activity.author || 'System'}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                                            {formatDate(activity.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {activity.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODALS */}

            {/* 1. Proposal Modal */}
            {showProposalModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md animate-enter">
                        <h2 className="text-lg font-bold mb-4">Attach Proposal</h2>
                        <form onSubmit={handleSubmitProposal} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Proposal File (Required)</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative"
                                    onClick={() => document.getElementById('prop-upload').click()}
                                >
                                    <Upload className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm font-medium text-gray-600">
                                        {proposalFile ? proposalFile.name : 'Click to upload PDF'}
                                    </p>
                                    <input
                                        id="prop-upload"
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        className="hidden"
                                        required
                                        onChange={(e) => setProposalFile(e.target.files[0])}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Note (Optional)</label>
                                <textarea
                                    className="input min-h-[80px]"
                                    placeholder="Add a note about this proposal..."
                                    value={proposalNote}
                                    onChange={(e) => setProposalNote(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowProposalModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={!proposalFile || isUploading} className="btn btn-primary flex-1">
                                    {isUploading ? 'Uploading...' : 'Confirm & Send'}
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* 2. Lost Reason Modal */}
            {showLostModal && (
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
            )}

            {/* 3. Project Conversion Modal */}
            {showConvertModal && (
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
            )}

            {/* 4. Edit Lead Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md animate-enter">
                        <h2 className="text-lg font-bold mb-4">Edit Lead</h2>
                        <form onSubmit={handleUpdateLead} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Phone</label>
                                <input
                                    type="tel"
                                    className="input"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Role</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editForm.role}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Company</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editForm.company}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn btn-primary flex-1">Save Changes</button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </MainLayout>
    );
};

export default LeadDetails;
