import { useState, useEffect, useCallback } from "react";
import { useChartStore } from "../store/chart";

export const useTickerModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialLetter, setInitialLetter] = useState("");
  const setTicker = useChartStore((state) => state.setTicker);

  // Handle keyboard input for English letters
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger on English letter keys (not when typing in input fields)
      if (
        event.target.tagName !== "INPUT" &&
        event.target.tagName !== "TEXTAREA" &&
        !event.target.isContentEditable &&
        /^[A-Za-z]$/.test(event.key) &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setInitialLetter(event.key.toUpperCase());
        setIsModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setInitialLetter("");
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleTickerSelect = useCallback(
    (ticker) => {
      setTicker(ticker);
      closeModal();
    },
    [setTicker, closeModal],
  );

  return {
    isModalOpen,
    initialLetter,
    closeModal,
    openModal,
    handleTickerSelect,
  };
};
