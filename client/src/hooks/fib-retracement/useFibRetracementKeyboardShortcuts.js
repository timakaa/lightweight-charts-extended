// useFibRetracementKeyboardShortcuts.js - React hook for handling keyboard shortcuts for fib retracement actions
import { useEffect } from "react";

/**
 * useFibRetracementKeyboardShortcuts
 *
 * Handles Backspace for deleting selected fib retracement:
 * - Listens for Backspace key.
 * - If a retracement is selected, deletes it and prevents default.
 *
 * @param {string|null} selectedFibRetracementId - ID of selected retracement
 * @param {function} deleteSelectedFibRetracement - Callback to delete selected retracement
 */
function useFibRetracementKeyboardShortcuts(
  selectedFibRetracementId,
  deleteSelectedFibRetracement,
) {
  useEffect(() => {
    // Listen for Backspace key to delete selected fib retracement
    const handleKeyDown = (e) => {
      if (e.key === "Backspace" && selectedFibRetracementId) {
        e.preventDefault();
        deleteSelectedFibRetracement();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedFibRetracementId, deleteSelectedFibRetracement]);
}

export default useFibRetracementKeyboardShortcuts;
