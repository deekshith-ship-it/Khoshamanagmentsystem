import React from 'react';

const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
};

const colorClasses = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
    primary: 'bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300',
    success: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    warning: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
};

const Avatar = ({
    name = '',
    size = 'md',
    color = 'default',
    image,
    showStatus = false,
    isOnline = false,
    className = ''
}) => {
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div className={`relative inline-flex ${className}`}>
            {image ? (
                <img
                    src={image}
                    alt={name}
                    className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white dark:ring-gray-900`}
                />
            ) : (
                <div
                    className={`
                        ${sizeClasses[size]}
                        ${colorClasses[color]}
                        rounded-full flex items-center justify-center font-semibold
                        ring-2 ring-white/80 dark:ring-gray-900/80
                    `}
                >
                    {getInitials(name)}
                </div>
            )}

            {showStatus && (
                <span
                    className={`
                        absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900
                        ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}
                    `}
                    style={isOnline ? { boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)' } : {}}
                />
            )}
        </div>
    );
};

export default Avatar;
