/**
 * ChartsSection Component
 * Displays performance charts and subject popularity from MongoDB.
 */

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { containerVariants, cardVariants } from '../../lib/motion';
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

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
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Today's Call Activity</h3>
                <div className="h-64">
                    {perfData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={perfData}>
                                <defs>
                                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1a237e" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#1a237e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="calls" stroke="#1a237e" fillOpacity={1} fill="url(#colorCalls)" name="Calls" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-slate-400 pt-20">No activity data for today yet</p>
                    )}
                </div>
            </motion.div>

            {/* Subject Distribution */}
            <motion.div
                variants={cardVariants}
                className="glass p-6 rounded-2xl"
            >
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Subject Popularity</h3>
                <div className="h-64">
                    {subjectData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectData.slice(0, 8)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="subject" type="category" width={80} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="calls" fill="#ffab00" radius={[0, 4, 4, 0]} barSize={20} name="Questions" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-slate-400 pt-20">No subject data yet</p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
});

ChartsSection.displayName = 'ChartsSection';

export default ChartsSection;

