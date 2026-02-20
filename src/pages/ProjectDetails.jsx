import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, StatusBadge, Modal } from '../components/common';
import { ArrowLeft, Trash2, Edit3, Plus, ChevronDown, X, Link2, Check, Globe, Server, Mail } from 'lucide-react';
import { projectsAPI, infraAPI } from '../services/api';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState([]);
    const [linkedAssets, setLinkedAssets] = useState([]);
    const [allAssets, setAllAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('todo');
    const [newNote, setNewNote] = useState('');
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newTaskData, setNewTaskData] = useState({ title: '', date: '', status: 'todo' });
    const [editFormData, setEditFormData] = useState({});
    const [selectedAsset, setSelectedAsset] = useState('');

    const fetchProjectData = useCallback(async () => {
        try {
            setLoading(true);
            const [projectData, tasksData, notesData, assetsData, allAssetsData] = await Promise.all([
                projectsAPI.getById(id),
                projectsAPI.getTasks(id),
                projectsAPI.getNotes(id),
                projectsAPI.getLinkedAssets(id),
                infraAPI.getAll()
            ]);
            setProject(projectData);
            setTasks(tasksData || []);
            setNotes(notesData || []);
            setLinkedAssets(assetsData || []);
            setAllAssets(allAssetsData || []);
            setEditFormData(projectData);
        } catch (error) {
            console.error('Error fetching project data:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProjectData();
    }, [id, fetchProjectData]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskData.title.trim()) return;

        try {
            await projectsAPI.createTask(id, {
                text: newTaskData.title,
                status: newTaskData.status || 'todo',
                project_id: id,
                notes: newTaskData.notes || '',
                dependencies: newTaskData.dependencies || '',
                credentials: newTaskData.credentials || ''
            });
            setNewTaskData({ title: '', date: '', status: 'todo', notes: '', dependencies: '', credentials: '' });
            setShowNewTaskModal(false);
            fetchProjectData();
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            await projectsAPI.updateTask(id, taskId, { status: newStatus });
            fetchProjectData();
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await projectsAPI.deleteTask(id, taskId);
            fetchProjectData();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
            await projectsAPI.createNote(id, {
                content: newNote,
                author: 'Me'
            });
            setNewNote('');
            fetchProjectData();
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const handleLinkAsset = async () => {
        if (!selectedAsset) return;

        try {
            await projectsAPI.linkAsset(id, selectedAsset);
            setSelectedAsset('');
            fetchProjectData();
        } catch (error) {
            console.error('Error linking asset:', error);
        }
    };

    const handleUnlinkAsset = async (assetId) => {
        try {
            await projectsAPI.unlinkAsset(id, assetId);
            fetchProjectData();
        } catch (error) {
            console.error('Error unlinking asset:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await projectsAPI.delete(id);
                navigate('/projects');
            } catch (error) {
                console.error('Error deleting project:', error);
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await projectsAPI.update(id, editFormData);
            setShowEditModal(false);
            fetchProjectData();
        } catch (error) {
            console.error('Error updating project:', error);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No Date';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    // Filter tasks by status
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const doingTasks = tasks.filter(t => t.status === 'in_progress');
    const doneTasks = tasks.filter(t => t.status === 'completed');

    const getFilteredTasks = () => {
        switch (activeTab) {
            case 'todo': return todoTasks;
            case 'doing': return doingTasks;
            case 'done': return doneTasks;
            default: return todoTasks;
        }
    };

    // Calculate progress
    const calculateProgress = () => {
        const totalTasks = tasks.length;
        if (totalTasks === 0) return 100;
        return Math.round((doneTasks.length / totalTasks) * 100);
    };

    // Get unlinked assets for dropdown
    const unlinkedAssets = allAssets.filter(
        asset => !linkedAssets.find(la => la.id === asset.id)
    );

    if (loading) {
        return (
            <MainLayout title="Project Details">
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"></div>
                </div>
            </MainLayout>
        );
    }

    if (!project) {
        return (
            <MainLayout title="Project Details">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Project not found</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout
            title=""
            headerAction={
                <button
                    onClick={() => navigate('/projects', { state: { openSettings: project.id } })}
                    className="btn btn-ghost text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                    Settings
                </button>
            }
        >
            {/* Back Button */}
            <button
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white mb-6 transition-colors duration-200 group"
            >
                <div className="p-1.5 rounded-lg group-hover:bg-gray-100 dark:group-hover:bg-white/[0.04] transition-colors duration-200">
                    <ArrowLeft size={18} />
                </div>
                <span className="font-medium text-sm">Back to Projects</span>
            </button>

            {/* Project Header */}
            <div className="flex items-start justify-between mb-8 page-enter">
                <div className="flex-1">
                    <h1 className="text-2xl lg:text-[28px] font-bold text-gray-900 dark:text-white mb-1 tracking-tight leading-tight">{project.title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{project.client}</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="btn btn-secondary p-2.5"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2.5 text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/15 rounded-xl transition-all duration-200"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Overall Progress */}
            <Card hover={false} className="!p-6 lg:!p-8 mb-10">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider mb-4">
                    <span className="text-gray-400 dark:text-gray-500">Overall Progress</span>
                    <span className="text-primary-600 dark:text-primary-400 text-sm font-bold">{calculateProgress()}%</span>
                </div>
                <div className="progress-bar h-3">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${calculateProgress()}%` }}
                    />
                </div>
            </Card>

            {/* Tasks Section */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Project Tasks</h2>
                    <button
                        onClick={() => setShowNewTaskModal(true)}
                        className="btn btn-primary text-xs uppercase tracking-wider py-2.5 px-4"
                    >
                        <Plus size={16} className="mr-1.5" />
                        New Task
                    </button>
                </div>

                {/* Task Tabs */}
                <div className="flex gap-1 mb-6 p-1 bg-gray-100/60 dark:bg-white/[0.04] rounded-xl inline-flex">
                    {[
                        { key: 'todo', label: 'To Do', count: todoTasks.length, color: 'text-gray-600 dark:text-gray-300' },
                        { key: 'doing', label: 'In Progress', count: doingTasks.length, color: 'text-amber-600 dark:text-amber-400' },
                        { key: 'done', label: 'Completed', count: doneTasks.length, color: 'text-emerald-600 dark:text-emerald-400' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${activeTab === tab.key
                                ? `bg-white dark:bg-dark-surface ${tab.color} shadow-sm`
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.label} <span className="ml-1 opacity-60">({tab.count})</span>
                        </button>
                    ))}
                </div>

                {/* Task List */}
                <Card padding="none" hover={false} className="overflow-hidden min-h-[300px]">
                    {getFilteredTasks().length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {getFilteredTasks().map((task) => (
                                <div
                                    key={task.id}
                                    className="p-5 flex items-center justify-between table-row-hover group/task cursor-pointer"
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateTaskStatus(
                                                    task.id,
                                                    task.status === 'completed' ? 'todo' : 'completed'
                                                );
                                            }}
                                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${task.status === 'completed'
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 bg-white dark:bg-transparent'
                                                }`}
                                        >
                                            {task.status === 'completed' && <Check size={12} strokeWidth={3} />}
                                        </button>
                                        <div>
                                            <h4 className={`font-medium text-sm transition-all duration-200 ${task.status === 'completed'
                                                ? 'text-gray-400 dark:text-gray-500 line-through'
                                                : 'text-gray-900 dark:text-white'
                                                }`}>{task.text || task.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <StatusBadge status={task.status} />
                                                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{task.created_at ? new Date(task.created_at).toLocaleDateString() : 'No Date'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover/task:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
                                        <TaskStatusDropdown
                                            status={task.status}
                                            onChange={(newStatus) => handleUpdateTaskStatus(task.id, newStatus)}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center text-gray-400 dark:text-gray-500">
                            <div className="w-14 h-14 bg-gray-50 dark:bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Check size={28} className="opacity-20" />
                            </div>
                            <p className="text-sm font-medium">No tasks in this category</p>
                            <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">Create a new task to get started</p>
                        </div>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                {/* Left Column: Team Activity */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 tracking-tight">Team Sync</h2>
                        <Card hover={false} padding="none" className="flex flex-col h-[600px]">
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-5">
                                {notes.length > 0 ? (
                                    notes.map((note) => (
                                        <div key={note.id} className="flex justify-end">
                                            <div className="flex flex-col items-end max-w-[90%]">
                                                <div className="bg-primary-50 dark:bg-primary-500/[0.08] border border-primary-100/60 dark:border-primary-500/10 rounded-2xl rounded-tr-md px-4 py-3">
                                                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed font-medium">{note.content}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5 px-1">
                                                    <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{note.author}</span>
                                                    <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                                                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                        {formatTime(note.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                                        <p className="text-sm font-medium">No activity recorded</p>
                                        <p className="text-xs mt-1">Share an update with the team</p>
                                    </div>
                                )}
                            </div>

                            {/* Note Input */}
                            <form onSubmit={handleAddNote} className="flex gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
                                <input
                                    type="text"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Type an update..."
                                    className="input bg-gray-50 dark:bg-white/[0.03] border-0 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 placeholder:text-gray-400"
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary px-3 aspect-square flex items-center justify-center rounded-xl"
                                    disabled={!newNote.trim()}
                                >
                                    <ArrowLeft className="rotate-180" size={18} />
                                </button>
                            </form>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Infrastructure Assets */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Infrastructure Assets</h2>
                        <button
                            onClick={() => navigate('/infra/add')}
                            className="text-xs font-bold text-primary-500 hover:text-primary-600 uppercase tracking-widest flex items-center gap-1"
                        >
                            <Plus size={14} />
                            Create New
                        </button>
                    </div>
                    <Card hover={false} className="!p-6">
                        {/* Link Asset Controls */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 bg-gray-50/80 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="relative flex-1 w-full text-gray-900 dark:text-white">
                                <select
                                    value={selectedAsset}
                                    onChange={(e) => setSelectedAsset(e.target.value)}
                                    className="input bg-white dark:bg-dark-surface w-full appearance-none cursor-pointer"
                                >
                                    <option value="">Link existing infrastructure...</option>
                                    {unlinkedAssets.map((asset) => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.name} ({asset.type})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <button
                                onClick={handleLinkAsset}
                                disabled={!selectedAsset}
                                className="btn btn-primary w-full sm:w-auto px-8 text-xs uppercase tracking-wider disabled:opacity-40"
                            >
                                Link Asset
                            </button>
                        </div>

                        {/* Linked Assets List */}
                        {linkedAssets.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {linkedAssets.map((asset) => {
                                    const Icon = asset.type === 'DOMAIN' ? Globe : (asset.type === 'SERVER' ? Server : (asset.type === 'EMAIL' ? Mail : Link2));
                                    return (
                                        <div
                                            key={asset.id}
                                            className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 flex items-center justify-between group/asset hover:border-primary-500/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                            onClick={() => navigate(`/infra/${asset.id}`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                                    <Icon size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{asset.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{asset.type}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                                                        <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUnlinkAsset(asset.id); }}
                                                className="p-2 text-gray-300 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-lg transition-all opacity-0 group-hover/asset:opacity-100"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-50/50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                                <Globe size={40} className="mx-auto mb-4 text-gray-300 dark:text-gray-700 opacity-50" />
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No infrastructure linked</p>
                                <p className="text-xs text-gray-400 mt-1">Connect domains or servers to this project</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* New Task Modal */}
            <Modal
                isOpen={showNewTaskModal}
                onClose={() => setShowNewTaskModal(false)}
                title="New Task"
                maxWidth="max-w-md"
                footer={
                    <div className="flex gap-3 w-full">
                        <button
                            type="button"
                            onClick={() => setShowNewTaskModal(false)}
                            className="flex-1 btn btn-secondary text-sm"
                        >
                            Cancel
                        </button>
                        <button type="submit" form="new-task-form" className="flex-1 btn btn-primary text-sm">
                            Add Task
                        </button>
                    </div>
                }
            >
                <form id="new-task-form" onSubmit={handleAddTask}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Task Title *</label>
                            <input
                                type="text"
                                required
                                value={newTaskData.title}
                                onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                                className="input"
                                placeholder="What needs to be done?"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due Date</label>
                            <input
                                type="date"
                                value={newTaskData.date}
                                onChange={(e) => setNewTaskData({ ...newTaskData, date: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                            <select
                                value={newTaskData.status}
                                onChange={(e) => setNewTaskData({ ...newTaskData, status: e.target.value })}
                                className="input appearance-none cursor-pointer"
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Edit Project Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Project"
                maxWidth="max-w-md"
                footer={
                    <div className="flex gap-3 w-full">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 btn btn-secondary text-sm"
                        >
                            Cancel
                        </button>
                        <button type="submit" form="edit-project-form" className="flex-1 btn btn-primary text-sm">
                            Save Changes
                        </button>
                    </div>
                }
            >
                <form id="edit-project-form" onSubmit={handleUpdate}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                            <input
                                type="text"
                                required
                                value={editFormData.title || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Client</label>
                            <input
                                type="text"
                                value={editFormData.client || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, client: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assignee</label>
                            <input
                                type="text"
                                value={editFormData.assignee || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, assignee: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                            <select
                                value={editFormData.status || 'in_progress'}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                className="input appearance-none cursor-pointer"
                            >
                                <option value="in_progress">In Progress</option>
                                <option value="on_hold">On Hold</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
};

// Task Status Dropdown Component
const TaskStatusDropdown = ({ status, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const statusLabels = {
        'todo': 'To Do',
        'in_progress': 'In Progress',
        'completed': 'Completed'
    };

    const getStatusClass = (s) => {
        switch (s) {
            case 'completed':
                return 'text-emerald-600 dark:text-emerald-400';
            case 'in_progress':
                return 'text-amber-600 dark:text-amber-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getStatusBg = (s) => {
        switch (s) {
            case 'completed':
                return 'bg-emerald-50 dark:bg-emerald-500/10';
            case 'in_progress':
                return 'bg-amber-50 dark:bg-amber-500/10';
            default:
                return 'bg-gray-100 dark:bg-gray-800';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 uppercase tracking-wider ${getStatusClass(status)} ${getStatusBg(status)}`}
            >
                {statusLabels[status] || 'To Do'}
                <ChevronDown size={10} strokeWidth={2.5} />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-dark-surface border border-gray-200/60 dark:border-dark-border rounded-xl z-20 min-w-[120px] overflow-hidden dropdown-enter"
                        style={{ boxShadow: '0 8px 24px -6px rgba(0,0,0,0.1), 0 4px 8px -4px rgba(0,0,0,0.04)' }}
                    >
                        {['todo', 'in_progress', 'completed'].map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    onChange(s);
                                    setIsOpen(false);
                                }}
                                className={`block w-full text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150 ${getStatusClass(s)} hover:bg-gray-50 dark:hover:bg-white/[0.04] ${status === s
                                    ? `${getStatusBg(s)} font-bold`
                                    : ''
                                    }`}
                            >
                                {statusLabels[s]}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ProjectDetails;
