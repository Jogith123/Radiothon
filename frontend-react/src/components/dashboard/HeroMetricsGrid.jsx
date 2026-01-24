import React from 'react';
import { Phone, Clock, CheckCircle2, Users } from 'lucide-react';
import MetricCard from './MetricCard';
import { useWebSocket } from '../../context/WebSocketContext';

const HeroMetricsGrid = () => {
    const { metrics } = useWebSocket();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <MetricCard
                title="Total Calls Today"
                value={metrics.totalCalls?.toString() || "0"}
                trend={12.5}
                icon={Phone}
                color="primary"
            />
            <MetricCard
                title="Avg Response Time"
                value={metrics.avgLatency ? (metrics.avgLatency / 1000).toFixed(1) : "0.0"}
                suffix="s"
                trend={-5.4}
                icon={Clock}
                color="secondary"
            />
            <MetricCard
                title="STT Processing"
                value={metrics.sttTime ? (metrics.sttTime / 1000).toFixed(1) : "0.0"}
                suffix="s"
                trend={2.1}
                icon={CheckCircle2}
                color="success"
            />
            <MetricCard
                title="Active Sessions"
                value={metrics.activeSessions?.toString() || "0"}
                trend={8.4}
                icon={Users}
                color="purple"
            />
        </div>
    );
};

export default HeroMetricsGrid;
