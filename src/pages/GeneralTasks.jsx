import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, Avatar, StatusBadge, FloatingAddButton } from '../components/common';
import { Pencil, Trash2, Calendar, Plus } from 'lucide-react';
import { tasksAPI } from '../services/api';

const GeneralTasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigneeFilter, setAssigneeFilter] = useState('All Assignees');
    const [sourceFilter, setSourceFilter] = useState('ALL');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await tasksAPI.getAll();
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (task) => {
        if (task.source === 'project') {
            alert('Project tasks must be managed from their respective project details page.');
            return;
        }

        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await tasksAPI.delete(task.id);
                fetchTasks();
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    const allAssignees = ['All Assignees', ...new Set(tasks.map(t => t.assignee).filter(Boolean))];

    const sourceFilters = ['ALL', 'PROJECT TASKS', 'GENERAL TASKS'];

    const filteredTasks = tasks.filter(task => {
        const matchesAssignee = assigneeFilter === 'All Assignees' || task.assignee === assigneeFilter;
        let matchesSource = true;
        if (sourceFilter === 'PROJECT TASKS') matchesSource = task.source === 'project';
        if (sourceFilter === 'GENERAL TASKS') matchesSource = task.source === 'general';
        return matchesAssignee && matchesSource;
    });

    return (
        <MainLayout
            title="General Tasks"
            headerAction={
                <Link to="/tasks/add" className="btn btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    Add Task
                </Link>
            }
        >
            {/* Source Filter Tabs - Part 2 Enhancement */}
            <div className="bg-white/50 dark:bg-dark-surface/50 rounded-xl border border-gray-100 dark:border-dark-border p-1.5 mb-6 inline-flex overflow-x-auto max-w-full">
                {sourceFilters.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSourceFilter(tab)}
                        className={`px-6 py-2.5 rounded-lg text-[11px] font-bold tracking-widest transition-all duration-300 min-w-max ${sourceFilter === tab
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Assignee Filter Bar */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto custom-scrollbar pb-1">
                {allAssignees.map((name) => (
                    <button
                        key={name}
                        onClick={() => setAssigneeFilter(name)}
                        className={`filter-pill ${assigneeFilter === name ? 'active' : ''}`}
                    >
                        {name}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="card flex flex-col items-center justify-center py-32 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading tasks...</p>
                </div>
            ) : (
                <div className="space-y-4 stagger-children">
                    {filteredTasks.map((task) => (
                        <Card key={task.id} className="group card-hover flex items-center justify-between hover:border-primary-200 dark:hover:border-primary-900/50 transition-all border-l-4" style={{ borderLeftColor: task.source === 'project' ? '#6366f1' : 'transparent' }}>
                            <div className="flex items-center gap-6 min-w-0 flex-1">
                                <Avatar name={task.assignee} size="md" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{task.title}</h3>
                                        {task.source === 'project' && (
                                            <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded tracking-widest uppercase">
                                                ASSIGNED TO PROJECT
                                            </span>
                                        )}
                                    </div>
                                    {task.source === 'project' && (
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 font-medium">
                                            Project: <span className="text-primary-600 dark:text-primary-400 font-bold">{task.project_title}</span>
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">{task.assignee}</span>
                                        </div>
                                        {task.date && (
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 font-medium italic">
                                                <Calendar size={10} /> {task.date}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <StatusBadge status={task.status} />
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {task.source === 'general' && (
                                        <button
                                            onClick={() => alert('Edit coming soon!')}
                                            className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(task)}
                                        className="p-2 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredTasks.length === 0 && (
                        <div className="text-center py-24 bg-gray-50/50 dark:bg-dark-surface rounded-2xl border border-dashed border-gray-200 dark:border-dark-border">
                            <p className="text-gray-800 dark:text-gray-200 font-medium mb-2 text-lg">No tasks found in this view</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto mb-8">Try changing your filters or create a new general task.</p>
                            <Link to="/tasks/add" className="btn btn-primary inline-flex items-center gap-2 px-8">
                                <Plus size={18} />
                                Create New Task
                            </Link>
                        </div>
                    )}
                </div>
            )}
            <FloatingAddButton onClick={() => navigate('/tasks/add')} />
        </MainLayout>
    );
};

export default GeneralTasks;
