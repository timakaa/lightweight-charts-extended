import React from "react";

const BacktestSidebar = () => {
  const initialBalance = 10000;
  const finalBalance = 12845;

  // This would come from backend
  const metrics = [
    {
      title: "Total Trades",
      value: 217,
    },
    {
      title: "Trading Days",
      value: 77,
    },
    {
      title: "Profitable/Loss Trades",
      value: "71/146",
    },
    {
      title: "Long/Short Trades",
      value: "113/104",
    },
    {
      title: "Value at Risk",
      value: "$1,245.00",
    },
    {
      title: "Win Rate",
      value: "32.72%",
    },
    {
      title: "Total PNL",
      value: "-26.04 USDT",
    },
    {
      title: "Average PNL",
      value: "-0.12 USDT",
    },
    {
      title: "Total PNL %",
      value: "-18.16%",
    },
    {
      title: "Average PNL %",
      value: "-0.08%",
    },
    {
      title: "Sharpe Ratio",
      value: -0.2,
    },
    {
      title: "Buy & Hold Return",
      value: "185.37%",
    },
    {
      title: "Profit Factor",
      value: 2.1,
    },
    {
      title: "Max Drawdown",
      value: "-15.2%",
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

  return (
    <div className='fixed z-10 border-l-[4px] cursor-default top-0 right-0 w-[400px] h-full bg-modal text-white border-[#2E2E2E] flex flex-col'>
      <h2 className='sticky top-0 mx-5 mt-5 font-bold text-2xl py-2.5 border-[#1f2024]'>
        Backtest Results
      </h2>

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
              <div
                className={
                  "text-lg font-medium " +
                  getValueColor(metric.title, metric.value)
                }
              >
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BacktestSidebar;
