import React from 'react';
import { Search } from 'lucide-react';

const SearchInput = ({
    placeholder = 'Search...',
    value,
    onChange,
    className = ''
}) => {
    return (
        <div className={`relative ${className}`}>
            <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                strokeWidth={2}
            />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="search-input w-full"
            />
        </div>
    );
};

export default SearchInput;
