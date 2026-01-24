/**
 * LiveCalls Page
 * Real-time call monitoring with phone simulator and terminal logs.
 */

import React from 'react';
import { motion } from 'framer-motion';

// Components
import { PageHeader } from '../components/common';
import PhoneSimulator from '../components/dashboard/PhoneSimulator';
import Terminal from '../components/dashboard/Terminal';

// Hooks
import { useSystemStatus } from '../hooks/api/useSystemStatus';

// Motion presets
import { containerVariants, cardVariants } from '../lib/motion';

const LiveCalls = () => {
    const { data: status } = useSystemStatus();

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <PageHeader
                title="Live Call Center"
                description="Monitor active sessions and system logs in real-time"
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <motion.div
                    variants={cardVariants}
                    className="flex justify-center xl:justify-end order-1 xl:order-none"
                >
                    <div className="relative">
                        <div className="absolute -inset-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
                        <PhoneSimulator />
                    </div>
                </motion.div>

                <motion.div
                    variants={cardVariants}
                    className="order-2 xl:order-none"
                >
                    <Terminal />
                    <ConnectionStatus status={status} />
                </motion.div>
            </div>
        </motion.div>
    );
};

/**
 * Connection status indicator component
 */
const ConnectionStatus = React.memo(({ status }) => (
    <motion.div
        variants={cardVariants}
        className="mt-6 glass p-6 rounded-xl"
    >
        <h3 className="font-bold text-slate-800 dark:text-white mb-2">Connection Status</h3>
        <div className="flex gap-4">
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
    </motion.div>
));

const StatusIndicator = React.memo(({ label, value, isConnected }) => (
    <div className="flex items-center gap-2">
        <motion.div
            animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-orange-500'}`}
        />
        <span className="text-sm text-slate-600 dark:text-slate-300">
            {label}: {value}
        </span>
    </div>
));

ConnectionStatus.displayName = 'ConnectionStatus';
StatusIndicator.displayName = 'StatusIndicator';

export default LiveCalls;

