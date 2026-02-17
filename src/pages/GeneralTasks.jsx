import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, Avatar, StatusBadge } from '../components/common';
import { Pencil, Trash2, Calendar, Plus } from 'lucide-react';
import { tasksAPI } from '../services/api';

const GeneralTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigneeFilter, setAssigneeFilter] = useState('All Assignees');

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

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await tasksAPI.delete(id);
                fetchTasks();
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    const allAssignees = ['All Assignees', ...new Set(tasks.map(t => t.assignee).filter(Boolean))];

    const filteredTasks = assigneeFilter === 'All Assignees'
        ? tasks
        : tasks.filter(t => t.assignee === assigneeFilter);

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
            {/* Filter Bar */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto custom-scrollbar">
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
                        <Card key={task.id} className="group card-hover flex items-center justify-between hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                <Avatar name={task.assignee} size="md" />
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{task.title}</h3>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{task.assignee}</span>
                                        {task.date && (
                                            <>
                                                <span className="text-gray-200 dark:text-gray-700">•</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                    <Calendar size={11} /> {task.date}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <StatusBadge status={task.status} />
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => alert('Edit coming soon!')}
                                        className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(task.id)}
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No tasks found.</p>
                            <Link to="/tasks/add" className="btn btn-primary mt-6 inline-flex items-center gap-2">
                                <Plus size={18} />
                                Create First Task
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </MainLayout>
    );
};

export default GeneralTasks;
