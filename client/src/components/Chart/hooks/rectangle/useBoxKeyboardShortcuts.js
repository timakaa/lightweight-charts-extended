// useBoxKeyboardShortcuts.js - React hook for handling keyboard shortcuts for box actions
import { useEffect } from "react";

// Handles Backspace for deleting selected box
function useBoxKeyboardShortcuts(selectedBoxId, deleteSelectedBox) {
  useEffect(() => {
    // Listen for Backspace key to delete selected box
    const handleKeyDown = (e) => {
      if (e.key === "Backspace" && selectedBoxId) {
        e.preventDefault();
        deleteSelectedBox();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedBoxId, deleteSelectedBox]);
}

export default useBoxKeyboardShortcuts;
