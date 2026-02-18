import React, { useEffect, useState } from 'react';

const StatsCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    className = ''
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    // Animated count-up effect
    useEffect(() => {
        const numericValue = typeof value === 'number' ? value : parseInt(value);
        if (isNaN(numericValue)) {
            setDisplayValue(value);
            return;
        }


        const duration = 600;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(eased * numericValue));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return (
        <div className={`card card-hover p-5 lg:p-6 group ${className}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2">
                        {title}
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1 stats-value">
                        {typeof value === 'number' ? displayValue : value}
                    </h3>

                    {(subtitle || trend) && (
                        <div className="flex items-center gap-2 mt-2">
                            {trend && (
                                <span className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md ${trend > 0
                                    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
                                    : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10'
                                    }`}>
                                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                                </span>
                            )}
                            {subtitle && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                    {subtitle}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className="icon-circle-primary group-hover:scale-105 transition-transform duration-200">
                        <Icon size={22} strokeWidth={1.8} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsCard;
