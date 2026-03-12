'use client';

import { useEffect, useState, useCallback } from 'react';
import { getFingerprint, getFingerprintData, resetFingerprint } from '@/lib/utils/fingerprint';

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initFingerprint() {
      try {
        const fp = await getFingerprint();
        if (mounted) {
          setFingerprint(fp);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to get fingerprint'));
          setLoading(false);
        }
      }
    }

    initFingerprint();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshFingerprint = useCallback(async () => {
    setLoading(true);
    try {
      await resetFingerprint();
      const fp = await getFingerprint();
      setFingerprint(fp);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh fingerprint'));
    } finally {
      setLoading(false);
    }
  }, []);

  const getData = useCallback(async () => {
    return getFingerprintData();
  }, []);

  return {
    fingerprint,
    loading,
    error,
    refreshFingerprint,
    getData,
  };
}
