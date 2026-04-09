import { useParams } from "react-router-dom";
import {
  useTradingSession,
  useStopTradingSession,
} from "@hooks/useTradingSession";
import { Button } from "@/components/ui/button";
import BalanceCards from "@pages/Backtest/components/BacktestSidebar/BalanceCards";
import MetricsGrid from "./TradingMetricsGrid";
import ChartImages from "@pages/Backtest/components/BacktestSidebar/ChartImages";
import StrategyFields from "@pages/Backtest/components/BacktestSidebar/StrategyFields";
import { useState } from "react";

const TradingSidebar = () => {
  const { sessionId } = useParams();
  const { data: session, isLoading, error } = useTradingSession(sessionId);
  const stopSession = useStopTradingSession();
  const [stopping, setStopping] = useState(false);

  const handleStop = async () => {
    setStopping(true);
    try {
      await stopSession(sessionId);
    } catch (e) {
      alert(e.message || "Failed to stop session");
    } finally {
      setStopping(false);
    }
  };

  if (isLoading) {
    return (
      <div className='border-l-[4px] cursor-default h-full bg-background text-primary border-border flex items-center justify-center'>
        <span className='text-primary/70 text-lg'>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='border-l-[4px] cursor-default h-full bg-background text-primary border-border flex items-center justify-center'>
        <span className='text-red-400 text-lg'>Session not found</span>
      </div>
    );
  }

  const isRunning = session?.status === "running";

  return (
    <div className='border-l-[4px] cursor-default h-full bg-background text-primary border-border flex flex-col overflow-auto'>
      <div className='mx-5 mt-5 flex items-center justify-between'>
        <div>
          <h2 className='font-bold text-2xl py-2.5'>Live Trading</h2>
          <div className='flex items-center gap-2 -mt-2 mb-2'>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${isRunning ? "bg-green-500/20 text-green-400" : "bg-primary/10 text-primary/60"}`}
            >
              {isRunning ? "Running" : "Stopped"}
            </span>
            {session?.is_paper && (
              <span className='text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium'>
                Paper
              </span>
            )}
          </div>
        </div>
        {isRunning && (
          <Button
            variant='destructive'
            size='sm'
            onClick={handleStop}
            disabled={stopping}
            className='h-8'
          >
            {stopping ? "Stopping..." : "Stop"}
          </Button>
        )}
      </div>

      {session?.title && (
        <div className='mx-5 -mt-1 mb-2 text-xs text-primary/70 truncate'>
          {session.title}
        </div>
      )}

      <div className='mx-5 mt-2'>
        <BalanceCards
          initialBalance={session?.initial_balance ?? 0}
          finalBalance={session?.current_balance ?? 0}
        />
        <div className='mt-3'>
          <MetricsGrid stats={session} />
        </div>
      </div>

      <hr className='border-border my-5' />

      <div className='mb-4 flex-1'>
        <ChartImages chartImages={session?.chart_images} />
        <StrategyFields
          strategyRelatedFields={session?.strategy_related_fields}
        />
      </div>
    </div>
  );
};

export default TradingSidebar;
