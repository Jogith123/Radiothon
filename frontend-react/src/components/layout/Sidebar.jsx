/**
 * Sidebar — flat, quiet navigation
 */

import React from 'react';
import { LayoutDashboard, Phone, BarChart3, BookOpen, History, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Phone, label: 'Live Calls', path: '/calls', badge: 'LIVE' },
    { icon: History, label: 'Call History', path: '/history' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: BookOpen, label: 'Content Library', path: '/content' },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col h-screen fixed left-0 top-0 z-30">
            {/* Logo */}
            <div className="px-6 py-5 flex items-center gap-3 border-b border-[#E5E7EB]">
                <div className="w-9 h-9 bg-[#1E293B] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    V
                </div>
                <div>
                    <h1 className="font-semibold text-lg text-[#111827] tracking-tight">VidyaVani</h1>
                    <p className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wider">Enterprise</p>
                </div>
            </div>

            {/* System Status */}
            <div className="px-5 py-4">
                <div className="bg-[#F0F2F5] px-3 py-2.5 rounded-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                    <span className="text-xs font-medium text-[#4B5563]">System Operational</span>
                    <span className="ml-auto text-[10px] text-[#6B7280]">v2.5.0</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-[#1E293B] text-white'
                                : 'text-[#4B5563] hover:bg-[#F0F2F5]'
                                }`}
                        >
                            <item.icon
                                size={18}
                                className={isActive ? 'text-white' : 'text-[#6B7280]'}
                            />
                            {item.label}
                            {item.badge && (
                                <span className="ml-auto bg-[#B91C1C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Admin Info & Logout */}
            <div className="p-4 border-t border-[#E5E7EB]">
                <div className="bg-[#F6F7F9] rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-3">
                        <img
                            src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"}
                            alt="Admin"
                            className="w-8 h-8 rounded-full bg-[#F0F2F5] border border-[#E5E7EB]"
                            referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#111827] truncate">{user?.name || 'Admin'}</p>
                            <p className="text-[10px] text-[#6B7280] truncate">{user?.email || 'admin@vidyavani.gov.in'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#B91C1C] bg-white border border-[#E5E7EB] hover:bg-[#F0F2F5] rounded-lg transition-colors"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

