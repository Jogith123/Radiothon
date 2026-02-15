/**
 * CallHistoryTable — flat cards, no animations
 */

import React from 'react';
import { Phone, BookOpen, Clock, Languages, MessageSquare } from 'lucide-react';

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
            'en-US': 'bg-[#F0F2F5] text-[#4B5563]',
            'te-IN': 'bg-[#F0F2F5] text-[#4B5563]',
            'hi-IN': 'bg-[#F0F2F5] text-[#4B5563]',
            'ta-IN': 'bg-[#F0F2F5] text-[#4B5563]'
        };
        return colors[langCode] || colors['en-US'];
    };

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-12 text-center">
                <Phone className="w-10 h-10 mx-auto mb-3 text-[#6B7280]" />
                <p className="text-[#4B5563] text-sm">No call history found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {data.map((item) => (
                <div
                    key={item._id}
                    className="bg-white rounded-[10px] border border-[#E5E7EB] p-6"
                >
                    {/* Header with metadata */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-[#E5E7EB]">
                        <div className="flex items-center gap-2 text-sm text-[#4B5563]">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(item.timestamp)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-mono text-[#111827]">
                            <Phone className="w-4 h-4" />
                            <span>{item.user_id}</span>
                        </div>

                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getLanguageColor(item.language)}`}>
                            <Languages className="w-3 h-3 mr-1" />
                            {getLanguageLabel(item.language)}
                        </span>

                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#1E293B] text-white">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {item.subject}
                        </span>
                    </div>

                    {/* Question Block */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-[#4B5563]" />
                            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                                Question
                            </h3>
                        </div>
                        <p className="text-sm text-[#111827] leading-relaxed pl-6">
                            {item.question}
                        </p>
                    </div>

                    {/* Answer Block */}
                    <div className="bg-[#F6F7F9] rounded-lg p-4 border border-[#E5E7EB]">
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4 text-[#4B5563]" />
                            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                                AI Generated Answer
                            </h3>
                        </div>
                        <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap pl-6">
                            {item.response}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CallHistoryTable;
