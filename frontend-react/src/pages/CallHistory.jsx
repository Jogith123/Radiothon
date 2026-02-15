/**
 * CallHistory — flat layout, no motion
 */

import React, { useState } from 'react';
import { Download, Phone } from 'lucide-react';
import { PageHeader, Button, Card } from '../components/common';
import CallHistoryTable from '../components/history/CallHistoryTable';
import CallHistoryFilters from '../components/history/CallHistoryFilters';
import { useCallHistory } from '../hooks/api/useCallHistory';

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
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call_history_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <PageHeader
                title="Call History"
                description="Complete record of all educational Q&A sessions"
                actions={
                    <Button variant="outline" icon={Download} onClick={handleExport}>
                        Export CSV
                    </Button>
                }
            />

            <div className="space-y-6">
                <CallHistoryFilters onFilterChange={handleFilterChange} currentFilters={filters} />

                {isLoading && (
                    <Card className="p-8 text-center">
                        <p className="text-[#4B5563] text-sm">Loading call history...</p>
                    </Card>
                )}

                {isError && (
                    <Card className="p-8 text-center">
                        <p className="text-[#B91C1C] text-sm">Failed to load call history</p>
                        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
                    </Card>
                )}

                {!isLoading && !isError && data && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-[#4B5563]">
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
            </div>
        </div>
    );
};

export default CallHistory;
