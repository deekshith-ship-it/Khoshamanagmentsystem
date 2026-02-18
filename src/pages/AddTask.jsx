import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import { X } from 'lucide-react';

const AddTask = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignee: 'Nischal',
        status: 'To Do',
        priority: 'Medium',
        date: new Date().toISOString().split('T')[0]
    });

    // Handle background scroll lock
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const statusMap = { 'To Do': 'todo', 'In Progress': 'in-progress', 'Completed': 'completed' };
            await tasksAPI.create({
                ...formData,
                status: statusMap[formData.status] || formData.status.toLowerCase()
            });
            navigate('/tasks');
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Immersive Modal Overlay */}
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                {/* Backdrop Blur */}
                <div
                    className="absolute inset-0 bg-black/60 transition-all duration-300"
                    onClick={() => navigate('/tasks')}
                ></div>

                {/* Main Card Container */}
                <div className="relative z-[1010] w-full max-w-2xl max-h-[85vh] bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border flex flex-col overflow-hidden animate-enter">

                    {/* FIXED HEADER */}
                    <div className="flex-shrink-0 p-6 flex items-center justify-between bg-white dark:bg-dark-surface z-20 border-b border-gray-100 dark:border-dark-border">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">New General Task</h2>
                        <button
                            onClick={() => navigate('/tasks')}
                            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-all rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* SCROLLABLE BODY */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-dark-surface custom-scrollbar scrollbar-thin">
                        <form id="add-task-form" onSubmit={handleSubmit} className="space-y-4">
                            {/* Task Title */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Weekly Report, Server Maintenance"
                                    className="input"
                                />
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input min-h-[100px] resize-none"
                                    placeholder="Add more details about this task..."
                                />
                            </div>

                            {/* Assigned To */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Assigned To
                                </label>
                                <select
                                    value={formData.assignee}
                                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                    className="input appearance-none cursor-pointer"
                                >
                                    <option value="Nischal">Nischal</option>
                                    <option value="Ankith">Ankith</option>
                                    <option value="Deekshi">Deekshi</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="input appearance-none cursor-pointer"
                                >
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>

                            {/* Priority */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Priority
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="input appearance-none cursor-pointer"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            {/* Due Date */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </form>
                    </div>

                    {/* FIXED FOOTER */}
                    <div className="flex-shrink-0 p-6 bg-gray-50/50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border z-20">
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/tasks')}
                                className="btn btn-secondary text-xs uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="add-task-form"
                                disabled={loading}
                                className="btn btn-primary px-8 text-xs uppercase tracking-wider"
                            >
                                {loading ? 'Creating...' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddTask;
