/**
 * WebSocket Service
 * Provides real-time updates to connected frontend clients
 * Port: 5050 (separate from main Express server on 3000)
 */

const WebSocket = require('ws');

let wss = null;
const clients = new Set();

/**
 * Initialize WebSocket server
 * @param {number} port - Port to run WebSocket server (default: 5050)
 */
function initializeWebSocket(port = 5050) {
    try {
        wss = new WebSocket.Server({ port });

        wss.on('connection', (ws) => {
            console.log('✅ WebSocket client connected');
            clients.add(ws);

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connection',
                message: 'Connected to Vidya Vani real-time server',
                timestamp: new Date().toISOString()
            }));

            // Handle client messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    console.log('📨 Received from client:', data);
                    // Handle client requests here if needed
                } catch (error) {
                    console.error('Error parsing client message:', error.message);
                }
            });

            // Handle disconnection
            ws.on('close', () => {
                console.log('❌ WebSocket client disconnected');
                clients.delete(ws);
            });

            // Handle errors
            ws.on('error', (error) => {
                console.error('WebSocket error:', error.message);
                clients.delete(ws);
            });
        });

        console.log(`✅ WebSocket server initialized on port ${port}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize WebSocket server:', error.message);
        return false;
    }
}

/**
 * Broadcast message to all connected clients
 * Non-blocking, catches all errors to prevent affecting main app
 * @param {Object} message - Message object to broadcast
 */
function broadcast(message) {
    if (!wss || clients.size === 0) {
        // No clients connected, silently return
        return;
    }

    const messageStr = JSON.stringify({
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
    });

    clients.forEach((client) => {
        try {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        } catch (error) {
            // Silently handle errors to prevent blocking main app
            console.error('Error broadcasting to client:', error.message);
            clients.delete(client);
        }
    });
}

/**
 * Broadcast call started event
 */
function broadcastCallStarted(callSid, fromNumber) {
    broadcast({
        type: 'call_started',
        event: 'call_started',
        callSid,
        fromNumber,
        message: `Incoming call from ${fromNumber}`
    });
}

/**
 * Broadcast question transcribed event
 */
function broadcastQuestionTranscribed(callSid, question, language) {
    broadcast({
        type: 'question_transcribed',
        event: 'question_transcribed',
        callSid,
        question,
        language,
        message: `Question transcribed (${language}): "${question.substring(0, 50)}..."`
    });
}

/**
 * Broadcast answer generated event
 */
function broadcastAnswerGenerated(callSid, answer, subject) {
    broadcast({
        type: 'answer_generated',
        event: 'answer_generated',
        callSid,
        answer: answer.substring(0, 200),
        subject,
        message: `Answer generated for ${subject}`
    });
}

/**
 * Broadcast Q&A saved to database
 */
function broadcastQASaved(data) {
    broadcast({
        type: 'qa_saved',
        event: 'qa_saved',
        data,
        message: `Q&A saved to database - Subject: ${data.subject}`
    });
}

/**
 * Broadcast call ended event
 */
function broadcastCallEnded(callSid, duration) {
    broadcast({
        type: 'call_ended',
        event: 'call_ended',
        callSid,
        duration,
        message: `Call ended - Duration: ${duration}s`
    });
}

/**
 * Broadcast pipeline stage update
 */
function broadcastPipelineStage(stage, status, callSid) {
    broadcast({
        type: 'pipeline',
        stage,
        status,
        callSid,
        message: `Pipeline: ${stage} - ${status}`
    });
}

/**
 * Broadcast metrics update
 */
function broadcastMetrics(metrics) {
    broadcast({
        type: 'metrics',
        ...metrics
    });
}

/**
 * Broadcast log message
 */
function broadcastLog(message, level = 'info') {
    broadcast({
        type: 'log',
        message,
        level
    });
}

/**
 * Get connected clients count
 */
function getConnectedClients() {
    return clients.size;
}

/**
 * Close WebSocket server
 */
function closeWebSocket() {
    if (wss) {
        wss.close();
        clients.clear();
        console.log('✅ WebSocket server closed');
    }
}

module.exports = {
    initializeWebSocket,
    broadcast,
    broadcastCallStarted,
    broadcastQuestionTranscribed,
    broadcastAnswerGenerated,
    broadcastQASaved,
    broadcastCallEnded,
    broadcastPipelineStage,
    broadcastMetrics,
    broadcastLog,
    getConnectedClients,
    closeWebSocket
};
