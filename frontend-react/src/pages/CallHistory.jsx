/**
 * CallHistory Page
 * Displays all phone call Q&A with filters and real-time updates
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter as FilterIcon, Phone } from 'lucide-react';

// Components
import { PageHeader, Button, Card } from '../components/common';
import CallHistoryTable from '../components/history/CallHistoryTable';
import CallHistoryFilters from '../components/history/CallHistoryFilters';

// Hooks
import { useCallHistory } from '../hooks/api/useCallHistory';

// Motion presets
import { containerVariants, cardVariants } from '../lib/motion';

const CallHistory = () => {
    const [filters, setFilters] = useState({
        phoneNumber: '',
        subject: '',
        limit: 50,
        skip: 0
    });

    const { data, isLoading, isError, refetch } = useCallHistory(filters);

    const handleFilterChange = (newFilters) => {
        setFilters({ ...filters, ...newFilters, skip: 0 });
    };

    const handleExport = () => {
        // Simple CSV export
        if (!data?.data || data.data.length === 0) return;

        const headers = ['Timestamp', 'Phone', 'Question', 'Answer', 'Subject', 'Language'];
        const rows = data.data.map(item => [
            new Date(item.timestamp).toLocaleString(),
            item.user_id,
            item.question,
            item.response,
            item.subject,
            item.language || 'en-US'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call_history_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <PageHeader
                title="Call History"
                description="Complete record of all educational Q&A sessions"
                actions={
                    <>
                        <Button variant="outline" icon={Download} onClick={handleExport}>
                            Export CSV
                        </Button>
                    </>
                }
            />

            <motion.div variants={cardVariants} className="space-y-6">
                <CallHistoryFilters onFilterChange={handleFilterChange} currentFilters={filters} />

                {isLoading && (
                    <Card className="p-8 text-center">
                        <p className="text-slate-600 dark:text-slate-300">Loading call history...</p>
                    </Card>
                )}

                {isError && (
                    <Card className="p-8 text-center">
                        <p className="text-red-600 dark:text-red-400">Failed to load call history</p>
                        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
                    </Card>
                )}

                {!isLoading && !isError && data && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                <Phone className="inline w-4 h-4 mr-1" />
                                {data.count} calls found
                            </p>
                        </div>

                        <CallHistoryTable data={data.data || []} />

                        {data.count >= filters.limit && (
                            <div className="flex justify-center mt-6">
                                <Button
                                    onClick={() => setFilters({ ...filters, skip: filters.skip + filters.limit })}
                                    variant="outline"
                                >
                                    Load More
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

export default CallHistory;
