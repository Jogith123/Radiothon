import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export const useSystemStatus = () => {
    return useQuery({
        queryKey: ['systemStatus'],
        queryFn: async () => {
            try {
                const data = await apiClient('/api/status');
                return {
                    backend: data.backend || 'Online',
                    websocket: data.websocket || 'Unknown',
                    activeSessions: data.activeSessions || 0,
                    callsToday: data.callsToday || 0,
                    mongodb: data.mongodb,
                    openai: data.openai
                };
            } catch {
                return {
                    backend: 'Offline',
                    websocket: 'Disconnected',
                    activeSessions: 0,
                    callsToday: 0
                };
            }
        },
        refetchInterval: 5000,
    });
};
