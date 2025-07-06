// Generalized from longPositionDeleteTools.js for both long and short positions
// Accepts a 'positionType' argument if needed for future branching

// Utility functions for deleting positions

/**
 * Deletes the currently selected position from the chart.
 * @param {object} positionDrawingTool - Ref to the PositionDrawingTool instance
 * @param {object} positionsDataRef - Ref to the current positions data
 * @param {string|number|null} selectedPositionId - The ID of the selected position
 * @param {function} clearSelectedPositionId - Function to clear the selected position ID
 */
export function deleteSelectedPosition(
  positionDrawingTool,
  positionsDataRef,
  selectedPositionId,
  clearSelectedPositionId,
) {
  if (selectedPositionId) {
    const pos = positionsDataRef.current.find(
      (p) => p.id === selectedPositionId,
    );
    if (pos) {
      positionDrawingTool.current._removePosition(pos);
    }
    clearSelectedPositionId();
  }
}

/**
 * Deletes all positions from the chart and clears the selected id.
 * @param {object} positionDrawingTool - Ref to the PositionDrawingTool instance
 * @param {function} clearSelectedPositionId - Function to clear the selected position ID
 */
export function deleteAllPositions(
  positionDrawingTool,
  clearSelectedPositionId,
) {
  positionDrawingTool.current?.deleteAll();
  if (clearSelectedPositionId) clearSelectedPositionId();
}
