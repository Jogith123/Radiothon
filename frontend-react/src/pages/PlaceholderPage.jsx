import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlaceholderPage = ({ title }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-6">
                <Construction size={64} className="text-secondary" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                This module is currently under development for the Enterprise release. Check back soon for updates.
            </p>

            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-lg shadow-primary/20"
            >
                <ArrowLeft size={18} />
                Return to Dashboard
            </button>
        </div>
    );
};

export default PlaceholderPage;
