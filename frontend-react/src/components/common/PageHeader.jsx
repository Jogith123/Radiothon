/**
 * Reusable Page Header Component
 * 
 * Provides consistent page titles and descriptions across all pages.
 */

import React from 'react';

const PageHeader = React.memo(({
    title,
    description,
    actions,
    className,
}) => {
    return (
        <div
            className={`flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 ${className || ''}`}
        >
            <div>
                <h1 className="text-2xl font-semibold text-[#111827]">
                    {title}
                </h1>
                {description && (
                    <p className="text-[#6B7280] mt-1 text-sm">
                        {description}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
