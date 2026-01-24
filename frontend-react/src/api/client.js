const BASE_URL = 'http://localhost:3000';

export const apiClient = async (endpoint, { method = 'GET', body, ...customConfig } = {}) => {
    const headers = { 'Content-Type': 'application/json' };

    const config = {
        method,
        headers,
        ...customConfig,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorBody = await response.text().catch(() => 'No response body');
        throw new Error(`API Error: ${method} ${endpoint} failed (${response.status}): ${errorBody.slice(0, 100)}`);
    }

    return response.json();
};
