// useBoxState.js - React hook for managing box (rectangle) state (data, selection, hover)
import { useState } from "react";
import { useSelectedBoxStore } from "../../store/selectedBox";

// Handles boxes data, selection, and hover state
function useBoxState() {
  const [boxesData, setBoxesData] = useState([]);
  const {
    selectedBoxId,
    setSelectedBoxId,
    clearSelectedBoxId,
    hoveredBoxId,
    setHoveredBoxId,
    clearHoveredBoxId,
  } = useSelectedBoxStore();
  return {
    boxesData,
    setBoxesData,
    selectedBoxId,
    setSelectedBoxId,
    clearSelectedBoxId,
    hoveredBoxId,
    setHoveredBoxId,
    clearHoveredBoxId,
  };
}

export default useBoxState;
