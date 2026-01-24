/**
 * Analytics Page
 * Displays system performance charts, call volume, and subject distribution.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Clock, ThumbsUp } from 'lucide-react';

// Components
import { PageHeader, Card } from '../components/common';

// Motion presets
import { containerVariants, cardVariants, cardHover, transitions } from '../lib/motion';

// ============================================
// Mock Data (TODO: Replace with MongoDB API)
// ============================================

const callVolumeData = [
    { day: 'Mon', calls: 65, missed: 4 },
    { day: 'Tue', calls: 89, missed: 6 },
    { day: 'Wed', calls: 142, missed: 2 },
    { day: 'Thu', calls: 110, missed: 5 },
    { day: 'Fri', calls: 95, missed: 3 },
    { day: 'Sat', calls: 45, missed: 1 },
    { day: 'Sun', calls: 30, missed: 0 },
];

const subjectData = [
    { name: 'Physics', value: 400 },
    { name: 'History', value: 300 },
    { name: 'Mathematics', value: 300 },
    { name: 'Biology', value: 200 },
];

const performanceData = [
    { time: '09:00', latency: 320 },
    { time: '10:00', latency: 450 },
    { time: '11:00', latency: 380 },
    { time: '12:00', latency: 290 },
    { time: '13:00', latency: 310 },
    { time: '14:00', latency: 550 },
    { time: '15:00', latency: 400 },
    { time: '16:00', latency: 350 },
];

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6'];

const tooltipStyle = { backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' };

// ============================================
// Main Component
// ============================================

const Analytics = () => {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <PageHeader
                title="Analytics Dashboard"
                description="System performance and usage trends"
            />

            {/* Top Stats Cards */}
            <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Calls (Week)" value="1,245" trend="+12%" icon={TrendingUp} color="blue" />
                <StatCard title="Unique Students" value="842" trend="+5%" icon={Users} color="purple" />
                <StatCard title="Avg Session Time" value="4m 32s" trend="-2%" icon={Clock} color="orange" />
                <StatCard title="Satisfaction Score" value="4.8/5" trend="+0.2" icon={ThumbsUp} color="green" />
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div variants={cardVariants} className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Call Volume Trends</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={callVolumeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                                    <XAxis dataKey="day" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <RechartsTooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="missed" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                    <Card>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Subject Distribution</h3>
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
                        <p className="text-xs text-center text-slate-400 mt-2 italic">* Data source: MongoDB (Planned)</p>
                    </Card>
                </motion.div>
            </div>

            {/* Latency Chart */}
            <motion.div variants={cardVariants}>
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">System Latency (ms)</h3>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">Today</button>
                            <button className="px-3 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full">Week</button>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorLatencyAnalytics" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                                <XAxis dataKey="time" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <RechartsTooltip contentStyle={tooltipStyle} />
                                <Area type="monotone" dataKey="latency" stroke="#ec4899" fillOpacity={1} fill="url(#colorLatencyAnalytics)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </motion.div>
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

    const isPositive = trend.startsWith('+');

    return (
        <motion.div
            whileHover={cardHover}
            transition={transitions.fast}
            className="glass p-5 rounded-xl flex items-center justify-between cursor-pointer"
        >
            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
                <span className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {trend} <span className="text-slate-400 ml-1">vs last week</span>
                </span>
            </div>
            <div className={`p-3 rounded-lg ${colorMap[color]}`}>
                <Icon size={24} />
            </div>
        </motion.div>
    );
});

StatCard.displayName = 'StatCard';

export default Analytics;

