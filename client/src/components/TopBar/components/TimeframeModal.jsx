import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const getReadableTimeframe = (timeframe) => {
  if (!timeframe) return "";
  if (timeframe === "D") return "1 day";
  if (timeframe === "W") return "1 week";
  const match = timeframe.match(/^(\d+)([mh])$/);
  if (match) {
    const [, number, unit] = match;
    const unitName = unit === "m" ? "minute" : "hour";
    return `${number} ${unitName}${number === "1" ? "" : "s"}`;
  }
  return timeframe;
};

const TimeframeModal = ({
  isOpen,
  inputValue,
  isValid,
  onClose,
  onApply,
  onInputChange,
  getPreviewTimeframe,
}) => {
  const previewTimeframe = getPreviewTimeframe?.();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && isValid && inputValue) onApply();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='w-[350px] max-w-[350px] text-center'>
        <DialogTitle className='text-primary text-lg font-medium text-center'>
          Change interval
        </DialogTitle>

        <div className='mt-2'>
          <input
            type='text'
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className={`w-full px-3 py-3 text-lg text-center bg-background border-2 rounded-lg text-primary transition-colors outline-none duration-200 ${
              isValid ? "border-[#4A90E2]" : "border-red-500"
            }`}
          />
        </div>

        <div
          className={`text-sm ${isValid ? "text-primary/70" : "text-red-400"}`}
        >
          {inputValue && isValid && previewTimeframe
            ? getReadableTimeframe(previewTimeframe)
            : "Not applicable"}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeframeModal;
