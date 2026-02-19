import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, StatusBadge, FloatingAddButton } from '../components/common';
import { Trash2, Plus, CheckCircle, Circle, Folder } from 'lucide-react';
import { tasksAPI } from '../services/api';

const GeneralTasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, PROJECT, GENERAL

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

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await tasksAPI.delete(id);
                fetchTasks();
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    const handleStatusToggle = async (e, task) => {
        e.stopPropagation();
        let newStatus = 'todo';
        if (task.status === 'todo') newStatus = 'in_progress';
        if (task.status === 'in_progress') newStatus = 'completed';

        try {
            // Optimistic update
            const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
            setTasks(updatedTasks);
            await tasksAPI.update(task.id, { ...task, status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
            fetchTasks(); // Revert on error
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'PROJECT') return task.project_id;
        if (filter === 'GENERAL') return !task.project_id;
        return true;
    });

    const getStatusIcon = (status) => {
        if (status === 'completed') return <CheckCircle size={20} className="text-green-500" />;
        if (status === 'in_progress') return <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />;
        return <Circle size={20} className="text-gray-300 dark:text-gray-600 hover:text-primary-500 transition-colors" />;
    };

    return (
        <MainLayout
            title="Task Management"
            headerAction={
                <Link to="/tasks/add" className="btn btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add Task</span>
                </Link>
            }
        >
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl w-fit">
                {['ALL', 'PROJECT', 'GENERAL'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === type
                            ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                            : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        {type} TASKS
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">Loading tasks...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            className="bg-white dark:bg-card-bg p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 transition-all cursor-pointer group shadow-sm hover:shadow-md flex items-center gap-4"
                        >
                            {/* Status Toggle */}
                            <button
                                onClick={(e) => handleStatusToggle(e, task)}
                                className="p-1 shrink-0"
                            >
                                {getStatusIcon(task.status)}
                            </button>

                            {/* Task Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold text-gray-900 dark:text-gray-100 truncate ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                                    {task.text || task.title}
                                </h3>

                                {task.project_id && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Folder size={12} className="text-indigo-500" />
                                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                                            {task.project_name || 'Linked Project'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <StatusBadge status={task.status} />
                                <button
                                    onClick={(e) => handleDelete(e, task.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredTasks.length === 0 && (
                        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
                            <p>No tasks found.</p>
                        </div>
                    )}
                </div>
            )}

            <FloatingAddButton onClick={() => navigate('/tasks/add')} />
        </MainLayout>
    );
};

export default GeneralTasks;
