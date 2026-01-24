/**
 * Reusable Page Header Component
 * 
 * Provides consistent page titles and descriptions across all pages.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cardVariants, transitions } from '../../lib/motion';

const PageHeader = React.memo(({
    title,
    description,
    actions,
    className,
}) => {
    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={transitions.default}
            className={`flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 ${className || ''}`}
        >
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {title}
                </h1>
                {description && (
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {description}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </motion.div>
    );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
