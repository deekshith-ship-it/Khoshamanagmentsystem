import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { Card, StatusBadge, FloatingAddButton, Modal } from '../components/common';
import {
    X, Search, Trash2, Edit, UserPlus, Phone, Mail,
    Building2, Briefcase, Loader2, MapPin, Calendar, CreditCard,
    Shield, Heart, Hash, Upload
} from 'lucide-react';
import { employeesAPI } from '../services/api';

const emptyForm = {
    employeeName: '',
    employeeAddress: '',
    employeeNumber: '',
    employeeEmail: '',
    employeeDOB: '',
    employeeDesignation: '',
    employeeDepartment: '',
    employeeJoinDate: new Date().toISOString().split('T')[0],
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    panNumber: '',
    aadharNumber: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyPhone: '',
    status: 'active',
    document: null,
};

const Onboarding = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });


    useEffect(() => {
        fetchEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await employeesAPI.getAll();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingEmployee) {
                await employeesAPI.update(editingEmployee.id, formData);
            } else {
                await employeesAPI.create(formData);
            }
            setShowModal(false);
            resetForm();
            fetchEmployees();
        } catch (error) {
            console.error('Error saving employee:', error);
            alert(error.message || 'Failed to save employee');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (emp) => {
        setEditingEmployee(emp);
        setFormData({
            employeeName: emp.employee_name || '',
            employeeAddress: emp.employee_address || '',
            employeeNumber: emp.employee_number || '',
            employeeEmail: emp.employee_email || '',
            employeeDOB: emp.employee_dob || '',
            employeeDesignation: emp.employee_designation || '',
            employeeDepartment: emp.employee_department || '',
            employeeJoinDate: emp.employee_join_date || '',
            bankName: emp.bank_name || '',
            bankAccountNumber: emp.bank_account_number || '',
            ifscCode: emp.ifsc_code || '',
            panNumber: emp.pan_number || '',
            aadharNumber: emp.aadhar_number || '',
            emergencyContactName: emp.emergency_contact_name || '',
            emergencyContactRelationship: emp.emergency_contact_relationship || '',
            emergencyPhone: emp.emergency_contact_phone || '',
            status: emp.status || 'active',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this employee?')) return;
        try {
            await employeesAPI.delete(id);
            fetchEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    const resetForm = () => {
        setEditingEmployee(null);
        setFormData({ ...emptyForm });
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const filteredEmployees = employees.filter(emp =>
        emp.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    return (
        <MainLayout title="Onboarding">
            <div className="max-w-6xl page-enter">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div className="relative w-72">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10"
                            placeholder="Search employees..."
                        />
                    </div>
                    <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
                        <UserPlus size={18} />
                        Add Employee
                    </button>
                </div>

                {/* Employee Cards Grid */}
                {loading ? (
                    <div className="card flex flex-col items-center justify-center py-32 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading employees...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                        {filteredEmployees.map((emp) => (
                            <Card key={emp.id} className="group card-hover hover:border-primary-200 dark:hover:border-primary-900/50 transition-all relative">
                                {/* Actions */}
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => handleEdit(emp)}
                                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(emp.id)}
                                        className="p-1.5 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg shrink-0">
                                        {emp.employee_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{emp.employee_name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{emp.employee_designation || 'No designation'}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 space-y-2.5">
                                    {emp.employee_email && (
                                        <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                                            <Mail size={12} className="opacity-50 shrink-0" />
                                            <span className="truncate">{emp.employee_email}</span>
                                        </div>
                                    )}
                                    {emp.employee_number && (
                                        <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                                            <Phone size={12} className="opacity-50 shrink-0" />
                                            <span>{emp.employee_number}</span>
                                        </div>
                                    )}
                                    {emp.employee_department && (
                                        <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                                            <Building2 size={12} className="opacity-50 shrink-0" />
                                            <span>{emp.employee_department}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                    <StatusBadge status={emp.status || 'active'} />
                                    {emp.employee_join_date && (
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                            {emp.employee_join_date}
                                        </span>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {!loading && filteredEmployees.length === 0 && (
                    <div className="text-center py-24 bg-gray-50/50 dark:bg-dark-surface rounded-2xl border border-dashed border-gray-200 dark:border-dark-border">
                        <UserPlus size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No employees found</p>
                        <button onClick={openAddModal} className="btn btn-primary mt-6">
                            Add First Employee
                        </button>
                    </div>
                )}
            </div>

            <FloatingAddButton onClick={openAddModal} />

            {/* ========== ADD / EDIT EMPLOYEE MODAL ========== */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                maxWidth="max-w-3xl"
                footer={
                    <div className="flex gap-3 w-full">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="flex-1 btn btn-secondary text-xs uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button type="submit" form="employee-form" disabled={isSubmitting} className="flex-1 btn btn-primary text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {editingEmployee ? 'Update Employee' : 'Add Employee'}
                        </button>
                    </div>
                }
            >
                <form id="employee-form" onSubmit={handleSubmit} className="space-y-8">

                    {/* ── Section 1: Personal Details ── */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-dark-border">
                            <UserPlus size={16} className="text-primary-500" />
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Personal Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><UserPlus size={12} /> Full Name *</span>
                                </label>
                                <input type="text" required value={formData.employeeName} onChange={(e) => updateField('employeeName', e.target.value)} className="input" placeholder="Enter full name" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><MapPin size={12} /> Address *</span>
                                </label>
                                <input type="text" required value={formData.employeeAddress} onChange={(e) => updateField('employeeAddress', e.target.value)} className="input" placeholder="Full address" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Phone size={12} /> Phone Number *</span>
                                </label>
                                <input type="tel" required value={formData.employeeNumber} onChange={(e) => updateField('employeeNumber', e.target.value)} className="input" placeholder="10-digit number" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Mail size={12} /> Email</span>
                                </label>
                                <input type="email" value={formData.employeeEmail} onChange={(e) => updateField('employeeEmail', e.target.value)} className="input" placeholder="Email address" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Calendar size={12} /> Date of Birth</span>
                                </label>
                                <input type="date" value={formData.employeeDOB} onChange={(e) => updateField('employeeDOB', e.target.value)} className="input" />
                            </div>
                            <div className="md:col-span-2 mt-2">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Photo or ID Document</label>
                                <div className="relative group/file">
                                    <input
                                        type="file"
                                        id="emp-document"
                                        className="hidden"
                                        onChange={(e) => updateField('document', e.target.files[0])}
                                    />
                                    <label
                                        htmlFor="emp-document"
                                        className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 cursor-pointer transition-all"
                                    >
                                        <div className="icon-circle-primary w-10 h-10 shrink-0 group-hover/file:scale-110 transition-transform">
                                            <Upload size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                {formData.document ? formData.document.name : 'Pick a file from local folder'}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">
                                                {formData.document ? `${(formData.document.size / 1024).toFixed(1)} KB` : 'Image or PDF (Max 5MB)'}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Section 2: Job Details ── */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-dark-border">
                            <Briefcase size={16} className="text-primary-500" />
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Job Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Briefcase size={12} /> Designation *</span>
                                </label>
                                <input type="text" required value={formData.employeeDesignation} onChange={(e) => updateField('employeeDesignation', e.target.value)} className="input" placeholder="e.g., Software Developer" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Building2 size={12} /> Department *</span>
                                </label>
                                <input type="text" required value={formData.employeeDepartment} onChange={(e) => updateField('employeeDepartment', e.target.value)} className="input" placeholder="e.g., Engineering" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Calendar size={12} /> Joining Date</span>
                                </label>
                                <input type="date" value={formData.employeeJoinDate} onChange={(e) => updateField('employeeJoinDate', e.target.value)} className="input" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Status</label>
                                <select value={formData.status} onChange={(e) => updateField('status', e.target.value)} className="input appearance-none cursor-pointer">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="on-hold">On Hold</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* ── Section 3: Bank Details ── */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-dark-border">
                            <CreditCard size={16} className="text-primary-500" />
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Bank Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Building2 size={12} /> Bank Name</span>
                                </label>
                                <input type="text" value={formData.bankName} onChange={(e) => updateField('bankName', e.target.value)} className="input" placeholder="e.g., HDFC Bank" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Hash size={12} /> Account Number *</span>
                                </label>
                                <input type="text" required value={formData.bankAccountNumber} onChange={(e) => updateField('bankAccountNumber', e.target.value)} className="input" placeholder="Bank account number" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Hash size={12} /> IFSC Code *</span>
                                </label>
                                <input type="text" required value={formData.ifscCode} onChange={(e) => updateField('ifscCode', e.target.value)} className="input" placeholder="e.g., HDFC0001234" />
                            </div>
                        </div>
                    </section>

                    {/* ── Section 4: Identity Documents ── */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-dark-border">
                            <Shield size={16} className="text-primary-500" />
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Identity Documents</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Shield size={12} /> PAN Number *</span>
                                </label>
                                <input type="text" required value={formData.panNumber} onChange={(e) => updateField('panNumber', e.target.value.toUpperCase())} className="input" placeholder="e.g., ABCDE1234F" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Shield size={12} /> Aadhar Number *</span>
                                </label>
                                <input type="text" required value={formData.aadharNumber} onChange={(e) => updateField('aadharNumber', e.target.value)} className="input" placeholder="12-digit Aadhar number" />
                            </div>
                        </div>
                    </section>

                    {/* ── Section 5: Emergency Contact ── */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-dark-border">
                            <Heart size={16} className="text-danger-500" />
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Emergency Contact</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><UserPlus size={12} /> Contact Name *</span>
                                </label>
                                <input type="text" required value={formData.emergencyContactName} onChange={(e) => updateField('emergencyContactName', e.target.value)} className="input" placeholder="Emergency contact name" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Heart size={12} /> Relationship</span>
                                </label>
                                <input type="text" value={formData.emergencyContactRelationship} onChange={(e) => updateField('emergencyContactRelationship', e.target.value)} className="input" placeholder="e.g., Father, Spouse" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                    <span className="flex items-center gap-1.5"><Phone size={12} /> Contact Phone *</span>
                                </label>
                                <input type="tel" required value={formData.emergencyPhone} onChange={(e) => updateField('emergencyPhone', e.target.value)} className="input" placeholder="Emergency phone number" />
                            </div>
                        </div>
                    </section>

                </form>
            </Modal>
        </MainLayout>
    );
};

export default Onboarding;
