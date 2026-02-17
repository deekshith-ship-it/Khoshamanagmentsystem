import React from 'react';
import { Plus } from 'lucide-react';

const FloatingAddButton = ({ onClick, className = '' }) => {
    return (
        <button
            onClick={onClick}
            className={`fab ${className}`}
            aria-label="Add new item"
        >
            <Plus size={24} strokeWidth={2.5} />
        </button>
    );
};

export default FloatingAddButton;
