import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export const useCallSession = () => {
    const startCall = useMutation({
        mutationFn: (phoneNumber) => apiClient('/api/session/create', { method: 'POST', body: { phoneNumber } })
    });

    const endCall = useMutation({
        mutationFn: () => apiClient('/api/session/end', { method: 'POST', body: {} })
    });

    const sendDtmf = useMutation({
        mutationFn: (digit) => apiClient(`/ivr/menu?digit=${digit}`, { method: 'POST', body: {} })
    });

    return { startCall, endCall, sendDtmf };
};
