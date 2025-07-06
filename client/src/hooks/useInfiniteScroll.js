import { useEffect, useRef, useCallback } from "react";

// Usage: const { loaderRef } = useInfiniteScroll({ hasNext, isFetching, onLoadMore, offset: 200 });
export function useInfiniteScroll({
  hasNext,
  isFetching,
  onLoadMore,
  offset = 200,
}) {
  const loaderRef = useRef(null);

  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasNext && !isFetching) {
        onLoadMore();
      }
    },
    [hasNext, isFetching, onLoadMore],
  );

  useEffect(() => {
    if (!loaderRef.current) return;
    const option = {
      root: null,
      rootMargin: `0px 0px ${offset}px 0px`,
      threshold: 0,
    };
    const observer = new window.IntersectionObserver(handleObserver, option);
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver, offset]);

  return { loaderRef };
}
