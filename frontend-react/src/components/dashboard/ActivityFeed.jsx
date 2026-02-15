/**
 * ActivityFeed — clean, flat log display
 */

import React from 'react';
import { Clock } from 'lucide-react';
import { useWebSocket } from '../../context/WebSocketContext';

const MAX_VISIBLE_ACTIVITIES = 5;

const ActivityFeed = React.memo(() => {
    const { logs } = useWebSocket();

    const activities = logs
        .filter(log => !log.message?.includes('metrics') && !log.message?.includes('Stage Update'))
        .slice(0, MAX_VISIBLE_ACTIVITIES);

    const getStatusColor = (type) => {
        switch (type) {
            case 'error': return 'bg-[#B91C1C]';
            case 'success': return 'bg-[#15803D]';
            default: return 'bg-[#1E293B]';
        }
    };

    return (
        <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-6 h-full">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Recent Activity</h3>
            <div className="space-y-4">
                {activities.length === 0 && (
                    <p className="text-[#6B7280] text-sm">No recent activity</p>
                )}
                {activities.map((activity) => (
                    <div
                        key={activity.id}
                        className="relative pl-5 pb-2 border-l border-[#E5E7EB] last:border-0 last:pb-0"
                    >
                        <div className={`absolute left-[-4px] top-0.5 w-2 h-2 rounded-full ${getStatusColor(activity.type)}`} />

                        <p className="text-sm text-[#111827] mb-1 break-words">
                            {activity.message}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                            <Clock size={11} />
                            {activity.timestamp}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

ActivityFeed.displayName = 'ActivityFeed';

export default ActivityFeed;

