import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, Avatar, StatusBadge, FloatingAddButton } from '../components/common';
import { Clock, X, Plus } from 'lucide-react';
import { projectsAPI } from '../services/api';

const projectFilters = [
    { value: 'all', label: 'All' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'reviewing', label: 'Reviewing' },
];

const Projects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', client: '', status: 'in-progress', assignee: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await projectsAPI.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await projectsAPI.create(formData);
            setShowModal(false);
            setFormData({ title: '', client: '', status: 'in-progress', assignee: '' });
            fetchProjects();
        } catch (error) {
            console.error('Error creating project:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await projectsAPI.delete(id);
                fetchProjects();
            } catch (error) {
                console.error('Error deleting project:', error);
            }
        }
    };

    const filteredProjects = filter === 'all'
        ? projects
        : projects.filter(p => p.status === filter);

    return (
        <MainLayout
            title="Active Projects"
            headerAction={
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary py-2.5 px-5 rounded-xl flex items-center gap-2"
                    aria-label="Add new project"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    <span className="hidden sm:inline text-sm font-semibold">New Project</span>
                </button>
            }
        >
            {/* Filter Navigation */}
            <div className="mb-8 overflow-x-auto custom-scrollbar">
                <nav className="flex items-center gap-1.5 min-w-max">
                    {projectFilters.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilter(tab.value)}
                            className={`filter-pill ${filter === tab.value ? 'active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {loading ? (
                <Card hover={false} className="text-center py-16 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading projects...</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
                    {filteredProjects.map((project) => (
                        <Card
                            key={project.id}
                            padding="none"
                            className="overflow-hidden group"
                            onClick={() => navigate(`/projects/${project.id}`)}
                        >
                            {/* Card Header Area */}
                            <div className="h-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-dark-surface border-b border-gray-100 dark:border-gray-800 relative p-5 flex items-end">
                                <div className="flex items-center gap-2.5">
                                    <Avatar name={project.assignee || 'User'} size="xs" color="primary" />
                                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-100/80 dark:border-gray-700/50">
                                        {project.assignee || 'Unassigned'}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(project.id);
                                    }}
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 border border-gray-100 dark:border-gray-700"
                                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="p-5 lg:p-6">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-[15px] leading-snug line-clamp-2">
                                        {project.title}
                                    </h3>
                                    <StatusBadge status={project.status} className="shrink-0 text-[10px]" />
                                </div>
                                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-5">{project.client}</p>

                                {/* Progress Bar */}
                                <div className="mb-5">
                                    <div className="flex items-center justify-between text-[11px] font-semibold mb-2">
                                        <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Progress</span>
                                        <span className="text-primary-600 dark:text-primary-400">{project.progress || 0}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${project.progress || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    <Clock size={14} className="text-gray-400" />
                                    <span>{project.tasks || 0} tasks remaining</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {filteredProjects.length === 0 && !loading && (
                <Card hover={false} className="text-center py-16">
                    <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">No projects found</p>
                </Card>
            )}

            <FloatingAddButton onClick={() => setShowModal(true)} />

            {/* Add Project Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border w-full max-w-md p-6 relative animate-enter"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Project</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="input"
                                        placeholder="Project title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Client</label>
                                    <input
                                        type="text"
                                        value={formData.client}
                                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                        className="input"
                                        placeholder="Client name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assignee</label>
                                    <input
                                        type="text"
                                        value={formData.assignee}
                                        onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                        className="input"
                                        placeholder="Assign to"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                                    <div className="relative">
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="input appearance-none cursor-pointer"
                                        >
                                            <option value="in-progress">In Progress</option>
                                            <option value="blocked">Blocked</option>
                                            <option value="reviewing">Reviewing</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 btn btn-secondary text-sm"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn btn-primary text-sm">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default Projects;
