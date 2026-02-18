import React from 'react';

const statusStyles = {
    'todo': 'badge-todo',
    'in-progress': 'badge-in-progress',
    'completed': 'badge-completed',
    'sent': 'badge-sent',
    'draft': 'badge-draft',
    'active': 'badge-active',
    'follow-up': 'badge-follow-up',
    'new': 'badge-new',
    'negotiation': 'badge-warning',
    'qualified': 'badge-primary',
    'proposal-sent': 'badge-sent',
    'closed-won': 'badge-success',
    'closed-lost': 'badge-danger',
    'converted': 'badge-success', // Keep for compatibility
    'completed': 'badge-success', // Keep for compatibility
    'viewed': 'badge-neutral',
    'accepted': 'badge-success',
    'blocked': 'badge-blocked',
    'reviewing': 'badge-reviewing',
};

const StatusBadge = ({ status, className = '' }) => {
    const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '-') || 'todo';
    const styleClass = statusStyles[normalizedStatus] || 'badge-neutral';

    const displayText = status?.replace(/-/g, ' ').toUpperCase() || 'TO DO';

    return (
        <span className={`badge ${styleClass} ${className}`}>
            {displayText}
        </span>
    );
};

export default StatusBadge;
