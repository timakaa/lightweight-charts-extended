// useRulerState.js - React hook for managing ruler data state
import { useState } from "react";

// Handles rulers data state (array of ruler primitives)
function useRulerState() {
  const [rulersData, setRulersData] = useState([]);

  return {
    rulersData,
    setRulersData,
  };
}

export default useRulerState;
