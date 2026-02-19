import React, { useState, useEffect } from 'react';
import { Card } from '../common';
import {
    User, Mail, Phone, Building2, Briefcase,
    AlertCircle, CheckCircle2, XCircle,
    ChevronDown, Save, X
} from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'new', label: 'New', color: 'bg-blue-50 text-blue-700 border-blue-100', order: 1 },
    { value: 'contacted', label: 'Contacted', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', order: 2 },
    { value: 'qualified', label: 'Qualified', color: 'bg-cyan-50 text-cyan-700 border-cyan-100', order: 3 },
    { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-purple-50 text-purple-700 border-purple-100', order: 4 },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-50 text-orange-700 border-orange-100', order: 5 },
    { value: 'follow_up', label: 'Follow Up', color: 'bg-amber-50 text-amber-700 border-amber-100', order: 6 },
    { value: 'closed_won', label: 'Closed Won', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', order: 7 },
    { value: 'closed_lost', label: 'Closed Lost', color: 'bg-rose-50 text-rose-700 border-rose-100', order: 8 },
];

const LOSS_REASONS = [
    'Price Too High',
    'No Budget',
    'Competitor Won',
    'No Response',
    'Not Interested',
    'Timeline Mismatch'
];

const LeadManagementForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        role: '',
        status: '',
        loss_reason: '',
        notes: '',
        ...initialData
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Business Logic: Check if a status transition is allowed
    const isTransitionDisabled = (targetStatus) => {
        const currentStatus = initialData?.status || 'new';

        // Find indices
        const currentIndex = STATUS_OPTIONS.findIndex(s => s.value === currentStatus);
        const targetIndex = STATUS_OPTIONS.findIndex(s => s.value === targetStatus);

        // Always allow staying same or going backwards (correction)
        if (targetIndex <= currentIndex) return false;

        // Always allow moving to Closed Lost
        if (targetStatus === 'closed_lost') return false;

        // Enforce sequential progression (can only move to next stage)
        // Exception: Can move from 'negotiation' to 'follow_up' (both index 4 and 5)
        // Check if skipping more than 1 stage
        if (targetIndex > currentIndex + 1) {
            return true;
        }

        return false;
    };

    // Dynamic Logic: Reset loss_reason if status changes from closed_lost
    useEffect(() => {
        if (formData.status !== 'closed_lost' && formData.loss_reason) {
            setFormData(prev => ({ ...prev, loss_reason: '' }));
        }
    }, [formData.status]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.status) newErrors.status = 'Lead status is required';

        if (formData.status === 'closed_lost' && !formData.loss_reason) {
            newErrors.loss_reason = 'Reason for loss is required for Closed Lost leads';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto p-1 animate-enter">
            <Card className="shadow-sm border-gray-100 dark:border-dark-border">
                <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50 dark:border-dark-border/50">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lead Details</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage lead profile and conversion status</p>
                        </div>
                        <div className="hidden sm:block">
                            {formData.status && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${STATUS_OPTIONS.find(s => s.value === formData.status)?.color || ''}`}>
                                    {STATUS_OPTIONS.find(s => s.value === formData.status)?.label}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Contact Information
                            </h3>

                            {/* Name info */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Full Name *</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                        className={`input pl-10 ${errors.name ? 'border-red-300 focus:ring-red-100' : ''}`}
                                    />
                                </div>
                                {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.name}</p>}
                            </div>

                            {/* Job Title */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Job Title</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                        <Briefcase size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        placeholder="e.g. CEO"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className={`input pl-10 ${errors.email ? 'border-red-300 focus:ring-red-100' : ''}`}
                                    />
                                </div>
                                {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email}</p>}
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Phone Number</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Professional Info Section */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={14} /> Professional Details
                            </h3>

                            {/* Source */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Lead Source</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                        <AlertCircle size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="source"
                                        value={formData.source || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. Website, Referral"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>

                            {/* Company */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Company Name</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                        <Building2 size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        placeholder="Acme Corp"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>

                            {/* Status Selection */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Lead Status *</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors z-10 pointer-events-none">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className={`input pl-10 appearance-none cursor-pointer ${errors.status ? 'border-red-300 focus:ring-red-100' : ''}`}
                                    >
                                        <option value="" disabled>Select Status</option>
                                        {STATUS_OPTIONS.map(opt => (
                                            <option
                                                key={opt.value}
                                                value={opt.value}
                                                disabled={isTransitionDisabled(opt.value)}
                                            >
                                                {opt.label} {isTransitionDisabled(opt.value) ? '(Requires Qualification)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                                {errors.status && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.status}</p>}
                            </div>

                            {/* Conditional Rendering: Reason for Loss */}
                            {formData.status === 'closed_lost' && (
                                <div className="space-y-1.5 animate-slide-up">
                                    <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 ml-1 inline-flex items-center gap-1">
                                        <XCircle size={10} /> Reason for Loss *
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 group-focus-within:text-rose-500 transition-colors z-10 pointer-events-none">
                                            <AlertCircle size={18} />
                                        </div>
                                        <select
                                            name="loss_reason"
                                            value={formData.loss_reason}
                                            onChange={handleChange}
                                            required
                                            className={`input pl-10 border-rose-200 bg-rose-50/30 focus:ring-rose-100 appearance-none cursor-pointer ${errors.loss_reason ? 'border-red-400' : ''}`}
                                        >
                                            <option value="" disabled>Select Reason</option>
                                            {LOSS_REASONS.map(reason => (
                                                <option key={reason} value={reason}>{reason}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                    {errors.loss_reason && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.loss_reason}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Full Width Footer Area */}
                    <div className="mt-8 space-y-6 pt-6 border-t border-gray-50 dark:border-dark-border/50">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Internal Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Add any specific context about this lead..."
                                className="input resize-none"
                            ></textarea>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto btn btn-primary flex items-center justify-center gap-2 py-2.5 px-8 shadow-md hover:shadow-lg disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>Save Lead Module</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </Card>
        </form>
    );
};

export default LeadManagementForm;
