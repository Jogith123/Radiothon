import React from 'react';
import { Bell, Search, Sun, Moon, Database } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    // Dynamic page title based on current route
    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return 'Dashboard Overview';
            case '/calls': return 'Live Call Center';
            case '/analytics': return 'Analytics Dashboard';
            case '/content': return 'Content Library';
            default: return 'VidyaVani';
        }
    };

    const handleFeatureClick = (feature) => {
        toast(`${feature} feature is coming soon!`, {
            icon: '🚀',
            duration: 3000,
        });
    };

    return (
        <header className="h-20 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 px-8 flex items-center justify-between transition-colors duration-300">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{getPageTitle()}</h2>
            </div>

            <div className="flex items-center gap-6">
                {/* Search */}
                <div className="relative hidden md:block group">
                    <label htmlFor="global-search" className="sr-only">Search analytics, logs...</label>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        id="global-search"
                        type="text"
                        placeholder="Search analytics, logs..."
                        aria-label="Search analytics and logs"
                        className="pl-10 pr-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary/50 text-sm w-64 text-slate-700 dark:text-slate-200 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleFeatureClick('Global Search')}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <button
                        onClick={() => handleFeatureClick('Notifications')}
                        className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-surface-dark"></span>
                    </button>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    <div
                        onClick={() => handleFeatureClick('User Profile')}
                        className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
                    >
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                            alt="User"
                            className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"
                        />
                        <div className="hidden lg:block text-left">
                            <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">Administrator</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mt-1">Super Admin</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
