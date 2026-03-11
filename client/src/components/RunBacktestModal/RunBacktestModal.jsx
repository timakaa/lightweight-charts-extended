import { useState } from "react";
import BacktestForm from "./BacktestForm";
import { Button } from "@/components/ui/button";
import { useRunBacktest } from "@hooks/backtests/useRunBacktest";
import { Loader2 } from "lucide-react";

const RunBacktestModalContent = ({ onClose }) => {
  const [strategy, setStrategy] = useState("");
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2025-01-01");
  const [parameters, setParameters] = useState({});

  const { mutate: runBacktest, isPending } = useRunBacktest();

  const handleSubmit = (e) => {
    e.preventDefault();

    runBacktest(
      {
        strategy,
        symbol,
        timeframe,
        start_date: startDate,
        end_date: endDate,
        parameters: parameters,
      },
      {
        onSuccess: (data) => {
          // Close modal immediately
          onClose();

          // Dispatch event to show progress toast
          if (data.backtest_id) {
            window.dispatchEvent(
              new CustomEvent("backtest:started", {
                detail: { backtestId: data.backtest_id },
              }),
            );
          }
        },
        onError: (error) => {
          console.error("Error running backtest:", error);
          alert(error.message || "Failed to run backtest. Please try again.");
        },
      },
    );
  };

  return (
    <div className='flex flex-col h-full max-h-[80vh]'>
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
        parameters={parameters}
        setParameters={setParameters}
        onSubmit={handleSubmit}
      />

      {/* Footer */}
      <div className='p-4 border-t border-border flex justify-end gap-3'>
        <Button
          type='button'
          variant='ghost'
          onClick={onClose}
          disabled={isPending}
          className='text-primary'
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            isPending ||
            !strategy ||
            !symbol ||
            !timeframe ||
            !startDate ||
            !endDate
          }
          className='bg-primary text-primary-foreground hover:bg-primary/90'
        >
          {isPending ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
              Running...
            </>
          ) : (
            "Run Backtest"
          )}
        </Button>
      </div>
    </div>
  );
};

const RunBacktestModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed cursor-default inset-0 bg-black/50 flex items-center justify-center z-[999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-background border border-border rounded-lg w-[500px] max-h-[80vh] flex flex-col'>
        <RunBacktestModalContent onClose={onClose} />
      </div>
    </div>
  );
};

export default RunBacktestModal;
