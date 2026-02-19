import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card, StatusBadge } from '../components/common';
import { tasksAPI } from '../services/api';
import EditTaskModal from '../components/tasks/EditTaskModal';
import { ArrowLeft, CheckCircle, Circle, Folder, Send, User, Trash2, Edit } from 'lucide-react';

const TaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subtaskTitle, setSubtaskTitle] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchTask();
    }, [id]);

    const fetchTask = async () => {
        try {
            setLoading(true);
            const data = await tasksAPI.getById(id);
            setTask(data);
        } catch (error) {
            console.error('Error fetching task:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTask = async (updatedData) => {
        try {
            await tasksAPI.update(id, updatedData);
            setTask({ ...task, ...updatedData });
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleDeleteTaskFunc = async () => {
        try {
            await tasksAPI.delete(id);
            navigate(-1);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleStatusToggle = async () => {
        const newStatus = task.status === 'completed' ? 'todo' : 'completed';
        try {
            setTask({ ...task, status: newStatus }); // Optimistic update
            await tasksAPI.update(id, { ...task, status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
            fetchTask(); // Revert
        }
    };

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        if (!subtaskTitle.trim()) return;

        try {
            const newSubtask = await tasksAPI.addSubtask(id, subtaskTitle);
            setTask(prev => ({ ...prev, subtasks: [...prev.subtasks, newSubtask] }));
            setSubtaskTitle('');
        } catch (error) {
            console.error('Error adding subtask:', error);
        }
    };

    const handleToggleSubtask = async (subtaskId, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        try {
            // Optimistic
            setTask(prev => ({
                ...prev,
                subtasks: prev.subtasks.map(s => s.id === subtaskId ? { ...s, is_completed: newStatus } : s)
            }));
            await tasksAPI.updateSubtask(id, subtaskId, newStatus);
        } catch (error) {
            console.error('Error updating subtask:', error);
        }
    };

    const handleDeleteSubtask = async (subtaskId) => {
        try {
            await tasksAPI.deleteSubtask(id, subtaskId);
            setTask(prev => ({
                ...prev,
                subtasks: prev.subtasks.filter(s => s.id !== subtaskId)
            }));
        } catch (error) {
            console.error('Error deleting subtask:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        try {
            const newComment = await tasksAPI.addComment(id, comment, 'U'); // 'U' is user initials placeholder
            setTask(prev => ({ ...prev, comments: [newComment, ...prev.comments] }));
            setComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    if (loading) return <MainLayout><div className="p-8 text-center text-gray-500">Loading task...</div></MainLayout>;
    if (!task) return <MainLayout><div className="p-8 text-center text-gray-500">Task not found</div></MainLayout>;

    return (
        <MainLayout title="">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6">
                    <ArrowLeft size={18} /> Back
                </button>

                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className={`text-2xl font-bold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                {task.text || task.title}
                            </h1>
                            <StatusBadge status={task.status} />
                        </div>
                        {task.project_id && (
                            <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={() => navigate(`/projects/${task.project_id}`)}>
                                <Folder size={16} className="text-indigo-500" />
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{task.project_name}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="btn btn-secondary text-gray-600 hover:text-primary-600"
                            title="Edit task"
                        >
                            <Edit size={18} />
                        </button>
                        <button
                            onClick={handleStatusToggle}
                            className={`btn flex items-center gap-2 ${task.status === 'completed' ? 'btn-secondary text-green-600' : 'btn-primary'}`}
                        >
                            {task.status === 'completed' ? <CheckCircle size={18} /> : <Circle size={18} />}
                            {task.status === 'completed' ? 'Completed' : 'Mark Complete'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT CONTENT */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Notes, Dependencies, Credentials */}
                        <div className="space-y-4">
                            {task.notes && (
                                <Card title="Notes">
                                    <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">{task.notes}</p>
                                </Card>
                            )}
                            {task.dependencies && (
                                <Card title="Dependencies">
                                    <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">{task.dependencies}</p>
                                </Card>
                            )}
                            {task.credentials && (
                                <Card title="Credentials">
                                    <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 font-mono text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">{task.credentials}</p>
                                </Card>
                            )}
                        </div>

                        {/* Subtasks */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Subtasks</h3>
                            <div className="space-y-2 mb-4">
                                {task.subtasks?.map(subtask => (
                                    <div key={subtask.id} className="flex items-center gap-3 bg-white dark:bg-card-bg p-3 rounded-xl border border-gray-100 dark:border-gray-800 group">
                                        <button onClick={() => handleToggleSubtask(subtask.id, subtask.is_completed)} className="text-gray-400 hover:text-green-500">
                                            {subtask.is_completed ? <CheckCircle size={20} className="text-green-500" /> : <Circle size={20} />}
                                        </button>
                                        <span className={`flex-1 text-sm font-medium ${subtask.is_completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {subtask.title}
                                        </span>
                                        <button onClick={() => handleDeleteSubtask(subtask.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleAddSubtask} className="flex gap-2">
                                <input
                                    type="text"
                                    className="input py-2 text-sm"
                                    placeholder="Add a subtask..."
                                    value={subtaskTitle}
                                    onChange={e => setSubtaskTitle(e.target.value)}
                                />
                                <button type="submit" disabled={!subtaskTitle.trim()} className="btn btn-secondary py-2 px-4">Add</button>
                            </form>
                        </div>

                        {/* Comments */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Comments</h3>
                            <div className="space-y-4 mb-6">
                                {task.comments?.map(c => (
                                    <div key={c.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
                                            {c.user_initials}
                                        </div>
                                        <div className="flex-1 bg-white dark:bg-card-bg p-4 rounded-xl rounded-tl-none border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <p className="text-sm text-gray-700 dark:text-gray-200">{c.text}</p>
                                            <p className="text-[10px] text-gray-400 mt-2">{new Date(c.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleAddComment} className="flex gap-2 items-start">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">
                                    U
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        className="input min-h-[80px] pr-10 resize-none"
                                        placeholder="Write a comment..."
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddComment(e);
                                            }
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!comment.trim() || isSubmittingComment}
                                        className="absolute bottom-3 right-3 p-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>

            <EditTaskModal
                task={task}
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTaskFunc}
            />
        </MainLayout>
    );
};

export default TaskDetails;
