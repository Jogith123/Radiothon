/**
 * ChartsSection — flat charts with muted palette
 */

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

const ChartsSection = React.memo(() => {
    const [perfData, setPerfData] = useState([]);
    const [subjectData, setSubjectData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [perfRes, subRes] = await Promise.allSettled([
                    apiClient('/api/analytics/performance'),
                    apiClient('/api/analytics/subjects'),
                ]);
                if (perfRes.status === 'fulfilled') setPerfData(perfRes.value.data || []);
                if (subRes.status === 'fulfilled') setSubjectData(subRes.value.data || []);
            } catch (e) {
                console.error('ChartsSection fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const tooltipStyle = {
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        backgroundColor: '#FFFFFF',
        fontSize: '13px',
        color: '#111827',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-5 h-5 animate-spin text-[#6B7280]" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Performance Chart */}
            <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-6 lg:col-span-2">
                <h3 className="text-sm font-semibold text-[#111827] mb-6">Today's Call Activity</h3>
                <div className="h-64">
                    {perfData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={perfData}>
                                <defs>
                                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1E293B" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#1E293B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area type="monotone" dataKey="calls" stroke="#1E293B" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCalls)" name="Calls" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-[#6B7280] text-sm pt-20">No activity data for today yet</p>
                    )}
                </div>
            </div>

            {/* Subject Distribution */}
            <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-6">
                <h3 className="text-sm font-semibold text-[#111827] mb-6">Subject Popularity</h3>
                <div className="h-64">
                    {subjectData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectData.slice(0, 8)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="subject" type="category" width={80} tick={{ fill: '#4B5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} />
                                <Bar dataKey="calls" fill="#1E293B" radius={[0, 4, 4, 0]} barSize={18} name="Questions" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-[#6B7280] text-sm pt-20">No subject data yet</p>
                    )}
                </div>
            </div>
        </div>
    );
});

ChartsSection.displayName = 'ChartsSection';

export default ChartsSection;

