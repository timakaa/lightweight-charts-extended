import { useParams } from "react-router-dom";
import { useBacktestStats } from "@hooks/backtests/useBacktests";
import BalanceCards from "./BalanceCards";
import MetricsGrid from "./MetricsGrid";
import ChartImages from "./ChartImages";
import StrategyFields from "./StrategyFields";

const BacktestSidebar = () => {
  const { backtestId } = useParams();
  const { data: stats, isLoading, error } = useBacktestStats(backtestId);

  if (isLoading) {
    return (
      <div className='fixed z-50 border-l-[4px] cursor-default top-0 right-0 w-[400px] h-full bg-background text-primary border-border flex flex-col items-center justify-center'>
        <span className='text-primary/70 text-lg'>Loading stats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='fixed z-50 border-l-[4px] cursor-default top-0 right-0 w-[400px] h-full bg-background text-primary border-border flex flex-col items-center justify-center'>
        <span className='text-red-400 text-lg'>Error loading stats</span>
      </div>
    );
  }

  const initialBalance = stats?.initial_balance ?? 0;
  const finalBalance = stats?.final_balance ?? 0;

  return (
    <div className='border-l-[4px] cursor-default h-full bg-background text-primary border-border flex flex-col overflow-auto'>
      <h2 className='mx-5 mt-5 font-bold text-2xl py-2.5'>Backtest Results</h2>
      {stats?.title && (
        <div className='mx-5 -mt-2 mb-2 text-xs text-primary/70 truncate'>
          {stats.title}
        </div>
      )}

      <div className='mx-5 mt-2'>
        <BalanceCards
          initialBalance={initialBalance}
          finalBalance={finalBalance}
        />
        <div className='mt-3'>
          <MetricsGrid stats={stats} />
        </div>
      </div>

      <hr className='border-border my-5' />

      <div className='mb-4 flex-1'>
        <ChartImages chartImages={stats?.chart_images} />
        <StrategyFields
          strategyRelatedFields={stats?.strategy_related_fields}
        />
      </div>
    </div>
  );
};

export default BacktestSidebar;
