/**
 * LiveCalls — flat monitoring view
 */

import React from 'react';
import { PageHeader } from '../components/common';
import PhoneSimulator from '../components/dashboard/PhoneSimulator';
import Terminal from '../components/dashboard/Terminal';
import { useSystemStatus } from '../hooks/api/useSystemStatus';

const LiveCalls = () => {
    const { data: status } = useSystemStatus();

    return (
        <div>
            <PageHeader
                title="Live Call Center"
                description="Monitor active sessions and system logs in real-time"
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="flex justify-center xl:justify-end order-1 xl:order-none">
                    <PhoneSimulator />
                </div>

                <div className="order-2 xl:order-none">
                    <Terminal />
                    <ConnectionStatus status={status} />
                </div>
            </div>
        </div>
    );
};

const ConnectionStatus = React.memo(({ status }) => (
    <div className="mt-6 bg-white rounded-[10px] border border-[#E5E7EB] p-6">
        <h3 className="text-sm font-semibold text-[#111827] mb-3">Connection Status</h3>
        <div className="flex gap-6">
            <StatusIndicator
                label="WebSocket"
                value={status?.websocket || 'Connecting...'}
                isConnected={status?.websocket === 'Connected'}
            />
            <StatusIndicator
                label="Backend API"
                value={status?.backend || 'Checking...'}
                isConnected={status?.backend === 'Online'}
            />
        </div>
    </div>
));

const StatusIndicator = React.memo(({ label, value, isConnected }) => (
    <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#15803D]' : 'bg-[#B45309]'}`} />
        <span className="text-sm text-[#4B5563]">
            {label}: {value}
        </span>
    </div>
));

ConnectionStatus.displayName = 'ConnectionStatus';
StatusIndicator.displayName = 'StatusIndicator';

export default LiveCalls;

