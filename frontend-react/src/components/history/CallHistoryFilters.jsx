/**
 * CallHistoryFilters — flat filter controls
 */

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button, Card } from '../common';

const CallHistoryFilters = ({ onFilterChange, currentFilters }) => {
    const [phoneNumber, setPhoneNumber] = useState(currentFilters.phoneNumber || '');
    const [subject, setSubject] = useState(currentFilters.subject || '');

    const handleApply = () => {
        onFilterChange({ phoneNumber, subject });
    };

    const handleClear = () => {
        setPhoneNumber('');
        setSubject('');
        onFilterChange({ phoneNumber: '', subject: '' });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleApply();
        }
    };

    const inputClass = 'w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] text-sm focus:ring-2 focus:ring-[#1E293B]/30 focus:border-[#1E293B] outline-none';

    return (
        <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1">
                        Phone Number
                    </label>
                    <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="+1234567890"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="e.g., Physics"
                        className={inputClass}
                    />
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleApply} icon={Search} className="flex-1">
                        Apply
                    </Button>
                    <Button onClick={handleClear} variant="outline" icon={X}>
                        Clear
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default CallHistoryFilters;
