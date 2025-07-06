import { useState } from "react";
import { useSelectedLineStore } from "../../store/selectedLine";

// useLineState.js - React hook for managing line state (data, selection, hover)
// Handles lines data, selection, and hover state
function useLineState() {
  // State for all line primitives
  const [linesData, setLinesData] = useState([]);
  // Selection and hover state from the store
  const {
    selectedLineId,
    setSelectedLineId,
    clearSelectedLineId,
    hoveredLineId,
    setHoveredLineId,
    clearHoveredLineId,
  } = useSelectedLineStore();
  return {
    linesData,
    setLinesData,
    selectedLineId,
    setSelectedLineId,
    clearSelectedLineId,
    hoveredLineId,
    setHoveredLineId,
    clearHoveredLineId,
  };
}

export default useLineState;
