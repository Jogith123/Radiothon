import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast';
import { useWebSocket } from '../../context/WebSocketContext';

const DashboardLayout = ({ children }) => {
    const { metrics, isConnected } = useWebSocket();

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans flex text-slate-900 dark:text-slate-50 transition-colors duration-300">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        borderRadius: '12px',
                    },
                }}
            />
            <Sidebar />

            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 p-8 overflow-y-auto w-full max-w-[1600px] mx-auto">
                    {children}
                </main>

                <footer className="px-8 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
                    <div className="flex items-center justify-between">
                        <span>&copy; {new Date().getFullYear()} VidyaVani AI Systems. All rights reserved.</span>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-orange-500'}`} />
                                {isConnected ? 'API Operational' : 'Connecting...'}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <span>Latency: {metrics?.avgLatency || '--'}ms</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DashboardLayout;


