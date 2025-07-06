// Utility functions for deleting boxes

/**
 * Deletes the currently selected box from the chart.
 * @param {object} rectangleDrawingTool - Ref to the RectangleDrawingTool instance
 * @param {object} boxesDataRef - Ref to the current boxes data
 * @param {string|number|null} selectedBoxId - The ID of the selected box
 * @param {function} clearSelectedBoxId - Function to clear the selected box ID
 */
export function deleteSelectedBox(
  rectangleDrawingTool,
  boxesDataRef,
  selectedBoxId,
  clearSelectedBoxId,
) {
  if (selectedBoxId) {
    const box = boxesDataRef.current.find((b) => b.id === selectedBoxId);
    if (box) {
      rectangleDrawingTool.current._removeRectangle(box);
    }
    clearSelectedBoxId();
  }
}

/**
 * Deletes all boxes from the chart.
 * @param {object} rectangleDrawingTool - Ref to the RectangleDrawingTool instance
 */
export function deleteAllBoxes(rectangleDrawingTool) {
  rectangleDrawingTool.current?.deleteAll();
}
