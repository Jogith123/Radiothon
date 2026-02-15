/**
 * Analytics — flat charts, muted palette, no motion
 */

import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Clock, Database, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { PageHeader, Card } from '../components/common';

const COLORS = ['#1E293B', '#334155', '#475569', '#64748B', '#94A3B8', '#6B7280', '#4B5563', '#9CA3AF'];
const tooltipStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#111827', fontSize: '13px', boxShadow: 'none' };

const Analytics = () => {
    const [summary, setSummary] = useState(null);
    const [callVolume, setCallVolume] = useState([]);
    const [subjectData, setSubjectData] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [sumRes, volRes, subRes, perfRes] = await Promise.allSettled([
                    apiClient('/api/analytics/summary'),
                    apiClient('/api/analytics/call-volume'),
                    apiClient('/api/analytics/subjects'),
                    apiClient('/api/analytics/performance'),
                ]);
                if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
                if (volRes.status === 'fulfilled') setCallVolume(volRes.value.data || []);
                if (subRes.status === 'fulfilled') setSubjectData(subRes.value.data || []);
                if (perfRes.status === 'fulfilled') setPerformanceData(perfRes.value.data || []);
            } catch (e) {
                console.error('Analytics fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
        const interval = setInterval(fetchAll, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Analytics Dashboard"
                description="Real-time system performance and usage trends from MongoDB"
            />

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-5 h-5 animate-spin text-[#6B7280]" />
                    <span className="ml-3 text-[#6B7280] text-sm">Loading analytics...</span>
                </div>
            ) : (
                <>
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Calls (Week)" value={summary?.totalCalls?.toLocaleString() || '0'} trend={summary?.callsTrend || '+0%'} icon={TrendingUp} />
                        <StatCard title="Unique Students" value={summary?.uniqueStudents?.toLocaleString() || '0'} trend={summary?.studentsTrend || '+0%'} icon={Users} />
                        <StatCard title="Avg Q/Student" value={summary?.avgQuestionsPerUser || '0'} trend="—" icon={Clock} />
                        <StatCard title="Total All Time" value={summary?.totalAllTime?.toLocaleString() || '0'} trend="—" icon={Database} />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Card>
                                <h3 className="text-sm font-semibold text-[#111827] mb-6">Call Volume (Last 7 Days)</h3>
                                {callVolume.length > 0 ? (
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={callVolume}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                                <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                <RechartsTooltip contentStyle={tooltipStyle} />
                                                <Bar dataKey="calls" fill="#1E293B" radius={[4, 4, 0, 0]} name="Calls" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-center text-[#6B7280] text-sm py-20">No call data yet</p>
                                )}
                            </Card>
                        </div>

                        <div>
                            <Card>
                                <h3 className="text-sm font-semibold text-[#111827] mb-6">Subject Distribution</h3>
                                {subjectData.length > 0 ? (
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={subjectData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                    {subjectData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip contentStyle={tooltipStyle} />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-center text-[#6B7280] text-sm py-20">No subject data yet</p>
                                )}
                                <p className="text-xs text-center text-[#6B7280] mt-2">Live data from MongoDB</p>
                            </Card>
                        </div>
                    </div>

                    {/* Hourly Activity Chart */}
                    <Card>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-semibold text-[#111827]">Today's Hourly Activity</h3>
                            <span className="text-xs text-[#6B7280]">Auto-refreshes every 30s</span>
                        </div>
                        {performanceData.length > 0 ? (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData}>
                                        <defs>
                                            <linearGradient id="colorCallsAnalytics" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1E293B" stopOpacity={0.12} />
                                                <stop offset="95%" stopColor="#1E293B" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="time" tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <RechartsTooltip contentStyle={tooltipStyle} />
                                        <Area type="monotone" dataKey="calls" stroke="#1E293B" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCallsAnalytics)" name="Calls" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-center text-[#6B7280] text-sm py-16">No activity data for today yet</p>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
};

const StatCard = React.memo(({ title, value, trend, icon: Icon }) => {
    const hasTrend = trend && trend !== '—';
    const isPositive = hasTrend && trend.startsWith('+');

    return (
        <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-5 flex items-center justify-between">
            <div>
                <p className="text-xs font-medium text-[#6B7280] mb-1">{title}</p>
                <h3 className="text-2xl font-semibold text-[#111827]">{value}</h3>
                {hasTrend ? (
                    <span className={`text-xs font-medium ${isPositive ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
                        {trend} <span className="text-[#6B7280] ml-1">vs last week</span>
                    </span>
                ) : (
                    <span className="text-xs text-[#6B7280]">All time</span>
                )}
            </div>
            <div className="p-3 rounded-lg bg-[#F0F2F5]">
                <Icon size={22} className="text-[#4B5563]" />
            </div>
        </div>
    );
});

StatCard.displayName = 'StatCard';

export default Analytics;

