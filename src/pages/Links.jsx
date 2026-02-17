import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/common';
import { Link2, Eye, ExternalLink } from 'lucide-react';
import { linksAPI } from '../services/api';

const Links = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [leadName, setLeadName] = useState('');
    const [destinationUrl, setDestinationUrl] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchLinks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await linksAPI.getAll();
            setLinks(data);
        } catch (error) {
            console.error('Error fetching links:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setCreating(true);
            await linksAPI.create({ lead_name: leadName, destination_url: destinationUrl });
            setLeadName('');
            setDestinationUrl('');
            fetchLinks();
        } catch (error) {
            console.error('Error creating link:', error);
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <MainLayout title="Tracking Links">
            <div className="max-w-5xl page-enter">
                {/* Create Link Form */}
                <Card className="mb-10">
                    <div className="flex items-center gap-2 mb-6">
                        <Link2 size={20} className="text-primary-500" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Create New Link</h2>
                    </div>
                    <form onSubmit={handleCreate} className="flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 w-full space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Lead Name</label>
                            <input
                                type="text"
                                required
                                value={leadName}
                                onChange={(e) => setLeadName(e.target.value)}
                                className="input"
                                placeholder="Enter lead name"
                            />
                        </div>
                        <div className="flex-1 w-full space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Destination URL</label>
                            <input
                                type="url"
                                required
                                value={destinationUrl}
                                onChange={(e) => setDestinationUrl(e.target.value)}
                                className="input"
                                placeholder="https://example.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            className="btn btn-primary px-8 py-2.5 text-xs uppercase tracking-wider font-bold whitespace-nowrap"
                        >
                            {creating ? 'Creating...' : 'Create Link'}
                        </button>
                    </form>
                </Card>

                {/* Links Table */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">All Links</h2>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {links.length} total
                    </span>
                </div>

                {loading ? (
                    <div className="card flex flex-col items-center justify-center py-32 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading links...</p>
                    </div>
                ) : (
                    <Card padding="none" className="overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Lead</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tracking URL</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Views</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Created</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {links.map((link) => (
                                    <tr key={link.id} className="border-b border-gray-50 dark:border-gray-800/50 table-row-hover group">
                                        <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">{link.lead_name}</td>
                                        <td className="p-4">
                                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[260px] inline-block">
                                                {link.tracking_url || link.short_url || '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Eye size={14} className="text-gray-400" />
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{link.views || 0}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-medium text-gray-400">{formatDate(link.created_at)}</td>
                                        <td className="p-4 text-center">
                                            <a
                                                href={link.destination_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all inline-flex items-center justify-center"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {links.length === 0 && (
                            <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                                <Link2 size={32} className="mx-auto mb-4 opacity-30" />
                                <p className="font-medium">No tracking links yet</p>
                                <p className="text-xs mt-1">Create your first link above</p>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </MainLayout>
    );
};

export default Links;
