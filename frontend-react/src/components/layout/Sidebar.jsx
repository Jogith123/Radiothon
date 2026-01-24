/**
 * Sidebar Component
 * Main navigation sidebar with animated menu items.
 */

import React from 'react';
import { LayoutDashboard, Phone, BarChart3, BookOpen, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { buttonHover, buttonTap, transitions } from '../../lib/motion';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Phone, label: 'Live Calls', path: '/calls', badge: 'LIVE' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: BookOpen, label: 'Content Library', path: '/content' },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside className="w-64 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-slate-700 flex flex-col h-screen fixed left-0 top-0 z-30 transition-colors duration-300">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30"
                >
                    V
                </motion.div>
                <div>
                    <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">VidyaVani</h1>
                    <p className="text-xs text-secondary font-medium uppercase tracking-wider">Enterprise</p>
                </div>
            </div>

            {/* System Status */}
            <div className="px-6 mb-6">
                <div className="bg-gradient-to-r from-primary/10 to-transparent p-3 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-1">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-2 h-2 rounded-full bg-green-500"
                        />
                        <span className="text-xs font-semibold text-primary dark:text-primary-light">System Operational</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">v2.4.0-stable</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <motion.button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            whileHover={!isActive ? buttonHover : undefined}
                            whileTap={buttonTap}
                            transition={transitions.fast}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 group ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <item.icon
                                size={20}
                                className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'} transition-colors`}
                            />
                            {item.label}
                            {item.badge && (
                                <motion.span
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-red-500/50"
                                >
                                    {item.badge}
                                </motion.span>
                            )}
                        </motion.button>
                    );
                })}
            </nav>

            {/* Pro Plan Card */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-500">
                            <Zap size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">Pro Plan</p>
                            <p className="text-[10px] text-slate-500">
                                Valid until {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '75%' }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="bg-primary h-full rounded-full"
                        />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">75% Usage Limits</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

