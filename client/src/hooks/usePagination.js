import { useState, useEffect, useRef } from "react";

export const usePagination = (chart, series, isLoading, data, setPage) => {
  const [page, setPageState] = useState(1);
  const isRequestingRef = useRef(false);

  // Reset requesting flag when chart or series changes (navigation)
  useEffect(() => {
    isRequestingRef.current = false;
  }, [chart, series]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRequestingRef.current = false;
    };
  }, []);

  // Pagination: subscribe to visible range and fetch more if needed
  useEffect(() => {
    if (!chart || !series) return;

    const timeScale = chart.timeScale();
    const handleRangeChange = () => {
      const range = timeScale.getVisibleLogicalRange();
      if (!range) return;

      if (
        range.from <= 2 &&
        !isLoading &&
        !isRequestingRef.current &&
        data?.pagination?.has_next
      ) {
        isRequestingRef.current = true;
        setPage((p) => p + 1);
      }
    };

    timeScale.subscribeVisibleLogicalRangeChange(handleRangeChange);
    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleRangeChange);
    };
  }, [chart, series, isLoading, data?.pagination?.has_next, setPage]);

  // Reset the requesting flag when loading completes
  useEffect(() => {
    if (!isLoading) {
      isRequestingRef.current = false;
    }
  }, [isLoading]);

  // Reset on page change
  useEffect(() => {
    isRequestingRef.current = false;
  }, [page]);

  // Reset when data changes (e.g., returning to backtest)
  useEffect(() => {
    if (data) {
      isRequestingRef.current = false;
    }
  }, [data]);

  return [page, setPageState];
};
