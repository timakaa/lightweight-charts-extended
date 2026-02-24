// Generalized from useLongPositionKeyboardShortcuts.js for both long and short positions
// Accepts a 'positionType' argument if needed for future branching

import { useEffect } from "react";

// Handles Backspace for deleting selected position
function usePositionKeyboardShortcuts(
  selectedPositionId,
  deleteSelectedPosition,
) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Backspace" && selectedPositionId) {
        e.preventDefault();
        deleteSelectedPosition();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPositionId, deleteSelectedPosition]);
}

export default usePositionKeyboardShortcuts;
