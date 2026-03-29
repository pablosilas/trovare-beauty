import { useEffect, useRef } from "react";

export function useAutoRefresh(fetchFn, interval = 30000) {
  const fetchRef = useRef(fetchFn);

  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    const tick = () => fetchRef.current();
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval]);
}