/**
 * CallHistoryTable Component
 * Displays Q&A history with answers prominently visible for admin review
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Phone, BookOpen, Clock, Languages, MessageSquare, Sparkles } from 'lucide-react';

const CallHistoryTable = ({ data }) => {
    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getLanguageLabel = (langCode) => {
        const labels = {
            'en-US': 'English',
            'te-IN': 'Telugu',
            'hi-IN': 'Hindi',
            'ta-IN': 'Tamil'
        };
        return labels[langCode] || 'English';
    };

    const getLanguageColor = (langCode) => {
        const colors = {
            'en-US': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'te-IN': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'hi-IN': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'ta-IN': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        };
        return colors[langCode] || colors['en-US'];
    };

    if (!data || data.length === 0) {
        return (
            <div className="glass p-12 rounded-xl text-center">
                <Phone className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                <p className="text-slate-600 dark:text-slate-300">No call history found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {data.map((item, index) => (
                <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                >
                    {/* Header with metadata */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(item.timestamp)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-mono text-slate-700 dark:text-slate-300">
                            <Phone className="w-4 h-4" />
                            <span>{item.user_id}</span>
                        </div>

                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getLanguageColor(item.language)}`}>
                            <Languages className="w-3 h-3 mr-1" />
                            {getLanguageLabel(item.language)}
                        </span>

                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary/10 to-primary/20 text-primary border border-primary/20">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {item.subject}
                        </span>
                    </div>

                    {/* Question Block */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                Question
                            </h3>
                        </div>
                        <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed pl-6">
                            {item.question}
                        </p>
                    </div>

                    {/* Answer Block - Prominent Display */}
                    <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-4 border border-primary/10">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                            <h3 className="text-sm font-bold text-primary dark:text-primary-light uppercase tracking-wide">
                                AI Generated Answer
                            </h3>
                        </div>
                        <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pl-7">
                            {item.response}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default CallHistoryTable;
