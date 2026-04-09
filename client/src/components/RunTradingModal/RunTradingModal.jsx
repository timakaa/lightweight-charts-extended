import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStartPaperTrading } from "@hooks/useStartPaperTrading";
import AsyncStrategySelect from "@components/RunBacktestModal/AsyncStrategySelect";
import AsyncSymbolSelect from "@components/RunBacktestModal/AsyncSymbolSelect";
import CustomSelect from "@components/RunBacktestModal/CustomSelect";
import StrategyParameters from "@components/RunBacktestModal/StrategyParameters";
import { TIMEFRAMES } from "@components/RunBacktestModal/constants";
import { TooltipProvider } from "@/components/ui/tooltip";

const RunTradingModalContent = ({ onClose }) => {
  const [strategy, setStrategy] = useState("");
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [parameters, setParameters] = useState({});
  const [isPaper, setIsPaper] = useState(true);

  const { mutate: startSession, isPending } = useStartPaperTrading();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    startSession(
      {
        strategy,
        symbol,
        timeframe,
        parameters,
        initial_balance: 10000,
        is_paper: isPaper,
      },
      {
        onSuccess: (data) => {
          onClose();
          navigate(`/trading/${data.session_id}`);
        },
        onError: (err) => {
          alert(err.message || "Failed to start trading session");
        },
      },
    );
  };

  return (
    <>
      <div className='p-4 flex items-center justify-between border-b border-border flex-shrink-0'>
        <DialogTitle className='text-primary'>Run Backtest</DialogTitle>
        <DialogClose asChild>
          <Button
            variant='ghost'
            size='icon'
            className='text-primary/70 hover:text-primary h-8 w-8'
          >
            <X className='h-4 w-4' />
          </Button>
        </DialogClose>
      </div>

      <TooltipProvider delayDuration={0}>
        <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-4'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-3 bg-background rounded-lg border border-border'>
              <label className='text-sm font-medium text-primary/80'>
                Paper Trading
              </label>
              <Switch checked={isPaper} onCheckedChange={setIsPaper} />
            </div>
            <div>
              <label className='block text-sm font-medium text-primary/80 mb-2'>
                Strategy
              </label>
              <AsyncStrategySelect value={strategy} onChange={setStrategy} />
            </div>
            <div>
              <label className='block text-sm font-medium text-primary/80 mb-2'>
                Symbol
              </label>
              <AsyncSymbolSelect value={symbol} onChange={setSymbol} />
            </div>
            <div>
              <label className='block text-sm font-medium text-primary/80 mb-2'>
                Timeframe
              </label>
              <CustomSelect
                value={timeframe}
                onChange={setTimeframe}
                options={TIMEFRAMES}
              />
            </div>
            <StrategyParameters
              strategy={strategy}
              parameters={parameters}
              setParameters={setParameters}
            />
          </div>
        </form>
      </TooltipProvider>

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
          disabled={isPending || !strategy || !symbol || !timeframe}
          className='bg-primary text-primary-foreground hover:bg-primary/90'
        >
          {isPending ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
              Starting...
            </>
          ) : (
            "Start"
          )}
        </Button>
      </div>
    </>
  );
};

const RunTradingModal = ({ isOpen, onClose }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent
      className='p-0 gap-0 w-[500px] max-w-[500px] max-h-[80vh] flex flex-col overflow-hidden cursor-default'
      showCloseButton={false}
    >
      <RunTradingModalContent onClose={onClose} />
    </DialogContent>
  </Dialog>
);

export default RunTradingModal;
