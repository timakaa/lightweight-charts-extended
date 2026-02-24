// lineDeleteTools.js - Utility functions for deleting lines from the chart

/**
 * Deletes the currently selected line from the chart.
 * @param {object} lineDrawingTool - Ref to the LineDrawingTool instance
 * @param {object} linesDataRef - Ref to the current lines data
 * @param {string|number|null} selectedLineId - The ID of the selected line
 * @param {function} clearSelectedLineId - Function to clear the selected line ID
 */
export function deleteSelectedLine(
  lineDrawingTool,
  linesDataRef,
  selectedLineId,
  clearSelectedLineId,
) {
  // Only delete if a line is selected
  if (selectedLineId) {
    // Find the line object by ID
    const line = linesDataRef.current.find((l) => l.id === selectedLineId);
    if (line) {
      // Remove the line from the chart
      lineDrawingTool.current._removeLine(line);
    }
    // Clear the selected line ID
    clearSelectedLineId();
  }
}

/**
 * Deletes all lines from the chart.
 * @param {object} lineDrawingTool - Ref to the LineDrawingTool instance
 */
export function deleteAllLines(lineDrawingTool) {
  // Call deleteAll on the tool to remove all lines
  lineDrawingTool.current?.deleteAll();
}
