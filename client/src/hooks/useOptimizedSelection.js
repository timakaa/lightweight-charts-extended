// useOptimizedSelection.js - Generic hook for optimized drawing selection management
import { useRef, useCallback } from "react";

/**
 * Generic hook that optimizes selection updates by only updating affected drawings
 * Works with any drawing type (positions, lines, boxes, fib retracements, etc.)
 * @param {Array} allDrawings - Array of all drawing objects
 * @param {Object} options - Configuration options
 * @param {Function} options.customUpdateLogic - Optional custom logic for specific drawing types
 * @returns {Object} Selection management functions
 */
export const useOptimizedSelection = (allDrawings, options = {}) => {
  const previousSelectionRef = useRef({
    selectedId: null,
    hoveredId: null,
  });

  // Generic optimized selection update that only affects changed drawings
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

        // Generic handle visibility update (works for all drawing types)
        if (drawing.applyOptions) {
          drawing.applyOptions({ showHandles: shouldShow });
        }

        // Apply custom update logic if provided
        if (options.customUpdateLogic) {
          options.customUpdateLogic(
            drawing,
            shouldShow,
            newSelectedId,
            newHoveredId,
          );
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
    [allDrawings, options],
  );

  // Generic batch update for drawing-specific logic (only for visible drawings)
  const updateDrawingSpecificLogic = useCallback(
    (visibleDrawings, candleData, logicType = "entryTapped") => {
      if (!candleData || !Array.isArray(candleData)) return;

      // Only process visible drawings instead of all drawings
      visibleDrawings.forEach((drawing) => {
        if (logicType === "entryTapped") {
          // Entry tapped logic for position drawings
          if (!drawing._entryPrice) {
            if (drawing.setEntryTapped) drawing.setEntryTapped(false);
            return;
          }

          const entryTime = drawing._entryPrice.time;
          const entryPrice = drawing._entryPrice.price;

          // Find the index of the entry candle
          const entryIdx = candleData.findIndex((c) => c.time === entryTime);
          if (entryIdx === -1) {
            if (drawing.setEntryTapped) drawing.setEntryTapped(false);
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

          if (drawing.setEntryTapped) drawing.setEntryTapped(tapped);
        }
        // Add other drawing-specific logic types here as needed
      });
    },
    [],
  );

  // Reset selection tracking (useful for timeframe/ticker changes)
  const resetSelection = useCallback(() => {
    previousSelectionRef.current = {
      selectedId: null,
      hoveredId: null,
    };
  }, []);

  return {
    updateSelection,
    updateDrawingSpecificLogic,
    resetSelection,
    // Legacy alias for backward compatibility
    updateEntryTappedLogic: (visibleDrawings, candleData) =>
      updateDrawingSpecificLogic(visibleDrawings, candleData, "entryTapped"),
  };
};

/**
 * Specialized hook for position drawings (long/short) with entry tapped logic
 * @param {Array} allDrawings - Array of position drawing objects
 * @returns {Object} Position-specific selection management functions
 */
export const useOptimizedPositionSelection = (allDrawings) => {
  return useOptimizedSelection(allDrawings, {
    customUpdateLogic: (drawing, shouldShow, selectedId, hoveredId) => {
      // Position-specific logic can be added here if needed
      // For now, the generic logic handles everything
    },
  });
};

/**
 * Specialized hook for line drawings
 * @param {Array} allDrawings - Array of line drawing objects
 * @returns {Object} Line-specific selection management functions
 */
export const useOptimizedLineSelection = (allDrawings) => {
  return useOptimizedSelection(allDrawings, {
    customUpdateLogic: (drawing, shouldShow, selectedId, hoveredId) => {
      // Line-specific selection logic if needed
      if (drawing.setSelectedLineId) {
        drawing.setSelectedLineId(selectedId);
      }
    },
  });
};

/**
 * Specialized hook for box/rectangle drawings
 * @param {Array} allDrawings - Array of box drawing objects
 * @returns {Object} Box-specific selection management functions
 */
export const useOptimizedBoxSelection = (allDrawings) => {
  return useOptimizedSelection(allDrawings);
};

/**
 * Specialized hook for fibonacci retracement drawings
 * @param {Array} allDrawings - Array of fib retracement drawing objects
 * @returns {Object} Fib-specific selection management functions
 */
export const useOptimizedFibSelection = (allDrawings) => {
  return useOptimizedSelection(allDrawings);
};
