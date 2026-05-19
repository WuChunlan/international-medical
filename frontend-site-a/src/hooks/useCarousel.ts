import { useState, useEffect, useRef, useCallback } from 'react';

export function useCarousel(total: number, perPage = 3, interval = 4000) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pages = total <= perPage ? 1 : total;

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const start = useCallback(() => {
    stop();
    if (total <= perPage) return;
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % total);
    }, interval);
  }, [total, perPage, interval, stop]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  const prev = useCallback(() => {
    setIndex(i => (i - 1 + total) % total);
    start();
  }, [total, start]);

  const next = useCallback(() => {
    setIndex(i => (i + 1) % total);
    start();
  }, [total, start]);

  const visible = total === 0
    ? []
    : Array.from({ length: Math.min(perPage, total) }, (_, k) => (index + k) % total);

  return { index, visible, prev, next, hasMultiple: total > perPage, pages };
}
