/**
 * MetricCard Component
 * Displays a single metric with icon, value, trend indicator, and animations.
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cardVariants, cardHover, transitions } from '../../lib/motion';

const MetricCard = React.memo(({ title, value, trend, suffix = '', icon: Icon, color = 'primary' }) => {
    const isPositive = trend > 0;

    const colorMap = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        purple: 'bg-purple-500/10 text-purple-600',
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={cardHover}
            transition={transitions.default}
            className="glass p-6 rounded-2xl relative overflow-hidden cursor-pointer"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {value}<span className="text-lg text-slate-400 ml-1 font-normal">{suffix}</span>
                    </h3>
                </div>
                <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.primary}`}>
                    <Icon size={24} />
                </div>
            </div>

            {trend !== undefined && trend !== null && (
                <div className="flex items-center gap-2 text-sm">
                    <span className={`flex items-center font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(trend)}%
                    </span>
                    <span className="text-slate-400">vs last hour</span>
                </div>
            )}

            {/* Background decoration */}
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
                <Icon size={120} />
            </div>
        </motion.div>
    );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;

