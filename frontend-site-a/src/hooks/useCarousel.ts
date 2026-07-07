import { useState, useEffect, useRef, useCallback } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';

export function useCarousel(total: number, perPage = 3, interval = 4000) {
  // 手机端：一次性展示全部卡片（横滑），关闭分页/自动轮播
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const effectivePerPage = isMobile ? Math.max(total, 1) : perPage;
  const totalPages = total <= effectivePerPage ? 1 : Math.ceil(total / effectivePerPage);
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

  // Reset to page 0 when total changes (e.g. data loads) or viewport crosses breakpoint
  useEffect(() => { setPage(0); }, [total, isMobile]);

  const prev = useCallback(() => {
    setPage(p => (p - 1 + totalPages) % totalPages);
    start();
  }, [totalPages, start]);

  const next = useCallback(() => {
    setPage(p => (p + 1) % totalPages);
    start();
  }, [totalPages, start]);

  const startIdx = page * effectivePerPage;
  const visible = total === 0
    ? []
    : Array.from({ length: Math.min(effectivePerPage, total - startIdx) }, (_, k) => startIdx + k);

  return {
    index: page,
    visible,
    prev,
    next,
    hasMultiple: totalPages > 1,
    pages: totalPages,
  };
}
