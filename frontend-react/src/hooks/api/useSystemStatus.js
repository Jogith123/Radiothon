import { useQuery } from '@tanstack/react-query';
// import { apiClient } from '../../api/client';

export const useSystemStatus = () => {
    return useQuery({
        queryKey: ['systemStatus'],
        queryFn: async () => {
            // Mocking for now to avoid errors until backend endpoint exists
            // Ideally this would fetch from /api/status
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                backend: 'Online',
                websocket: 'Connected',
                activeSessions: 23,
                callsToday: 1247
            };
        },
        refetchInterval: 5000, // Poll every 5s for status
    });
};
