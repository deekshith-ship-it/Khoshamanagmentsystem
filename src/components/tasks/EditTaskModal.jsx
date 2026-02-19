import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

const EditTaskModal = ({ task, isOpen, onClose, onUpdate, onDelete }) => {
    const [formData, setFormData] = useState({
        text: '',
        notes: '',
        dependencies: '',
        credentials: '',
        status: 'todo',
        project_id: ''
    });

    useEffect(() => {
        if (task) {
            setFormData({
                text: task.text || task.title || '',
                notes: task.notes || '',
                dependencies: task.dependencies || '',
                credentials: task.credentials || '',
                status: task.status || 'todo',
                project_id: task.project_id || ''
            });
        }
    }, [task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        onUpdate({ ...task, ...formData });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-enter">
            <div className="bg-white dark:bg-card-bg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Edit Task</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Task Title</label>
                        <input
                            type="text"
                            required
                            value={formData.text}
                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            className="input w-full"
                            placeholder="What needs to be done?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="input w-full appearance-none"
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="input w-full min-h-[100px] resize-y"
                            placeholder="Add detailed notes..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dependencies</label>
                        <textarea
                            value={formData.dependencies}
                            onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
                            className="input w-full min-h-[60px] resize-y"
                            placeholder="List any dependencies..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Credentials / Access</label>
                        <textarea
                            value={formData.credentials}
                            onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                            className="input w-full min-h-[60px] font-mono text-sm resize-y"
                            placeholder="Any credentials needed..."
                        />
                    </div>

                    <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this task?')) {
                                        onDelete();
                                    }
                                }}
                                className="btn btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mr-auto"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary flex items-center gap-2">
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTaskModal;
