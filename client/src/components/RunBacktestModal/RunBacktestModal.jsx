import { useState } from "react";
import BacktestForm from "./BacktestForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        parameters,
      },
      {
        onSuccess: (data) => {
          onClose();
          if (data.backtest_id) {
            window.dispatchEvent(
              new CustomEvent("backtest:started", {
                detail: { backtestId: data.backtest_id },
              }),
            );
          }
        },
        onError: (error) => {
          alert(error.message || "Failed to run backtest. Please try again.");
        },
      },
    );
  };

  return (
    <>
      <DialogHeader className='p-4 border-b border-border flex-shrink-0'>
        <DialogTitle className='text-primary'>Run Backtest</DialogTitle>
      </DialogHeader>

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

      <div className='p-4 border-t border-border flex justify-end gap-3 flex-shrink-0'>
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
    </>
  );
};

const RunBacktestModal = ({ isOpen, onClose }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className='p-0 gap-0 w-[500px] max-w-[500px] max-h-[80vh] flex flex-col overflow-hidden cursor-default' showCloseButton={false}>
      <RunBacktestModalContent onClose={onClose} />
    </DialogContent>
  </Dialog>
);

export default RunBacktestModal;
