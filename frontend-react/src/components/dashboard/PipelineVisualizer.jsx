/**
 * PipelineVisualizer — flat, clean processing pipeline
 */

import React, { useEffect, useState } from 'react';
import { Mic, FileText, Database, Cpu, Speaker, Send } from 'lucide-react';
import { useWebSocket } from '../../context/WebSocketContext';

const stages = [
    { id: 'recording', label: 'Recording', icon: Mic },
    { id: 'stt', label: 'Speech to Text', icon: FileText },
    { id: 'rag', label: 'RAG Retrieval', icon: Database },
    { id: 'llm', label: 'AI Processing', icon: Cpu },
    { id: 'tts', label: 'Text to Speech', icon: Speaker },
    { id: 'delivery', label: 'Delivery', icon: Send },
];

const PipelineVisualizer = React.memo(() => {
    const { pipelineState } = useWebSocket();
    const [activeStage, setActiveStage] = useState(null);

    useEffect(() => {
        if (pipelineState?.activeStage) {
            setActiveStage(pipelineState.activeStage);
        }
    }, [pipelineState]);

    return (
        <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                    Processing Pipeline
                </h3>
                <span className="text-xs font-mono text-[#6B7280] bg-[#F0F2F5] px-2 py-1 rounded">
                    ID: #{pipelineState?.sessionId || 'IDLE'}
                </span>
            </div>

            <div className="relative">
                {/* Background Line */}
                <div className="absolute top-5 left-0 w-full h-px bg-[#E5E7EB]" />

                {/* Active Progress */}
                {activeStage && (
                    <div
                        className="absolute top-5 left-0 h-px bg-[#1E293B] transition-all duration-500"
                        style={{ width: `${((stages.findIndex(s => s.id === activeStage) + 1) / stages.length) * 100}%` }}
                    />
                )}

                <div className="flex justify-between relative z-10">
                    {stages.map((stage, index) => {
                        const isActive = activeStage === stage.id;
                        const isPast = activeStage && stages.findIndex(s => s.id === activeStage) > index;
                        const Icon = stage.icon;

                        return (
                            <div key={stage.id} className="flex flex-col items-center gap-2">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-colors ${
                                        isActive ? 'border-[#1E293B]' :
                                        isPast ? 'border-[#1E293B] bg-[#1E293B]' :
                                        'border-[#E5E7EB]'
                                    }`}
                                >
                                    <Icon
                                        size={16}
                                        className={isPast ? 'text-white' : isActive ? 'text-[#1E293B]' : 'text-[#D1D5DB]'}
                                    />
                                </div>
                                <span className={`text-[11px] font-medium ${isActive ? 'text-[#1E293B]' : 'text-[#6B7280]'}`}>
                                    {stage.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

PipelineVisualizer.displayName = 'PipelineVisualizer';

export default PipelineVisualizer;

