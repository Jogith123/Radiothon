/**
 * MetricCard — flat, restrained, no decorations
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricCard = React.memo(({ title, value, trend, suffix = '', icon: Icon, color = 'primary' }) => {
    const isPositive = trend > 0;

    const colorMap = {
        primary: 'bg-[#F0F2F5] text-[#1E293B]',
        secondary: 'bg-[#F0F2F5] text-[#4B5563]',
        success: 'bg-[#F0FDF4] text-[#15803D]',
        warning: 'bg-[#FFFBEB] text-[#B45309]',
        error: 'bg-[#FEF2F2] text-[#B91C1C]',
        info: 'bg-[#F0F2F5] text-[#4B5563]',
    };

    return (
        <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-5">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="text-xs font-medium text-[#6B7280] mb-1">{title}</p>
                    <h3 className="text-2xl font-semibold text-[#111827]">
                        {value}<span className="text-base text-[#6B7280] ml-1 font-normal">{suffix}</span>
                    </h3>
                </div>
                <div className={`p-2.5 rounded-lg ${colorMap[color] || colorMap.primary}`}>
                    <Icon size={20} />
                </div>
            </div>

            {trend !== undefined && trend !== null && (
                <div className="flex items-center gap-1.5 text-xs">
                    <span className={`flex items-center font-medium ${isPositive ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}%
                    </span>
                    <span className="text-[#6B7280]">vs last hour</span>
                </div>
            )}
        </div>
    );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;

