/**
 * Redis Session Service
 * Handles user session storage in Redis for scalability
 */

const redis = require('redis');
let redisClient = null;

/**
 * Initialize Redis connection
 */
async function initializeRedis() {
    try {
        redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            retry_delay_on_failover: 100,
            enable_offline_queue: false
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        await redisClient.connect();
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to Redis:', error.message);
        return false;
    }
}

/**
 * Store user session in Redis
 */
async function storeSession(callSid, sessionData) {
    try {
        const key = `session:${callSid}`;
        await redisClient.setEx(key, 3600, JSON.stringify(sessionData)); // 1 hour expiry
        return true;
    } catch (error) {
        console.error('Error storing session:', error.message);
        return false;
    }
}

/**
 * Get user session from Redis
 */
async function getSession(callSid) {
    try {
        const key = `session:${callSid}`;
        const sessionData = await redisClient.get(key);
        return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
        console.error('Error retrieving session:', error.message);
        return null;
    }
}

/**
 * Update user session in Redis
 */
async function updateSession(callSid, updates) {
    try {
        const existingSession = await getSession(callSid);
        if (existingSession) {
            const updatedSession = { ...existingSession, ...updates };
            await storeSession(callSid, updatedSession);
            return updatedSession;
        }
        return null;
    } catch (error) {
        console.error('Error updating session:', error.message);
        return null;
    }
}

/**
 * Delete user session from Redis
 */
async function deleteSession(callSid) {
    try {
        const key = `session:${callSid}`;
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error('Error deleting session:', error.message);
        return false;
    }
}

/**
 * Check if Redis is connected
 */
function isRedisConnected() {
    return redisClient && redisClient.isOpen;
}

/**
 * Close Redis connection
 */
async function closeRedisConnection() {
    if (redisClient) {
        await redisClient.quit();
        console.log('Redis connection closed');
    }
}

module.exports = {
    initializeRedis,
    storeSession,
    getSession,
    updateSession,
    deleteSession,
    isRedisConnected,
    closeRedisConnection
};
