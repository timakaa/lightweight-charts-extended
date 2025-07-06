// useFibRetracementState.js - React hook for managing fib retracement state (data, selection, hover)
import { useState } from "react";
import { useSelectedFibRetracementStore } from "../../store/selectedFibRetracement";

/**
 * useFibRetracementState
 *
 * Manages state for fib retracements:
 * - retracementsData: array of all retracements
 * - selectedFibRetracementId: ID of selected retracement
 * - hoveredFibRetracementId: ID of hovered retracement
 * - Provides setters and clearers for selection/hover
 *
 * @returns {object} State and setters for retracements, selection, and hover
 */
function useFibRetracementState() {
  const [retracementsData, setRetracementsData] = useState([]);
  const {
    selectedFibRetracementId,
    setSelectedFibRetracementId,
    clearSelectedFibRetracementId,
    hoveredFibRetracementId,
    setHoveredFibRetracementId,
    clearHoveredFibRetracementId,
  } = useSelectedFibRetracementStore();
  return {
    retracementsData,
    setRetracementsData,
    selectedFibRetracementId,
    setSelectedFibRetracementId,
    clearSelectedFibRetracementId,
    hoveredFibRetracementId,
    setHoveredFibRetracementId,
    clearHoveredFibRetracementId,
  };
}

export default useFibRetracementState;
