import React from "react";
import { useParams } from "react-router-dom";
import { useBacktestStats } from "../hooks/backtests/useBacktests";

const BacktestSidebar = () => {
  const { backtestId } = useParams();
  const { data: stats, isLoading, error } = useBacktestStats(backtestId);

  const initialBalance = stats?.initial_balance ?? 0;
  const finalBalance = stats?.final_balance ?? 0;

  const metrics = [
    {
      title: "Start Date",
      value: stats?.start_date
        ? new Date(stats.start_date).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "-",
    },
    {
      title: "End Date",
      value: stats?.end_date
        ? new Date(stats.end_date).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "-",
    },
    {
      title: "Total Trades",
      value: stats?.total_trades ?? "-",
    },
    {
      title: "Trading Days",
      value: stats?.trading_days ?? "-",
    },
    {
      title: "Value at Risk",
      value:
        stats?.value_at_risk !== undefined && stats?.value_at_risk !== null
          ? `$${Number(stats.value_at_risk).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : "-",
    },
    {
      title: "Win Rate",
      value:
        stats?.win_rate !== undefined && stats?.win_rate !== null
          ? `${(Number(stats.win_rate) * 100).toFixed(2)}%`
          : "-",
    },
    {
      title: "Profitable/Loss Trades",
      value:
        stats?.profitable_trades !== undefined &&
        stats?.loss_trades !== undefined
          ? `${stats.profitable_trades} / ${stats.loss_trades}`
          : "-",
    },
    {
      title: "Long/Short Trades",
      value:
        stats?.long_trades !== undefined && stats?.short_trades !== undefined
          ? `${stats.long_trades} / ${stats.short_trades}`
          : "-",
    },
    {
      title: "Total PNL",
      value:
        stats?.total_pnl !== undefined && stats?.total_pnl !== null
          ? `${Number(stats.total_pnl).toFixed(2)} USDT`
          : "-",
    },
    {
      title: "Average PNL",
      value:
        stats?.average_pnl !== undefined && stats?.average_pnl !== null
          ? `${Number(stats.average_pnl).toFixed(2)} USDT`
          : "-",
    },
    {
      title: "Total PNL %",
      value:
        stats?.total_pnl_percentage !== undefined &&
        stats?.total_pnl_percentage !== null
          ? `${Number(stats.total_pnl_percentage).toFixed(2)}%`
          : "-",
    },
    {
      title: "Average PNL %",
      value:
        stats?.average_pnl_percentage !== undefined &&
        stats?.average_pnl_percentage !== null
          ? `${Number(stats.average_pnl_percentage).toFixed(2)}%`
          : "-",
    },
    {
      title: "Sharpe Ratio",
      value:
        stats?.sharpe_ratio !== undefined && stats?.sharpe_ratio !== null
          ? Number(stats.sharpe_ratio).toFixed(2)
          : "-",
    },
    {
      title: "Buy & Hold Return",
      value:
        stats?.buy_hold_return !== undefined && stats?.buy_hold_return !== null
          ? `${(Number(stats.buy_hold_return) * 100).toFixed(2)}%`
          : "-",
    },
    {
      title: "Profit Factor",
      value:
        stats?.profit_factor !== undefined && stats?.profit_factor !== null
          ? Number(stats.profit_factor).toFixed(2)
          : "-",
    },
    {
      title: "Max Drawdown",
      value:
        stats?.max_drawdown !== undefined && stats?.max_drawdown !== null
          ? `${(Number(stats.max_drawdown) * 100).toFixed(1)}%`
          : "-",
    },
  ];

  const getValueColor = (title, value) => {
    // Helper to parse numeric values from different formats
    const parseNumber = (val) => {
      if (typeof val === "number") return val;
      if (typeof val === "string" && val.includes("/")) return 0; // Skip ratio values
      return parseFloat(val.replace(/[^-0-9.]/g, ""));
    };

    // Define color conditions based on metric title
    const conditions = {
      "Sharpe Ratio": (val) =>
        parseNumber(val) > 1
          ? "text-green-500"
          : parseNumber(val) < 0
          ? "text-red-500"
          : "",
      "Win Rate": (val) =>
        parseNumber(val) > 50 ? "text-green-500" : "text-red-500",
      "Profit Factor": (val) =>
        parseNumber(val) > 1 ? "text-green-500" : "text-red-500",
      "Max Drawdown": (val) =>
        parseNumber(val) < 0 ? "text-red-500" : "text-green-500",
      "Total PNL": (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
      "Average PNL": (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
      "Total PNL %": (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
      "Average PNL %": (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
      "Buy & Hold Return": (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
    };

    return conditions[title] ? conditions[title](value) : "";
  };

  const getFinalBalanceColor = () => {
    if (finalBalance > initialBalance) return "text-green-500";
    if (finalBalance < initialBalance) return "text-red-500";
    return "text-white";
  };

  const renderValue = (metric) => {
    const isRatioMetric =
      metric.title === "Profitable/Loss Trades" ||
      metric.title === "Long/Short Trades";

    if (
      isRatioMetric &&
      typeof metric.value === "string" &&
      metric.value.includes("/")
    ) {
      const [first, second] = metric.value.split("/");
      return (
        <div className='flex items-center gap-1'>
          <span className='text-green-500'>{first}</span>
          <span className='text-white'>/</span>
          <span className='text-red-500'>{second}</span>
        </div>
      );
    }

    return (
      <div className={getValueColor(metric.title, metric.value)}>
        {metric.value}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className='fixed z-50 border-l-[4px] cursor-default top-0 right-0 w-[400px] h-full bg-modal text-white border-[#2E2E2E] flex flex-col items-center justify-center'>
        <span className='text-gray-400 text-lg'>Loading stats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='fixed z-50 border-l-[4px] cursor-default top-0 right-0 w-[400px] h-full bg-modal text-white border-[#2E2E2E] flex flex-col items-center justify-center'>
        <span className='text-red-400 text-lg'>Error loading stats</span>
      </div>
    );
  }

  return (
    <div className='fixed z-50 border-l-[4px] cursor-default top-0 right-0 w-[400px] h-full bg-modal text-white border-[#2E2E2E] flex flex-col'>
      <h2 className='sticky top-0 mx-5 mt-5 font-bold text-2xl py-2.5 border-[#1f2024]'>
        Backtest Results
      </h2>
      {stats?.title && (
        <div className='mx-5 -mt-2 mb-2 text-xs text-gray-400 truncate'>
          {stats.title}
        </div>
      )}

      <div className='mx-5 mt-2 grid grid-cols-2 gap-3'>
        <div className='p-4 bg-[#0d0e10] rounded-lg border border-[#1f2024]'>
          <div className='text-gray-500 text-sm mb-1'>Initial Balance</div>
          <div className='text-xl font-medium'>
            ${initialBalance.toLocaleString()}
          </div>
        </div>
        <div className='p-4 bg-[#0d0e10] rounded-lg border border-[#1f2024]'>
          <div className='text-gray-500 text-sm mb-1'>Final Balance</div>
          <div className={`text-xl font-medium ${getFinalBalanceColor()}`}>
            ${finalBalance.toLocaleString()}
          </div>
        </div>
      </div>

      <hr className='border-[#1f2024] my-5' />

      <div className='overflow-y-auto px-5 pb-5 flex-1'>
        <div className='grid grid-cols-2 gap-3'>
          {metrics.map((metric, index) => (
            <div
              key={index}
              className='p-3 bg-[#0d0e10] rounded-lg border border-[#1f2024] hover:border-[#2a2e39] transition-colors'
            >
              <div className='text-gray-500 text-sm mb-1'>{metric.title}</div>
              <div className='text-lg font-medium'>{renderValue(metric)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BacktestSidebar;
