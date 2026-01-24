/**
 * Dashboard Page
 * Main overview page with metrics, pipeline visualization, charts, and activity feed.
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Radio } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Components
import { PageHeader, Button } from '../components/common';
import HeroMetricsGrid from '../components/dashboard/HeroMetricsGrid';
import PipelineVisualizer from '../components/dashboard/PipelineVisualizer';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import ChartsSection from '../components/dashboard/ChartsSection';

// Hooks & Context
import { useWebSocket } from '../context/WebSocketContext';

// Motion presets
import { containerVariants, cardVariants } from '../lib/motion';

const Dashboard = () => {
    const navigate = useNavigate();
    const { metrics, logs } = useWebSocket();

    const handleExport = useCallback(() => {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        // Title
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text("Vidya Vani - System Report", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated: ${timestamp}`, 14, 28);
        doc.text('Confidential - Internal Use Only', 14, 33);

        // Metrics Section
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text("System Metrics", 14, 45);

        const metricsData = [
            ["Total Calls Today", metrics.totalCalls || "0"],
            ["Active Sessions", metrics.activeSessions || "0"],
            ["Avg Response Time", `${metrics.avgLatency || 0} ms`],
            ["STT Speed", `${metrics.sttTime || 0} ms`],
            ["LLM Speed", `${metrics.llmTime || 0} ms`],
            ["TTS Speed", `${metrics.ttsTime || 0} ms`]
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Metric', 'Value']],
            body: metricsData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: 'bold', width: 80 } }
        });

        // Logs Section
        const finalY = doc.lastAutoTable.finalY || 100;
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text("Recent Activity Log", 14, finalY + 15);

        const logsData = logs.map(log => [
            log.timestamp,
            log.type ? log.type.toUpperCase() : 'INFO',
            log.source || 'System',
            log.message || ''
        ]);

        autoTable(doc, {
            startY: finalY + 20,
            head: [['Time', 'Type', 'Source', 'Details']],
            body: logsData,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { width: 25 }, 1: { width: 20 }, 2: { width: 25 } }
        });

        doc.save(`vidyavani_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    }, [metrics, logs]);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <PageHeader
                title="System Overview"
                description="Real-time metrics and performance analytics"
                actions={
                    <>
                        <Button variant="outline" icon={Download} onClick={handleExport}>
                            Export Report
                        </Button>
                        <Button variant="primary" icon={Radio} onClick={() => navigate('/calls')}>
                            Live View
                        </Button>
                    </>
                }
            />

            <HeroMetricsGrid />

            <motion.div
                variants={cardVariants}
                className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8"
            >
                <div className="xl:col-span-2">
                    <PipelineVisualizer />
                    <ChartsSection />
                </div>
                <div className="xl:col-span-1">
                    <ActivityFeed />
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;

