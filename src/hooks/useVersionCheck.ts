'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

const STALE_TIME = 3 * 60 * 1000; // don't re-check more than once every 3 minutes

async function fetchVersion(): Promise<string | null> {
  const res = await fetch('/api/version');
  if (!res.ok) return null;
  const data = await res.json();
  return data.releasedAt ?? null;
}

export function useVersionCheck() {
  const initialVersion = useRef<string | null | undefined>(undefined);

  const { data } = useQuery({
    queryKey: ['app-version'],
    queryFn: fetchVersion,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    staleTime: STALE_TIME,
  });

  useEffect(() => {
    if (data === undefined) return;

    if (initialVersion.current === undefined) {
      initialVersion.current = data;
      return;
    }

    if (data !== null && data !== initialVersion.current) {
      window.location.reload();
    }
  }, [data]);
}
