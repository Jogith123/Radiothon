import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast';
import { useWebSocket } from '../../context/WebSocketContext';

const DashboardLayout = ({ children }) => {
    const { metrics, isConnected } = useWebSocket();

    return (
        <div className="min-h-screen bg-[#F6F7F9] font-sans flex text-[#111827]">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#FFFFFF',
                        color: '#111827',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
                    },
                }}
            />
            <Sidebar />

            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 px-8 py-6 overflow-y-auto w-full max-w-[1400px] mx-auto">
                    {children}
                </main>

                <footer className="px-8 py-4 border-t border-[#E5E7EB] text-center text-xs text-[#6B7280]">
                    <div className="flex items-center justify-between">
                        <span>&copy; {new Date().getFullYear()} VidyaVani AI Systems</span>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#15803D]' : 'bg-[#B45309]'}`} />
                                {isConnected ? 'Connected' : 'Connecting...'}
                            </span>
                            <span className="text-[#E5E7EB]">|</span>
                            <span>Latency: {metrics?.avgLatency || '--'}ms</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DashboardLayout;


