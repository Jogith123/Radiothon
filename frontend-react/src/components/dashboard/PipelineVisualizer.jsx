/**
 * PipelineVisualizer Component
 * Displays the live processing pipeline with animated stage transitions.
 */

import React, { useEffect, useState } from 'react';
import { Mic, FileText, Database, Cpu, Speaker, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWebSocket } from '../../context/WebSocketContext';
import { cardVariants, stageVariants, transitions } from '../../lib/motion';

const stages = [
    { id: 'recording', label: 'Recording', icon: Mic, color: 'text-red-500' },
    { id: 'stt', label: 'Speech to Text', icon: FileText, color: 'text-blue-500' },
    { id: 'rag', label: 'RAG Retrieval', icon: Database, color: 'text-purple-500' },
    { id: 'llm', label: 'AI Processing', icon: Cpu, color: 'text-amber-500' },
    { id: 'tts', label: 'Text to Speech', icon: Speaker, color: 'text-green-500' },
    { id: 'delivery', label: 'Delivery', icon: Send, color: 'text-teal-500' },
];

const PipelineVisualizer = React.memo(() => {
    const { pipelineState } = useWebSocket();
    const [activeStage, setActiveStage] = useState(null);

    useEffect(() => {
        if (pipelineState?.activeStage) {
            setActiveStage(pipelineState.activeStage);
        }
    }, [pipelineState]);

    const getProgressWidth = () => {
        if (!activeStage) return '0%';
        const index = stages.findIndex(s => s.id === activeStage);
        return `${((index + 1) / stages.length) * 100}%`;
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="glass p-6 rounded-2xl mb-8"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-2 h-2 rounded-full bg-green-500"
                    />
                    Live Processing Pipeline
                </h3>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    ID: #{pipelineState?.sessionId || 'IDLE'}
                </span>
            </div>

            <div className="relative">
                {/* Background Line */}
                <div className="absolute top-6 left-0 w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full" />

                {/* Active Progress Line */}
                <motion.div
                    className="absolute top-6 left-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: getProgressWidth() }}
                    transition={transitions.smooth}
                />

                <div className="flex justify-between relative z-10">
                    {stages.map((stage, index) => {
                        const isActive = activeStage === stage.id;
                        const isPast = activeStage && stages.findIndex(s => s.id === activeStage) > index;

                        return (
                            <StageNode
                                key={stage.id}
                                stage={stage}
                                isActive={isActive}
                                isPast={isPast}
                            />
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
});

/**
 * Individual stage node in the pipeline
 */
const StageNode = React.memo(({ stage, isActive, isPast }) => {
    const Icon = stage.icon;

    return (
        <div className="flex flex-col items-center gap-3">
            <motion.div
                variants={stageVariants}
                animate={isActive ? 'active' : isPast ? 'complete' : 'idle'}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-4 bg-white dark:bg-surface-dark transition-colors duration-300 ${isActive || isPast
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-slate-200 dark:border-slate-700'
                    }`}
            >
                <Icon
                    size={20}
                    className={isActive || isPast ? stage.color : 'text-slate-300 dark:text-slate-600'}
                />
            </motion.div>

            <span className={`text-xs font-medium ${isActive ? 'text-primary font-bold' : 'text-slate-500'}`}>
                {stage.label}
            </span>

            {/* Status Pill */}
            <div className="h-1.5 w-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 mt-1">
                {isActive && (
                    <motion.div
                        className="h-full bg-secondary"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    />
                )}
                {isPast && <div className="h-full bg-success w-full" />}
            </div>
        </div>
    );
});

PipelineVisualizer.displayName = 'PipelineVisualizer';
StageNode.displayName = 'StageNode';

export default PipelineVisualizer;

