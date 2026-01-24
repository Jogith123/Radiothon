import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { useWebSocket } from '../../context/WebSocketContext';

const Terminal = () => {
    const { logs, clearLogs } = useWebSocket();
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-[#0d1117] rounded-xl border border-slate-800 flex flex-col h-[600px] shadow-2xl overflow-hidden font-mono text-xs md:text-sm">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center select-none">
                <div className="flex items-center gap-2 text-slate-400">
                    <TerminalIcon size={14} />
                    <span className="font-semibold">System Output</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={clearLogs}
                        aria-label="Clear log entries"
                        className="hover:text-white text-slate-500 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {logs.length === 0 && (
                    <div className="text-slate-600 italic">Waiting for system logs...</div>
                )}
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2 hover:bg-white/5 px-2 -mx-2 rounded transition-colors">
                        <span className="text-slate-500 min-w-[80px]">{log.timestamp}</span>
                        <span className={`font-bold min-w-[70px] ${log.type === 'error' ? 'text-red-400' :
                            log.type === 'success' ? 'text-green-400' :
                                log.type === 'warning' ? 'text-yellow-400' :
                                    'text-blue-400'
                            }`}>[{log.source}]</span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default Terminal;
