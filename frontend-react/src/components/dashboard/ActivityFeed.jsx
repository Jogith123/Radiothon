/**
 * ActivityFeed Component
 * Displays real-time activity log with staggered animations.
 */

import React from 'react';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../../context/WebSocketContext';
import { containerVariants, listItemVariants, transitions } from '../../lib/motion';

const MAX_VISIBLE_ACTIVITIES = 5;

const ActivityFeed = React.memo(() => {
    const { logs } = useWebSocket();

    // Filter out verbose low-level system logs
    const activities = logs
        .filter(log => !log.message?.includes('metrics') && !log.message?.includes('Stage Update'))
        .slice(0, MAX_VISIBLE_ACTIVITIES);

    const getStatusColor = (type) => {
        switch (type) {
            case 'error': return 'bg-red-500';
            case 'success': return 'bg-green-500';
            default: return 'bg-primary';
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="glass p-6 rounded-2xl h-full"
        >
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {activities.length === 0 && (
                        <motion.div
                            key="empty"
                            variants={listItemVariants}
                            className="text-slate-400 text-sm italic"
                        >
                            No recent activity
                        </motion.div>
                    )}
                    {activities.map((activity) => (
                        <motion.div
                            key={activity.id}
                            variants={listItemVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: 20 }}
                            transition={transitions.default}
                            layout
                            className="relative pl-6 pb-2 border-l border-slate-200 dark:border-slate-700 last:border-0 last:pb-0"
                        >
                            <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-surface-dark ${getStatusColor(activity.type)}`} />

                            <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-1 break-words">
                                {activity.message}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock size={12} />
                                {activity.timestamp}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
});

ActivityFeed.displayName = 'ActivityFeed';

export default ActivityFeed;

