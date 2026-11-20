import { useEffect, useReducer, useState } from 'react';

interface Result<T> {
  key: number;
  load: (signal: AbortSignal) => Promise<T>;
  data?: T;
  failed: boolean;
}

export function useLoad<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [key, refresh] = useReducer(value => value + 1, 0);
  const [result, setResult] = useState<Result<T>>();

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ key, load, data, failed: false });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key, load, failed: true });
    });
    return () => controller.abort();
  }, [key, load]);

  const current = result?.load === load && result.key === key ? result : undefined;
  return { data: current?.data, failed: current?.failed ?? false, loading: !current, refresh };
}
