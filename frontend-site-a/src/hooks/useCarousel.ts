import { useState, useEffect, useRef, useCallback } from 'react';

export function useCarousel(total: number, perPage = 3, interval = 4000) {
  const totalPages = total <= perPage ? 1 : Math.ceil(total / perPage);
  const [page, setPage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const start = useCallback(() => {
    stop();
    if (totalPages <= 1) return;
    timerRef.current = setInterval(() => {
      setPage(p => (p + 1) % totalPages);
    }, interval);
  }, [totalPages, interval, stop]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  // Reset to page 0 when total changes (e.g. data loads)
  useEffect(() => { setPage(0); }, [total]);

  const prev = useCallback(() => {
    setPage(p => (p - 1 + totalPages) % totalPages);
    start();
  }, [totalPages, start]);

  const next = useCallback(() => {
    setPage(p => (p + 1) % totalPages);
    start();
  }, [totalPages, start]);

  const startIdx = page * perPage;
  const visible = total === 0
    ? []
    : Array.from({ length: Math.min(perPage, total - startIdx) }, (_, k) => startIdx + k);

  return {
    index: page,
    visible,
    prev,
    next,
    hasMultiple: totalPages > 1,
    pages: totalPages,
  };
}
