/**
 * Analytics Page
 * Displays system performance charts, call volume, and subject distribution.
 * All data fetched from MongoDB via backend API.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Clock, Database, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';

// Components
import { PageHeader, Card } from '../components/common';

// Motion presets
import { containerVariants, cardVariants, cardHover, transitions } from '../lib/motion';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];
const tooltipStyle = { backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' };

// ============================================
// Main Component
// ============================================

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
        const interval = setInterval(fetchAll, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <PageHeader
                title="Analytics Dashboard"
                description="Real-time system performance and usage trends from MongoDB"
            />

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-slate-500">Loading analytics from database...</span>
                </div>
            ) : (
                <>
                    {/* Top Stats Cards */}
                    <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Calls (Week)"
                            value={summary?.totalCalls?.toLocaleString() || '0'}
                            trend={summary?.callsTrend || '+0%'}
                            icon={TrendingUp}
                            color="blue"
                        />
                        <StatCard
                            title="Unique Students"
                            value={summary?.uniqueStudents?.toLocaleString() || '0'}
                            trend={summary?.studentsTrend || '+0%'}
                            icon={Users}
                            color="purple"
                        />
                        <StatCard
                            title="Avg Q/Student"
                            value={summary?.avgQuestionsPerUser || '0'}
                            trend="—"
                            icon={Clock}
                            color="orange"
                        />
                        <StatCard
                            title="Total All Time"
                            value={summary?.totalAllTime?.toLocaleString() || '0'}
                            trend="—"
                            icon={Database}
                            color="green"
                        />
                    </motion.div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <motion.div variants={cardVariants} className="lg:col-span-2">
                            <Card>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Call Volume (Last 7 Days)</h3>
                                {callVolume.length > 0 ? (
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={callVolume}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                                                <XAxis dataKey="day" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" />
                                                <RechartsTooltip contentStyle={tooltipStyle} />
                                                <Bar dataKey="calls" fill="#6366f1" radius={[4, 4, 0, 0]} name="Calls" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-center text-slate-400 py-20">No call data yet</p>
                                )}
                            </Card>
                        </motion.div>

                        <motion.div variants={cardVariants}>
                            <Card>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Subject Distribution</h3>
                                {subjectData.length > 0 ? (
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={subjectData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
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
                                    <p className="text-center text-slate-400 py-20">No subject data yet</p>
                                )}
                                <p className="text-xs text-center text-slate-400 mt-2 italic">Live data from MongoDB</p>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Hourly Activity Chart */}
                    <motion.div variants={cardVariants}>
                        <Card>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Today's Hourly Activity</h3>
                                <span className="text-xs text-slate-400">Auto-refreshes every 30s</span>
                            </div>
                            {performanceData.length > 0 ? (
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={performanceData}>
                                            <defs>
                                                <linearGradient id="colorCallsAnalytics" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                                            <XAxis dataKey="time" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <RechartsTooltip contentStyle={tooltipStyle} />
                                            <Area type="monotone" dataKey="calls" stroke="#6366f1" fillOpacity={1} fill="url(#colorCallsAnalytics)" name="Calls" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-16">No activity data for today yet</p>
                            )}
                        </Card>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
};

// ============================================
// Stat Card Component
// ============================================

const StatCard = React.memo(({ title, value, trend, icon: Icon, color }) => {
    const colorMap = {
        blue: 'bg-blue-500/10 text-blue-500',
        purple: 'bg-purple-500/10 text-purple-500',
        orange: 'bg-orange-500/10 text-orange-500',
        green: 'bg-green-500/10 text-green-500',
    };

    const hasTrend = trend && trend !== '—';
    const isPositive = hasTrend && trend.startsWith('+');

    return (
        <motion.div
            whileHover={cardHover}
            transition={transitions.fast}
            className="glass p-5 rounded-xl flex items-center justify-between cursor-pointer"
        >
            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
                {hasTrend ? (
                    <span className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {trend} <span className="text-slate-400 ml-1">vs last week</span>
                    </span>
                ) : (
                    <span className="text-xs text-slate-400">All time</span>
                )}
            </div>
            <div className={`p-3 rounded-lg ${colorMap[color]}`}>
                <Icon size={24} />
            </div>
        </motion.div>
    );
});

StatCard.displayName = 'StatCard';

export default Analytics;

