import React from 'react';

const Card = ({
    children,
    className = '',
    hover = true,
    padding = 'default',
    onClick
}) => {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        default: 'p-5 lg:p-6',
        lg: 'p-6 lg:p-7',
        xl: 'p-8',
    };

    return (
        <div
            className={`
                card
                ${paddingClasses[padding]}
                ${hover ? 'card-hover' : ''}
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
