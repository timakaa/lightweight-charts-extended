import { useState, useEffect, useCallback } from "react";
import { useChartStore } from "../store/chart";

// Available timeframes from TimeframeSelector
const AVAILABLE_TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "D", "W"];

export const useTimeframeModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState(true);
  const setTimeframe = useChartStore((state) => state.setTimeframe);

  // Parse and validate input
  const parseTimeframe = useCallback((input) => {
    if (!input) return { timeframe: "", isValid: false };

    const upperInput = input.toUpperCase();

    // Handle pure numbers (default to minutes)
    if (/^\d+$/.test(upperInput)) {
      const timeframe = upperInput + "m";
      return { timeframe, isValid: AVAILABLE_TIMEFRAMES.includes(timeframe) };
    }

    // Handle number + unit combinations
    const match = upperInput.match(/^(\d+)([HMDW])$/);
    if (match) {
      const [, number, unit] = match;
      let timeframe;

      switch (unit) {
        case "H":
          timeframe = number + "h";
          break;
        case "M":
          timeframe = number + "m";
          break;
        case "D":
          timeframe = "D";
          break;
        case "W":
          timeframe = "W";
          break;
        default:
          return { timeframe: "", isValid: false };
      }

      return { timeframe, isValid: AVAILABLE_TIMEFRAMES.includes(timeframe) };
    }

    // Handle single letter units (D, W)
    if (["D", "W"].includes(upperInput)) {
      return {
        timeframe: upperInput,
        isValid: AVAILABLE_TIMEFRAMES.includes(upperInput),
      };
    }

    return { timeframe: "", isValid: false };
  }, []);

  // Handle keyboard input for numbers
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger on number keys (not when typing in input fields)
      if (
        event.target.tagName !== "INPUT" &&
        event.target.tagName !== "TEXTAREA" &&
        !event.target.isContentEditable &&
        /^[0-9]$/.test(event.key) &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        const { isValid: validInput } = parseTimeframe(event.key);
        setInputValue(event.key);
        setIsValid(validInput);
        setIsModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setInputValue("");
    setIsValid(true);
  }, []);

  const applyTimeframe = useCallback(() => {
    const { timeframe, isValid: validTimeframe } = parseTimeframe(inputValue);
    if (validTimeframe && timeframe) {
      setTimeframe(timeframe);
      closeModal();
    }
  }, [inputValue, parseTimeframe, setTimeframe, closeModal]);

  const handleInputChange = useCallback(
    (value) => {
      // Allow numbers and letters, auto-convert to uppercase
      const processedValue = value.toUpperCase();

      // Only allow valid characters: numbers, H, M, D, W
      if (/^[0-9HMDW]*$/.test(processedValue)) {
        setInputValue(processedValue);
        const { isValid: validInput } = parseTimeframe(processedValue);
        setIsValid(validInput);
      }
    },
    [parseTimeframe],
  );

  const getPreviewTimeframe = useCallback(() => {
    const { timeframe, isValid: validTimeframe } = parseTimeframe(inputValue);
    return validTimeframe ? timeframe : "";
  }, [inputValue, parseTimeframe]);

  return {
    isModalOpen,
    inputValue,
    isValid,
    closeModal,
    applyTimeframe,
    handleInputChange,
    getPreviewTimeframe,
  };
};
