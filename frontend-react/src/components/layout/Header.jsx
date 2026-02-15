import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return 'Dashboard Overview';
            case '/calls': return 'Live Call Center';
            case '/analytics': return 'Analytics Dashboard';
            case '/content': return 'Content Library';
            case '/history': return 'Call History';
            default: return 'VidyaVani';
        }
    };

    return (
        <header className="h-16 bg-white border-b border-[#E5E7EB] sticky top-0 z-20 px-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">{getPageTitle()}</h2>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
                    <img
                        src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"}
                        alt="User"
                        className="w-8 h-8 rounded-full bg-[#F0F2F5] border border-[#E5E7EB]"
                        referrerPolicy="no-referrer"
                    />
                    <div className="hidden lg:block text-left">
                        <p className="text-sm font-medium text-[#111827] leading-none">{user?.name || 'Administrator'}</p>
                        <p className="text-xs text-[#6B7280] leading-none mt-1">{user?.role || 'Admin'}</p>
                    </div>
                </div>

                <div className="h-6 w-px bg-[#E5E7EB]"></div>

                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-[#6B7280] hover:bg-[#F0F2F5] hover:text-[#B91C1C] transition-colors"
                    title="Sign Out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export default Header;
