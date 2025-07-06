import { useState, useEffect, useRef } from "react";

export const usePagination = (chart, series, isLoading, data, setPage) => {
  const [page, setPageState] = useState(1);
  const loadingRef = useRef(false);

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
        data?.pagination?.has_next &&
        !loadingRef.current
      ) {
        loadingRef.current = true;
        setPage((p) => p + 1);
        setTimeout(() => {
          loadingRef.current = false;
        }, 500);
      }
    };

    timeScale.subscribeVisibleLogicalRangeChange(handleRangeChange);
    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleRangeChange);
    };
  }, [chart, series, isLoading, data?.pagination?.has_next, setPage]);

  return [page, setPageState];
};
