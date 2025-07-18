// useViewportDrawings.js - Hook for managing viewport-based drawing visibility
import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook that manages which drawings should be visible based on the current viewport
 * @param {Object} chart - Chart instance
 * @param {Array} allDrawings - Array of all drawing objects
 * @param {Function} getDrawingTimeRange - Function to extract time range from a drawing
 * @returns {Array} Array of drawings that should be visible in current viewport
 */
export const useViewportDrawings = (
  chart,
  allDrawings,
  getDrawingTimeRange,
) => {
  const [visibleDrawings, setVisibleDrawings] = useState([]);
  const [viewportTimeRange, setViewportTimeRange] = useState(null);
  const updateTimeoutRef = useRef(null);

  // Get current visible time range from chart
  const getVisibleTimeRange = useCallback(() => {
    if (!chart) return null;

    try {
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleRange();

      if (!visibleRange) return null;

      return {
        from: visibleRange.from,
        to: visibleRange.to,
      };
    } catch (error) {
      console.warn("Error getting visible time range:", error);
      return null;
    }
  }, [chart]);

  // Check if a drawing intersects with the viewport
  const isDrawingVisible = useCallback(
    (drawing, viewportRange) => {
      if (!viewportRange || !drawing) return false;

      try {
        const drawingRange = getDrawingTimeRange(drawing);
        if (!drawingRange) return false;

        // Add buffer zone (show drawings well before they come into view for smooth panning)
        const bufferPercent = 0.2; // 50% buffer on each side
        const rangeSize = viewportRange.to - viewportRange.from;
        const buffer = rangeSize * bufferPercent;

        const bufferedViewport = {
          from: viewportRange.from - buffer,
          to: viewportRange.to + buffer,
        };

        // Check if drawing time range intersects with buffered viewport
        return !(
          drawingRange.to < bufferedViewport.from ||
          drawingRange.from > bufferedViewport.to
        );
      } catch (error) {
        console.warn("Error checking drawing visibility:", error);
        return true; // Show drawing if we can't determine visibility
      }
    },
    [getDrawingTimeRange],
  );

  // Update visible drawings based on current viewport
  const updateVisibleDrawings = useCallback(() => {
    const currentViewport = getVisibleTimeRange();
    if (!currentViewport) {
      setVisibleDrawings(allDrawings);
      return;
    }

    setViewportTimeRange(currentViewport);

    const visible = allDrawings.filter((drawing) =>
      isDrawingVisible(drawing, currentViewport),
    );

    setVisibleDrawings(visible);
  }, [allDrawings, getVisibleTimeRange, isDrawingVisible]);

  // Debounced update function to avoid excessive recalculations
  const debouncedUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateVisibleDrawings();
    }, 50); // 50ms debounce
  }, [updateVisibleDrawings]);

  // Subscribe to chart viewport changes
  useEffect(() => {
    if (!chart) return;

    // Initial update
    updateVisibleDrawings();

    // Subscribe to time scale changes (pan/zoom)
    const timeScale = chart.timeScale();
    const unsubscribe =
      timeScale.subscribeVisibleTimeRangeChange(debouncedUpdate);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [chart, debouncedUpdate, updateVisibleDrawings]);

  // Update when drawings array changes
  useEffect(() => {
    updateVisibleDrawings();
  }, [allDrawings, updateVisibleDrawings]);

  return {
    visibleDrawings,
    viewportTimeRange,
    totalDrawings: allDrawings.length,
    visibleCount: visibleDrawings.length,
  };
};

// Helper functions for different drawing types
export const getPositionTimeRange = (position) => {
  if (!position._entryPrice || !position._targetPrice) return null;

  const entryTime = position._entryPrice.time;
  const targetTime = position._targetPrice.time;

  return {
    from: Math.min(entryTime, targetTime),
    to: Math.max(entryTime, targetTime),
  };
};

export const getRectangleTimeRange = (rectangle) => {
  if (!rectangle._p1 || !rectangle._p2) return null;

  return {
    from: Math.min(rectangle._p1.time, rectangle._p2.time),
    to: Math.max(rectangle._p1.time, rectangle._p2.time),
  };
};

export const getLineTimeRange = (line) => {
  if (!line._p1 || !line._p2) return null;

  return {
    from: Math.min(line._p1.time, line._p2.time),
    to: Math.max(line._p1.time, line._p2.time),
  };
};
