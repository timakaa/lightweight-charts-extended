import { useEffect } from "react";

// useLineKeyboardShortcuts.js - React hook for handling keyboard shortcuts for line actions
// Handles Backspace for deleting selected line
function useLineKeyboardShortcuts(selectedLineId, deleteSelectedLine) {
  useEffect(() => {
    // Listen for Backspace key to delete selected line
    const handleKeyDown = (e) => {
      if (e.key === "Backspace" && selectedLineId) {
        e.preventDefault();
        deleteSelectedLine();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedLineId, deleteSelectedLine]);
}

export default useLineKeyboardShortcuts;
