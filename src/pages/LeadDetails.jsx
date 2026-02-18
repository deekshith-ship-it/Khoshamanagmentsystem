import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, Avatar, StatusBadge } from '../components/common';
import { ArrowLeft, Phone, Mail, MessageCircle, Eye, Clock, Send, Link2, PhoneOutgoing, X, ArrowRight } from 'lucide-react';
import { leadsAPI, leadCommentsAPI, leadActivitiesAPI, proposalsAPI, projectsAPI } from '../services/api';

const LeadDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [comments, setComments] = useState([]);
    const [activities, setActivities] = useState([]);
    const [linkedProposals, setLinkedProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});

    const fetchLeadData = useCallback(async () => {
        try {
            setLoading(true);
            const [leadData, commentsData, activitiesData, proposalsData] = await Promise.all([
                leadsAPI.getById(id),
                leadCommentsAPI.getByLeadId(id),
                leadActivitiesAPI.getByLeadId(id),
                proposalsAPI.getByLeadId ? proposalsAPI.getByLeadId(id) : Promise.resolve([])
            ]);
            setLead(leadData);
            setComments(commentsData || []);
            setActivities(activitiesData || []);
            setLinkedProposals(proposalsData || []);
            setEditFormData(leadData);
        } catch (error) {
            console.error('Error fetching lead data:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLeadData();
    }, [id, fetchLeadData]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await leadCommentsAPI.create({
                lead_id: id,
                content: newComment,
                author: 'Current User'
            });
            setNewComment('');
            fetchLeadData();
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                await leadsAPI.delete(id);
                navigate('/leads');
            } catch (error) {
                console.error('Error deleting lead:', error);
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await leadsAPI.update(id, editFormData);
            setShowEditModal(false);
            fetchLeadData();
        } catch (error) {
            console.error('Error updating lead:', error);
        }
    };

    const handleConvertToProject = async () => {
        try {
            const projectData = {
                title: `${lead.name} - Project`,
                client: lead.company,
                status: 'in-progress',
                assignee: 'Unassigned'
            };
            const newProject = await projectsAPI.create(projectData);

            // Log activity
            await leadActivitiesAPI.create({
                lead_id: id,
                type: 'conversion',
                title: 'Converted to Project',
                description: `Lead converted to project: ${projectData.title}`
            });

            // Navigate to the new project
            navigate(`/projects/${newProject.id}`);
        } catch (error) {
            console.error('Error converting to project:', error);
            alert('Failed to convert lead to project');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Just now';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60));
        if (diff < 1) return 'Just now';
        if (diff < 24) return `${diff}h ago`;
        if (diff < 48) return 'Yesterday';
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'link_opened': return <Eye size={16} className="text-blue-500" />;
            case 'call': return <PhoneOutgoing size={16} className="text-green-500" />;
            case 'email': return <Mail size={16} className="text-purple-500" />;
            default: return <Clock size={16} className="text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <MainLayout title="Lead Details">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 dark:text-[#A0A0A0]">Loading lead details...</p>
                </div>
            </MainLayout>
        );
    }

    if (!lead) {
        return (
            <MainLayout title="Lead Details">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 dark:text-[#A0A0A0]">Lead not found</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout
            title=""
            headerAction={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="btn btn-secondary text-xs uppercase tracking-wider"
                    >
                        Edit Lead
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        Delete
                    </button>
                </div>
            }
        >
            {/* Back Button */}
            <button
                onClick={() => navigate('/leads')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors group"
            >
                <div className="p-1 rounded-lg group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors">
                    <ArrowLeft size={20} />
                </div>
                <span className="font-bold text-sm">Back to Leads</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile & Info */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Lead Profile Card */}
                    <Card className="card glass text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 z-0"></div>
                        <div className="relative z-10 flex flex-col items-center pt-8 pb-6 px-6">
                            <div className="mb-4 p-1 bg-white dark:bg-gray-900 rounded-full shadow-sm">
                                <Avatar name={lead.name} size="xl" />
                            </div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-1">{lead.name}</h1>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                                {lead.role} at {lead.company}
                            </p>
                            <StatusBadge status={lead.status} />

                            {/* Contact Actions */}
                            <div className="flex items-center justify-center gap-4 mt-8 w-full">
                                <a
                                    href={`tel:${lead.phone || ''}`}
                                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group/btn"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 dark:bg-gray-800 dark:text-primary-400 flex items-center justify-center group-hover/btn:scale-110 transition-transform shadow-sm">
                                        <Phone size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Call</span>
                                </a>
                                <a
                                    href={`mailto:${lead.email || ''}`}
                                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group/btn"
                                >
                                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 dark:bg-gray-800 dark:text-purple-400 flex items-center justify-center group-hover/btn:scale-110 transition-transform shadow-sm">
                                        <Mail size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</span>
                                </a>
                                <a
                                    href={`https://wa.me/${lead.phone?.replace(/\D/g, '') || ''}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group/btn"
                                >
                                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 dark:bg-gray-800 dark:text-green-400 flex items-center justify-center group-hover/btn:scale-110 transition-transform shadow-sm">
                                        <MessageCircle size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">WhatsApp</span>
                                </a>
                            </div>
                        </div>

                        {(lead.email || lead.phone) && (
                            <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 p-4 text-xs font-medium text-gray-500 dark:text-gray-400 space-y-1 text-left">
                                {lead.email && <div className="flex items-center gap-2"><Mail size={12} className="opacity-50" /> {lead.email}</div>}
                                {lead.phone && <div className="flex items-center gap-2"><Phone size={12} className="opacity-50" /> {lead.phone}</div>}
                            </div>
                        )}
                    </Card>

                    <button
                        onClick={handleConvertToProject}
                        className="w-full btn btn-primary py-4 text-sm uppercase tracking-widest shadow-lg shadow-primary-500/20 group"
                    >
                        <span className="group-hover:mr-2 transition-all">Convert to Project</span>
                        <ArrowRight size={16} className="hidden group-hover:inline-block transition-all animate-bounce-x" />
                    </button>

                    {/* Linked Proposals */}
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 ml-1">Linked Proposals</h2>
                        <Card padding="none" className="card glass overflow-hidden">
                            {linkedProposals.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {linkedProposals.map((proposal) => (
                                        <div key={proposal.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer">
                                            <div>
                                                <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{proposal.title}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                                    {formatCurrency(proposal.value)} • {formatDate(proposal.created_at)}
                                                </p>
                                            </div>
                                            <StatusBadge status={proposal.status || 'viewed'} className="scale-75 origin-right" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Link2 size={24} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-xs font-bold">No linked proposals</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Right Column: Activity & Comments */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Activity Timeline */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-primary-500" />
                            Activity Timeline
                        </h2>
                        <Card className="card glass">
                            {activities.length > 0 ? (
                                <div className="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-2 before:w-[2px] before:bg-gray-100 dark:before:bg-gray-800">
                                    {activities.map((activity) => (
                                        <div key={activity.id} className="relative pl-6">
                                            <div className="absolute top-1 left-[-5px] w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 shadow-sm z-10 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400"></div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{activity.title}</h4>
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md self-start">
                                                    {formatDate(activity.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-100 dark:border-gray-800/50">
                                                {activity.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                                    <Clock size={40} className="mx-auto opacity-20 mb-4" />
                                    <p className="text-sm font-medium">No activity recorded yet</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Comments & Notes */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <MessageCircle size={20} className="text-primary-500" />
                            Comments & Notes
                        </h2>
                        <Card className="card glass flex flex-col h-[500px]">
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-4">
                                {comments.length > 0 ? (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-4 group">
                                            <Avatar name={comment.author || 'User'} size="sm" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white">{comment.author}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{formatDate(comment.created_at)}</span>
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-r-2xl rounded-bl-2xl">
                                                    {comment.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                                        <MessageCircle size={32} className="opacity-20 mb-3" />
                                        <p className="text-sm font-bold">No comments yet</p>
                                        <p className="text-xs">Start the conversation</p>
                                    </div>
                                )}
                            </div>

                            {/* Comment Input */}
                            <form onSubmit={handleAddComment} className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Type a note or comment..."
                                    className="input bg-gray-50 dark:bg-gray-800/50 border-0 focus:ring-2 focus:ring-primary-100"
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary px-4 aspect-square flex items-center justify-center rounded-xl"
                                    disabled={!newComment.trim()}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-enter relative">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Lead</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.name || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={editFormData.email || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={editFormData.phone || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Role</label>
                                    <input
                                        type="text"
                                        value={editFormData.role || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Company</label>
                                    <input
                                        type="text"
                                        value={editFormData.company || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Status</label>
                                    <div className="relative">
                                        <select
                                            value={editFormData.status || 'new'}
                                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                            className="input appearance-none cursor-pointer"
                                        >
                                            <option value="new">New</option>
                                            <option value="negotiation">Negotiation</option>
                                            <option value="follow-up">Follow-up</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 btn btn-secondary text-xs uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn btn-primary text-xs uppercase tracking-wider">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default LeadDetails;
