import { useState, useEffect, useCallback, useRef } from 'react';
import { mirrorAPI } from '../services/api';

/**
 * React hook for querying Hedera Mirror Node
 * Provides loading states, error handling, auto-refresh, and cache info
 *
 * @param {Function} queryFn - Async function that fetches data from Mirror Node
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to run the query (default: true)
 * @param {number} options.refetchInterval - Auto-refetch interval in ms (default: 0 = disabled)
 * @param {Array} options.dependencies - Dependencies to trigger refetch (default: [])
 *
 * @returns {Object} { data, loading, error, cacheInfo, refetch }
 */
export function useMirrorQuery(queryFn, options = {}) {
  const {
    enabled = true,
    refetchInterval = 0,
    dependencies = [],
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(null);

  // Use ref to store queryFn to avoid dependency issues
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await queryFnRef.current();

      // Extract data and cache info from response
      const responseData = response.data;

      setData(responseData.data);
      setCacheInfo({
        source: responseData.source || 'unknown',
        cost: responseData.cost || 'N/A',
        cached: responseData.cached || false,
        cacheAge: responseData.cacheAge || 0,
        message: responseData.message || '',
      });

    } catch (err) {
      console.error('Mirror query error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch data');
      setData(null);
      setCacheInfo(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Initial fetch and dependency-triggered refetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  // Auto-refetch interval
  useEffect(() => {
    if (!refetchInterval || refetchInterval <= 0) return;

    const intervalId = setInterval(fetchData, refetchInterval);

    return () => clearInterval(intervalId);
  }, [refetchInterval, fetchData]);

  return {
    data,
    loading,
    error,
    cacheInfo,
    refetch: fetchData,
  };
}

/**
 * Hook specifically for waitlist queries
 */
export function useMirrorWaitlist(organType) {
  return useMirrorQuery(
    () => mirrorAPI.getWaitlist(organType),
    {
      dependencies: [organType],
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    }
  );
}

/**
 * Hook specifically for statistics queries
 */
export function useMirrorStats() {
  return useMirrorQuery(
    () => mirrorAPI.getStats(),
    {
      refetchInterval: 0, // Disabled auto-refresh - data is cached, use manual refresh button
    }
  );
}

/**
 * Hook for patient position queries
 */
export function useMirrorPatientPosition(patientHash, organType) {
  return useMirrorQuery(
    () => mirrorAPI.getPatientPosition(patientHash, organType),
    {
      enabled: !!patientHash && !!organType,
      dependencies: [patientHash, organType],
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    }
  );
}

export default useMirrorQuery;
