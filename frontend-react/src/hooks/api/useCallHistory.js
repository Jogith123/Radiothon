/**
 * useCallHistory Hook
 * Fetches call history from the backend API with filters and pagination
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

/**
 * Fetch call history with optional filters
 * @param {Object} filters - Query filters
 * @param {string} filters.phoneNumber - Filter by phone number
 * @param {string} filters.subject - Filter by subject
 * @param {number} filters.limit - Max records to return
 * @param {number} filters.skip - Number of records to skip
 */
const fetchCallHistory = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.phoneNumber) params.append('phoneNumber', filters.phoneNumber);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.skip) params.append('skip', filters.skip.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/api/history?${queryString}` : '/api/history';

    return await apiClient(endpoint);
};

/**
 * Hook to fetch call history
 * @param {Object} filters - Query filters
 * @param {Object} options - React Query options
 */
export const useCallHistory = (filters = {}, options = {}) => {
    return useQuery({
        queryKey: ['callHistory', filters],
        queryFn: () => fetchCallHistory(filters),
        staleTime: 10000, // Consider data fresh for 10 seconds
        ...options
    });
};

/**
 * Fetch stats from backend
 */
const fetchStats = async (phoneNumber) => {
    const endpoint = phoneNumber ? `/api/stats?phoneNumber=${phoneNumber}` : '/api/stats';
    return await apiClient(endpoint);
};

/**
 * Hook to fetch statistics
 */
export const useStats = (phoneNumber, options = {}) => {
    return useQuery({
        queryKey: ['stats', phoneNumber],
        queryFn: () => fetchStats(phoneNumber),
        staleTime: 30000,
        ...options
    });
};

/**
 * Fetch active calls
 */
const fetchActiveCalls = async () => {
    return await apiClient('/api/calls/active');
};

/**
 * Hook to fetch active calls
 */
export const useActiveCalls = (options = {}) => {
    return useQuery({
        queryKey: ['activeCalls'],
        queryFn: fetchActiveCalls,
        refetchInterval: 5000, // Refetch every 5 seconds
        ...options
    });
};
