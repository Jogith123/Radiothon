import React, { useState, useEffect, useRef } from 'react';
import { Phone, Clock, CheckCircle2, Users } from 'lucide-react';
import MetricCard from './MetricCard';
import { useWebSocket } from '../../context/WebSocketContext';

const HeroMetricsGrid = () => {
    const { metrics } = useWebSocket();
    const prevMetrics = useRef({});
    const [trends, setTrends] = useState({ calls: 0, latency: 0, stt: 0, sessions: 0 });

    // Calculate trends by comparing current metrics to previous snapshot
    useEffect(() => {
        const prev = prevMetrics.current;
        if (prev.totalCalls !== undefined && metrics.totalCalls !== undefined) {
            const callDiff = prev.totalCalls > 0
                ? ((metrics.totalCalls - prev.totalCalls) / prev.totalCalls * 100)
                : 0;
            const latDiff = prev.avgLatency > 0
                ? ((metrics.avgLatency - prev.avgLatency) / prev.avgLatency * 100)
                : 0;
            const sttDiff = prev.sttTime > 0
                ? ((metrics.sttTime - prev.sttTime) / prev.sttTime * 100)
                : 0;
            const sessDiff = prev.activeSessions > 0
                ? ((metrics.activeSessions - prev.activeSessions) / prev.activeSessions * 100)
                : 0;
            setTrends({
                calls: parseFloat(callDiff.toFixed(1)),
                latency: parseFloat(latDiff.toFixed(1)),
                stt: parseFloat(sttDiff.toFixed(1)),
                sessions: parseFloat(sessDiff.toFixed(1)),
            });
        }
        // Store snapshot every 60s
        const timer = setTimeout(() => {
            prevMetrics.current = { ...metrics };
        }, 60000);
        return () => clearTimeout(timer);
    }, [metrics]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <MetricCard
                title="Total Calls Today"
                value={metrics.totalCalls?.toString() || "0"}
                trend={trends.calls}
                icon={Phone}
                color="primary"
            />
            <MetricCard
                title="Avg Response Time"
                value={metrics.avgLatency ? (metrics.avgLatency / 1000).toFixed(1) : "0.0"}
                suffix="s"
                trend={trends.latency}
                icon={Clock}
                color="secondary"
            />
            <MetricCard
                title="STT Processing"
                value={metrics.sttTime ? (metrics.sttTime / 1000).toFixed(1) : "0.0"}
                suffix="s"
                trend={trends.stt}
                icon={CheckCircle2}
                color="success"
            />
            <MetricCard
                title="Active Sessions"
                value={metrics.activeSessions?.toString() || "0"}
                trend={trends.sessions}
                icon={Users}
                color="purple"
            />
        </div>
    );
};

export default HeroMetricsGrid;
