import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Global Modal Component
 * 
 * @param {boolean} isOpen - Current visibility state
 * @param {string} title - Modal title (Header)
 * @param {React.ReactNode} children - Modal body content
 * @param {Function} onClose - Function to close the modal
 * @param {string} maxWidth - Optional max-width class (default: max-w-2xl)
 * @param {React.ReactNode} footer - Optional footer content (buttons)
 * @param {boolean} isLoading - Optional loading state for overlay
 */
const Modal = ({ isOpen, title, children, onClose, maxWidth = 'max-w-2xl', footer, isLoading = false }) => {

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className={`relative w-full ${maxWidth} bg-white dark:bg-card-bg rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-enter overflow-hidden`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-card-bg sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-end gap-3 sticky bottom-0 z-10">
                        {footer}
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
