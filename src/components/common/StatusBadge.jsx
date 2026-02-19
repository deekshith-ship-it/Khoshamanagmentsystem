import React from 'react';

const statusStyles = {
    'todo': 'badge-todo',
    'in-progress': 'badge-in-progress',
    'completed': 'badge-completed',
    'sent': 'badge-sent',
    'draft': 'badge-draft',
    'active': 'badge-active',
    'follow-up': 'badge-follow-up',
    'follow_up': 'badge-follow-up',
    'new': 'badge-new',
    'negotiation': 'badge-warning',
    'qualified': 'badge-primary',
    'proposal': 'badge-primary',
    'proposal-sent': 'badge-primary',
    'proposal_sent': 'badge-primary',
    'closed-won': 'badge-success',
    'closed_won': 'badge-success',
    'closed-lost': 'badge-danger',
    'closed_lost': 'badge-danger',
    'converted': 'badge-success',
    'viewed': 'badge-neutral',
    'accepted': 'badge-success',
    'blocked': 'badge-blocked',
    'reviewing': 'badge-reviewing',
};

const StatusBadge = ({ status, className = '' }) => {
    const normalizedStatus = status?.toLowerCase().replace(/[\s_]+/g, '-') || 'todo';
    const styleClass = statusStyles[status?.toLowerCase()] || statusStyles[normalizedStatus] || 'badge-neutral';

    const displayText = status?.replace(/[_-]/g, ' ').toUpperCase() || 'TO DO';

    return (
        <span className={`badge ${styleClass} ${className}`}>
            {displayText}
        </span>
    );
};

export default StatusBadge;
