import MetricCard from "./MetricCard";

const MetricsGrid = ({ stats }) => {
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
    {
      title: "Capital Deployed",
      value:
        stats?.capital_deployed !== undefined &&
        stats?.capital_deployed !== null
          ? `$${Number(stats.capital_deployed).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : "-",
    },
    {
      title: "Capital Utilization",
      value:
        stats?.capital_utilization !== undefined &&
        stats?.capital_utilization !== null
          ? `${Number(stats.capital_utilization).toFixed(2)}%`
          : "-",
    },
    {
      title: "ROIC",
      value:
        stats?.roic !== undefined && stats?.roic !== null
          ? `${Number(stats.roic).toFixed(2)}%`
          : "-",
    },
  ];

  const getValueColor = (title, value) => {
    const parseNumber = (val) => {
      if (typeof val === "number") return val;
      if (typeof val === "string" && val.includes("/")) return 0;
      return parseFloat(val.replace(/[^-0-9.]/g, ""));
    };

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
      ROIC: (val) => (parseNumber(val) > 0 ? "text-green-500" : "text-red-500"),
    };

    return conditions[title] ? conditions[title](value) : "";
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

    return metric.value;
  };

  return (
    <div className='grid grid-cols-2 gap-3'>
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={renderValue(metric)}
          colorClass={getValueColor(metric.title, metric.value)}
        />
      ))}
    </div>
  );
};

export default MetricsGrid;
