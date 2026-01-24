/**
 * ChartsSection Component
 * Displays performance charts and subject popularity with animations.
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { containerVariants, cardVariants, transitions } from '../../lib/motion';

const data = [
    { time: '10:00', latency: 400, calls: 24 },
    { time: '11:00', latency: 300, calls: 18 },
    { time: '12:00', latency: 550, calls: 35 },
    { time: '13:00', latency: 450, calls: 42 },
    { time: '14:00', latency: 200, calls: 28 },
    { time: '15:00', latency: 350, calls: 30 },
    { time: '16:00', latency: 320, calls: 26 },
];

const subjectData = [
    { subject: 'Physics', calls: 45 },
    { subject: 'Chemistry', calls: 32 },
    { subject: 'Biology', calls: 28 },
    { subject: 'Math', calls: 65 },
    { subject: 'English', calls: 15 },
];

const ChartsSection = React.memo(() => {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
            {/* Main Performance Chart */}
            <motion.div
                variants={cardVariants}
                className="glass p-6 rounded-2xl lg:col-span-2"
            >
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">System Performance</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1a237e" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#1a237e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="latency" stroke="#1a237e" fillOpacity={1} fill="url(#colorLatency)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Subject Distribution */}
            <motion.div
                variants={cardVariants}
                className="glass p-6 rounded-2xl"
            >
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Subject Popularity</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="subject" type="category" width={80} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                            <Bar dataKey="calls" fill="#ffab00" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </motion.div>
    );
});

ChartsSection.displayName = 'ChartsSection';

export default ChartsSection;

