import React from 'react';

const FilterPills = ({ options, value, onChange, className = '' }) => {
    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`filter-pill ${isActive ? 'active' : ''}`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};

export default FilterPills;
