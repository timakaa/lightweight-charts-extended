import MetricCard from "@pages/Backtest/components/BacktestSidebar/MetricCard";

const TradingMetricsGrid = ({ stats }) => {
  const metrics = [
    {
      title: "Started At",
      value: stats?.started_at
        ? new Date(stats.started_at).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
    },
    {
      title: "Symbol / TF",
      value:
        stats?.symbol && stats?.timeframe
          ? `${stats.symbol} / ${stats.timeframe}`
          : "-",
    },
    { title: "Total Trades", value: stats?.total_trades ?? "-" },
    { title: "Trading Days", value: stats?.trading_days ?? "-" },
    {
      title: "Win Rate",
      value:
        stats?.win_rate != null
          ? `${(Number(stats.win_rate) * 100).toFixed(2)}%`
          : "-",
    },
    {
      title: "Profitable/Loss",
      value:
        stats?.profitable_trades != null && stats?.loss_trades != null
          ? `${stats.profitable_trades} / ${stats.loss_trades}`
          : "-",
    },
    {
      title: "Long/Short",
      value:
        stats?.long_trades != null && stats?.short_trades != null
          ? `${stats.long_trades} / ${stats.short_trades}`
          : "-",
    },
    {
      title: "Total PNL",
      value:
        stats?.total_pnl != null
          ? `${Number(stats.total_pnl).toFixed(2)} USDT`
          : "-",
    },
    {
      title: "Average PNL",
      value:
        stats?.average_pnl != null
          ? `${Number(stats.average_pnl).toFixed(2)} USDT`
          : "-",
    },
    {
      title: "Total PNL %",
      value:
        stats?.total_pnl_percentage != null
          ? `${Number(stats.total_pnl_percentage).toFixed(2)}%`
          : "-",
    },
    {
      title: "Average PNL %",
      value:
        stats?.average_pnl_percentage != null
          ? `${Number(stats.average_pnl_percentage).toFixed(2)}%`
          : "-",
    },
    {
      title: "Sharpe Ratio",
      value:
        stats?.sharpe_ratio != null
          ? Number(stats.sharpe_ratio).toFixed(2)
          : "-",
    },
    {
      title: "Profit Factor",
      value:
        stats?.profit_factor != null
          ? Number(stats.profit_factor).toFixed(2)
          : "-",
    },
    {
      title: "Max Drawdown",
      value:
        stats?.max_drawdown != null
          ? `${(Number(stats.max_drawdown) * 100).toFixed(1)}%`
          : "-",
    },
  ];

  const getValueColor = (title, value) => {
    const n = (v) => parseFloat(String(v).replace(/[^-0-9.]/g, ""));
    const map = {
      "Win Rate": (v) => (n(v) > 50 ? "text-green-500" : "text-red-500"),
      "Profit Factor": (v) => (n(v) > 1 ? "text-green-500" : "text-red-500"),
      "Max Drawdown": (v) => (n(v) < 0 ? "text-red-500" : "text-green-500"),
      "Total PNL": (v) => (n(v) > 0 ? "text-green-500" : "text-red-500"),
      "Average PNL": (v) => (n(v) > 0 ? "text-green-500" : "text-red-500"),
      "Total PNL %": (v) => (n(v) > 0 ? "text-green-500" : "text-red-500"),
      "Average PNL %": (v) => (n(v) > 0 ? "text-green-500" : "text-red-500"),
      "Sharpe Ratio": (v) =>
        n(v) > 1 ? "text-green-500" : n(v) < 0 ? "text-red-500" : "",
    };
    return map[title] ? map[title](value) : "";
  };

  const renderValue = (metric) => {
    const isRatio =
      metric.title === "Profitable/Loss" || metric.title === "Long/Short";
    if (
      isRatio &&
      typeof metric.value === "string" &&
      metric.value.includes("/")
    ) {
      const [a, b] = metric.value.split("/");
      return (
        <div className='flex items-center gap-1'>
          <span className='text-green-500'>{a}</span>
          <span className='text-primary'>/</span>
          <span className='text-red-500'>{b}</span>
        </div>
      );
    }
    return metric.value;
  };

  return (
    <div className='grid grid-cols-2 gap-3'>
      {metrics.map((metric, i) => (
        <MetricCard
          key={i}
          title={metric.title}
          value={renderValue(metric)}
          colorClass={getValueColor(metric.title, metric.value)}
        />
      ))}
    </div>
  );
};

export default TradingMetricsGrid;
