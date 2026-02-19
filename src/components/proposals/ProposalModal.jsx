import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { leadsAPI, projectsAPI, proposalsAPI } from '../../services/api';
import { Upload, X, FileText } from 'lucide-react';

const PROPOSAL_STATUSES = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
];

const ProposalModal = ({ isOpen, onClose, initialData = null, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Dropdown Data
    const [leads, setLeads] = useState([]);
    const [projects, setProjects] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        clientType: 'lead', // 'lead' or 'project'
        clientId: '', // lead_id or project_id
        value: '',
        scope: '',
        assumptions: '',
        exclusions: '',
        terms: '',
        status: 'draft',
        file_url: ''
    });

    // File State
    const [file, setFile] = useState(null);

    // Load initial data for Edit Mode
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                clientType: initialData.project_id ? 'project' : 'lead',
                clientId: initialData.project_id || initialData.lead_id || '',
                value: initialData.value || '',
                scope: initialData.scope || '',
                assumptions: initialData.assumptions || '',
                exclusions: initialData.exclusions || '',
                terms: initialData.terms || '',
                status: initialData.status || 'draft',
                file_url: initialData.file_url || ''
            });
        } else {
            // Reset form for New Proposal
            setFormData({
                title: '',
                clientType: 'lead',
                clientId: '',
                value: '',
                scope: '',
                assumptions: '',
                exclusions: '',
                terms: '',
                status: 'draft',
                file_url: ''
            });
            setFile(null);
        }
    }, [initialData, isOpen]);

    // Fetch Leads and Projects on mount
    useEffect(() => { // Only fetch if open to save resources? Or just fetch once.
        if (isOpen) {
            fetchOptions();
        }
    }, [isOpen]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            const [leadsData, projectsData] = await Promise.all([
                leadsAPI.getAll(),
                projectsAPI.getAll()
            ]);
            setLeads(leadsData || []);
            setProjects(projectsData || []);
        } catch (error) {
            console.error('Failed to fetch options', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            alert('Please upload a valid PDF file.');
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.clientId) {
            alert('Please fill in required fields (Title, Client).');
            return;
        }

        setSubmitting(true);
        try {
            // Prepare payload
            const payload = {
                ...formData,
                value: parseFloat(formData.value) || 0,
                lead_id: formData.clientType === 'lead' ? formData.clientId : null,
                project_id: formData.clientType === 'project' ? formData.clientId : null,
                // Client name for display (snapshot)
                client: formData.clientType === 'lead'
                    ? leads.find(l => l.id == formData.clientId)?.name
                    : projects.find(p => p.id == formData.clientId)?.title
            };

            // Handle file upload (Mock for now or if we had a real upload service)
            // In a real app, we'd upload 'file' to S3/Cloudinary and get a URL.
            // For now, if a file is selected, we might just simulate a URL or use a placeholder.
            if (file) {
                // TODO: Implement actual file upload
                console.log('File to upload:', file.name);
                payload.file_url = URL.createObjectURL(file); // Temporary blob URL for demo
            }

            if (initialData) {
                await proposalsAPI.update(initialData.id, payload);
            } else {
                await proposalsAPI.create(payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save proposal:', error);
            alert('Failed to save proposal');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Proposal" : "Create New Proposal"}
            isLoading={loading || submitting}
            maxWidth="max-w-4xl"
            footer={
                <>
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} className="btn btn-primary">
                        {initialData ? 'Update Proposal' : 'Create Proposal'}
                    </button>
                </>
            }
        >
            <div className="space-y-6">

                {/* 1. Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Proposal Name *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g. Website Redesign"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Value (₹)</label>
                        <input
                            type="number"
                            name="value"
                            value={formData.value}
                            onChange={handleChange}
                            className="input"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* 2. Client Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Client Type</label>
                        <select
                            name="clientType"
                            value={formData.clientType}
                            onChange={(e) => { handleChange(e); setFormData(prev => ({ ...prev, clientId: '' })); }}
                            className="input"
                        >
                            <option value="lead">Lead</option>
                            <option value="project">Project</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Select Client *</label>
                        <select
                            name="clientId"
                            value={formData.clientId}
                            onChange={handleChange}
                            className="input"
                            disabled={loading}
                        >
                            <option value="">-- Select {formData.clientType === 'lead' ? 'Lead' : 'Project'} --</option>
                            {formData.clientType === 'lead' ? (
                                leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.company})</option>)
                            ) : (
                                projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)
                            )}
                        </select>
                    </div>
                </div>

                {/* 3. Detailed Content */}
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Scope of Work</label>
                        <textarea
                            name="scope"
                            value={formData.scope}
                            onChange={handleChange}
                            className="input min-h-[100px]"
                            placeholder="Detailed scope..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Assumptions</label>
                        <textarea
                            name="assumptions"
                            value={formData.assumptions}
                            onChange={handleChange}
                            className="input min-h-[80px]"
                            placeholder="Key assumptions..."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">Exclusions</label>
                            <textarea
                                name="exclusions"
                                value={formData.exclusions}
                                onChange={handleChange}
                                className="input min-h-[80px]"
                                placeholder="What is not included..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">Terms & Conditions</label>
                            <textarea
                                name="terms"
                                value={formData.terms}
                                onChange={handleChange}
                                className="input min-h-[80px]"
                                placeholder="Payment terms, timeline, etc..."
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Footer & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="input"
                        >
                            {PROPOSAL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Attachment (PDF)</label>
                        <div className="flex items-center gap-3">
                            <label className="btn btn-secondary cursor-pointer flex items-center gap-2">
                                <Upload size={16} /> {file ? 'Change File' : 'Upload PDF'}
                                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                            </label>
                            {file && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                    <FileText size={14} />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                </div>
                            )}
                            {!file && formData.file_url && (
                                <div className="text-xs text-green-600 flex items-center gap-1">
                                    <FileText size={14} /> Existing File Linked
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </Modal>
    );
};

export default ProposalModal;
