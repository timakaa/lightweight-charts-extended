import React, { useEffect, useRef } from "react";

const TimeframeModal = ({
  isOpen,
  inputValue,
  isValid,
  onClose,
  onApply,
  onInputChange,
  getPreviewTimeframe,
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && isValid && inputValue) {
        onApply();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onApply, onClose, isValid, inputValue]);

  if (!isOpen) return null;

  const previewTimeframe = getPreviewTimeframe();

  // Convert timeframe to readable format
  const getReadableTimeframe = (timeframe) => {
    if (!timeframe) return "";

    if (timeframe === "D") return "1 day";
    if (timeframe === "W") return "1 week";

    const match = timeframe.match(/^(\d+)([mh])$/);
    if (match) {
      const [, number, unit] = match;
      const unitName = unit === "m" ? "minute" : "hour";
      const plural = number === "1" ? "" : "s";
      return `${number} ${unitName}${plural}`;
    }

    return timeframe;
  };

  return (
    <div
      className='fixed inset-0 cursor-default bg-black bg-opacity-60 flex items-center justify-center z-50'
      onClick={onClose}
    >
      <div
        className='bg-[#1E1E1E] border border-[#3D3D3D] rounded-lg p-6 w-[350px]'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className='text-white text-lg font-medium mb-4 text-center'>
          Change interval
        </h2>

        <div className='mb-4'>
          <input
            ref={inputRef}
            type='text'
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            className={`w-full px-3 py-3 text-lg text-center bg-[#2D2D2D] border-2 rounded-lg text-white focus:outline-none transition-all duration-200 ${
              isValid
                ? "border-[#4A90E2] focus:border-[#5BA0F2]"
                : "border-red-500 focus:border-red-400"
            }`}
            placeholder=''
          />
        </div>

        <div className='text-center'>
          <div
            className={`text-sm ${isValid ? "text-gray-300" : "text-red-400"}`}
          >
            {inputValue && isValid && previewTimeframe
              ? getReadableTimeframe(previewTimeframe)
              : "Not applicable"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeframeModal;
