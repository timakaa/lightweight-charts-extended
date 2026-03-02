import { useState } from "react";
import BacktestForm from "./BacktestForm";
import { Button } from "@/components/ui/button";

const RunBacktestModalContent = ({ onClose, onSubmit }) => {
  const [strategy, setStrategy] = useState("simple_ma_cross");
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2025-01-01");

  const handlePresetClick = (preset) => {
    setSymbol(preset.symbol);
    setTimeframe(preset.timeframe);

    if (preset.months) {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - preset.months);

      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    } else {
      setStartDate(preset.start);
      setEndDate(preset.end);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      strategy,
      symbol,
      timeframe,
      startDate,
      endDate,
    });
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b border-border'>
        <div className='flex justify-between items-center'>
          <h2 className='text-primary text-lg font-semibold'>Run Backtest</h2>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='text-primary/70 hover:text-primary h-8 w-8'
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Form */}
      <BacktestForm
        strategy={strategy}
        setStrategy={setStrategy}
        symbol={symbol}
        setSymbol={setSymbol}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onPresetClick={handlePresetClick}
        onSubmit={handleSubmit}
      />

      {/* Footer */}
      <div className='p-4 border-t border-border flex justify-end gap-3'>
        <Button
          type='button'
          variant='ghost'
          onClick={onClose}
          className='text-primary'
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className='bg-primary text-primary-foreground hover:bg-primary/90'
        >
          Run Backtest
        </Button>
      </div>
    </div>
  );
};

const RunBacktestModal = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed cursor-default inset-0 bg-background/50 flex items-center justify-center z-[999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-background border border-border rounded-lg w-[500px] max-h-[80vh] flex flex-col'>
        <RunBacktestModalContent onClose={onClose} onSubmit={onSubmit} />
      </div>
    </div>
  );
};

export default RunBacktestModal;
