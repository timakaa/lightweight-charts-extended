// useOptimizedSelection.js - Hook for optimized drawing selection management
import { useRef, useCallback } from "react";

/**
 * Hook that optimizes selection updates by only updating affected drawings
 * @param {Array} allDrawings - Array of all drawing objects
 * @returns {Object} Selection management functions
 */
export const useOptimizedSelection = (allDrawings) => {
  const previousSelectionRef = useRef({
    selectedId: null,
    hoveredId: null,
  });

  // Optimized selection update that only affects changed drawings
  const updateSelection = useCallback(
    (newSelectedId, newHoveredId) => {
      const prev = previousSelectionRef.current;

      // Track which drawings need updates
      const drawingsToUpdate = new Set();

      // Add previously selected/hovered drawings (need to be deselected)
      if (prev.selectedId && prev.selectedId !== newSelectedId) {
        const prevSelected = allDrawings.find((d) => d.id === prev.selectedId);
        if (prevSelected) drawingsToUpdate.add(prevSelected);
      }

      if (prev.hoveredId && prev.hoveredId !== newHoveredId) {
        const prevHovered = allDrawings.find((d) => d.id === prev.hoveredId);
        if (prevHovered) drawingsToUpdate.add(prevHovered);
      }

      // Add newly selected/hovered drawings (need to be selected)
      if (newSelectedId && newSelectedId !== prev.selectedId) {
        const newSelected = allDrawings.find((d) => d.id === newSelectedId);
        if (newSelected) drawingsToUpdate.add(newSelected);
      }

      if (newHoveredId && newHoveredId !== prev.hoveredId) {
        const newHovered = allDrawings.find((d) => d.id === newHoveredId);
        if (newHovered) drawingsToUpdate.add(newHovered);
      }

      // Update only the affected drawings
      drawingsToUpdate.forEach((drawing) => {
        const shouldShow =
          drawing.id === newSelectedId || drawing.id === newHoveredId;

        // Update handles visibility
        if (drawing.applyOptions) {
          drawing.applyOptions({ showHandles: shouldShow });
        }

        // Trigger re-render if needed
        if (drawing.requestUpdate) {
          drawing.requestUpdate();
        }
      });

      // Update tracking
      previousSelectionRef.current = {
        selectedId: newSelectedId,
        hoveredId: newHoveredId,
      };

      return drawingsToUpdate.size; // Return number of drawings updated for debugging
    },
    [allDrawings],
  );

  // Batch update for entry tapped logic (only for visible drawings)
  const updateEntryTappedLogic = useCallback((visibleDrawings, candleData) => {
    if (!candleData || !Array.isArray(candleData)) return;

    // Only process visible drawings instead of all drawings
    visibleDrawings.forEach((pos) => {
      if (!pos._entryPrice) {
        if (pos.setEntryTapped) pos.setEntryTapped(false);
        return;
      }

      const entryTime = pos._entryPrice.time;
      const entryPrice = pos._entryPrice.price;

      // Find the index of the entry candle
      const entryIdx = candleData.findIndex((c) => c.time === entryTime);
      if (entryIdx === -1) {
        if (pos.setEntryTapped) pos.setEntryTapped(false);
        return;
      }

      // Check all candles after entry (including entry candle)
      let tapped = false;
      for (let i = entryIdx; i < candleData.length; ++i) {
        const c = candleData[i];
        if (c.low <= entryPrice && entryPrice <= c.high) {
          tapped = true;
          break;
        }
      }

      if (pos.setEntryTapped) pos.setEntryTapped(tapped);
    });
  }, []);

  // Reset selection tracking (useful for timeframe/ticker changes)
  const resetSelection = useCallback(() => {
    previousSelectionRef.current = {
      selectedId: null,
      hoveredId: null,
    };
  }, []);

  return {
    updateSelection,
    updateEntryTappedLogic,
    resetSelection,
  };
};
