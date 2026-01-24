import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

// Configuration constants
const MAX_LOG_ENTRIES = 100;
const WS_RECONNECT_DELAY_MS = 3000;

const WebSocketContext = createContext({
    isConnected: false,
    logs: [],
    pipelineState: {},
    metrics: {},
    sendMessage: () => { },
    clearLogs: () => { },
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState([]);
    const [pipelineState, setPipelineState] = useState({});
    const [metrics, setMetrics] = useState({
        totalCalls: 0,
        activeSessions: 0,
        avgLatency: 0,
        sttTime: 0,
        llmTime: 0,
        ttsTime: 0
    });
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // const wsUrl = `${wsProtocol}//${window.location.hostname}:5050`;
        const wsUrl = `ws://localhost:5050`; // Hardcoded for local dev if needed, or derived

        console.log('Connecting to WS:', wsUrl);

        try {
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log('✅ WebSocket Connected');
                setIsConnected(true);
                addLog('System', 'Connected to real-time server', 'success');
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleMessage(data);
                } catch (e) {
                    console.error('Failed to parse WS message', e);
                }
            };

            socket.onclose = () => {
                console.log('❌ WebSocket Disconnected');
                setIsConnected(false);
                // Reconnect logic
                reconnectTimeoutRef.current = setTimeout(connect, WS_RECONNECT_DELAY_MS);
            };

            socket.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setIsConnected(false);
            };
        } catch (err) {
            console.error("WS Connection failed", err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) socketRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connect]);

    const handleMessage = (data) => {
        // Handle specific event types
        if (data.type === 'log') {
            addLog('Backend', data.message, data.level || 'info');
        }
        else if (data.type === 'pipeline') {
            // Backend sends { type: 'pipeline', stage: 'stt', status: 'active' }
            if (data.status === 'active' || data.status === 'processing') {
                setPipelineState(prev => ({ ...prev, activeStage: data.stage }));
            }
            addLog('Pipeline', `Stage: ${data.stage} (${data.status})`, 'info');
        }
        else if (data.type === 'metrics') {
            // Backend sends real-time metrics
            setMetrics({
                totalCalls: data.totalCalls || 0,
                activeSessions: data.activeSessions || 0,
                avgLatency: data.avgLatency || 0,
                sttTime: data.sttTime || 0,
                llmTime: data.llmTime || 0,
                ttsTime: data.ttsTime || 0
            });
        }
        else if (data.event) {
            // Legacy/Broadcast events (call_start, etc.)
            addLog('System', `Event: ${data.event}`, 'info');
        }
        else if (data.message) {
            // Standard log message from broadcast()
            addLog('Server', data.message, data.level || 'info');
        }
        else {
            // Generic fallback
            const msg = typeof data === 'string' ? data : JSON.stringify(data);
            addLog('Debug', msg, 'error');
        }
    };

    const addLog = (source, message, type = 'info') => {
        setLogs(prev => [{
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            source,
            message,
            type
        }, ...prev].slice(0, MAX_LOG_ENTRIES)); // Keep last MAX_LOG_ENTRIES logs
    };

    const sendMessage = (msg) => {
        if (socketRef.current && isConnected) {
            socketRef.current.send(JSON.stringify(msg));
        }
    };

    const clearLogs = () => setLogs([]);

    return (
        <WebSocketContext.Provider value={{ isConnected, logs, pipelineState, metrics, sendMessage, clearLogs }}>
            {children}
        </WebSocketContext.Provider>
    );
};
