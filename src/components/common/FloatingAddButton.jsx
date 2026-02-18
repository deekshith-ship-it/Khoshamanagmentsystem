import React from 'react';
import { Plus } from 'lucide-react';

const FloatingAddButton = ({ onClick, className = '' }) => {
    return (
        <button
            onClick={onClick}
            className={`fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 p-4 rounded-full bg-primary-600 text-white shadow-lg hover:shadow-xl hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all duration-300 ${className}`}
            aria-label="Add new item"
        >
            <Plus size={24} strokeWidth={2.5} />
        </button>
    );
};

export default FloatingAddButton;
