import { useParams } from "react-router-dom";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useBacktestStats } from "@hooks/backtests/useBacktests";
import { Button } from "@/components/ui/button";
import BalanceCards from "./BalanceCards";
import MetricsGrid from "./MetricsGrid";
import ChartImages from "./ChartImages";
import StrategyFields from "./StrategyFields";
import { omit } from "@/utils/omit";

const BacktestSidebar = () => {
  const { backtestId } = useParams();
  const { data: stats, isLoading, error } = useBacktestStats(backtestId);
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = () => {
    const statsWithoutStrategyAndCharts = omit(stats, [
      "strategy_related_fields",
      "chart_images",
    ]);
    const jsonData = JSON.stringify(statsWithoutStrategyAndCharts, null, 2);
    navigator.clipboard.writeText(jsonData).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className='fixed z-50 border-l-[4px] cursor-default top-0 right-0 w-[500px] h-full bg-background text-primary border-border flex flex-col items-center justify-center'>
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
      <div className='mx-5 mt-5 flex items-center justify-between'>
        <h2 className='font-bold text-2xl py-2.5'>Backtest Results</h2>
        <Button
          onClick={handleCopyToClipboard}
          variant='ghost'
          size='icon'
          title='Copy results as JSON'
        >
          {copied ? (
            <Check className='h-4 w-4 text-green-500' />
          ) : (
            <Copy className='h-4 w-4' />
          )}
        </Button>
      </div>
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
