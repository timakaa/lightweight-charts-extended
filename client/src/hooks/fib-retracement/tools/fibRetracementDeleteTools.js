// Utility functions for deleting fib retracements

/**
 * deleteSelectedFibRetracement
 *
 * Deletes the currently selected fib retracement from the chart.
 * - Finds the retracement by selected ID.
 * - Removes it from the drawing tool and clears selection.
 *
 * @param {object} fibRetracementDrawingTool - Ref to the FibRetracementDrawingTool instance
 * @param {object} fibRetracementsDataRef - Ref to the current fib retracements data
 * @param {string|number|null} selectedFibRetracementId - The ID of the selected fib retracement
 * @param {function} clearSelectedFibRetracementId - Function to clear the selected fib retracement ID
 */
export function deleteSelectedFibRetracement(
  fibRetracementDrawingTool,
  fibRetracementsDataRef,
  selectedFibRetracementId,
  clearSelectedFibRetracementId,
) {
  if (selectedFibRetracementId) {
    const fib = fibRetracementsDataRef.current.find(
      (b) => b.id === selectedFibRetracementId,
    );
    if (fib) {
      fibRetracementDrawingTool.current._removeRetracement(fib);
    }
    clearSelectedFibRetracementId();
  }
}

/**
 * deleteAllFibRetracements
 *
 * Deletes all fib retracements from the chart.
 *
 * @param {object} fibRetracementDrawingTool - Ref to the FibRetracementDrawingTool instance
 */
export function deleteAllFibRetracements(fibRetracementDrawingTool) {
  fibRetracementDrawingTool.current?.deleteAll();
}
