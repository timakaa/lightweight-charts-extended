import React from "react";

const BacktestSidebar = () => {
  // This would come from backend
  const metrics = [
    {
      title: "Sharpe Ratio",
      value: 2.45,
    },
    {
      title: "Win Rate",
      value: "65.8%",
    },
    {
      title: "Profit Factor",
      value: 2.1,
    },
    {
      title: "Max Drawdown",
      value: "-15.2%",
    },
    {
      title: "Total Trades",
      value: 156,
    },
    {
      title: "Average Win",
      value: "$245.32",
    },
    {
      title: "Average Loss",
      value: "-$125.45",
    },
    {
      title: "Expectancy",
      value: "$85.67",
    },
    {
      title: "Value at Risk",
      value: "$1,245.00",
    },
    {
      title: "Beta to SPY",
      value: 0.85,
    },
    {
      title: "Sortino Ratio",
      value: 1.95,
    },
    {
      title: "Monthly Return",
      value: "3.5%",
    },
    {
      title: "Quarterly Return",
      value: "10.2%",
    },
    {
      title: "Year to Date",
      value: "28.4%",
    },
  ];

  const getValueColor = (title, value) => {
    // Helper to parse numeric values from different formats
    const parseNumber = (val) => {
      if (typeof val === "number") return val;
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
      "Sortino Ratio": (val) =>
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
      "Average Win": (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
      "Average Loss": (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
      Expectancy: (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
      "Monthly Return": (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
      "Quarterly Return": (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
      "Year to Date": (val) =>
        parseNumber(val) > 0 ? "text-green-500" : "text-red-500",
    };

    return conditions[title] ? conditions[title](value) : "";
  };

  return (
    <div className='fixed border-l-[4px] cursor-default top-0 right-0 w-[400px] h-full bg-[#0F0F0F] text-white border-[#2E2E2E] flex flex-col'>
      <h2 className='sticky top-0 mx-5 mt-5 font-bold text-2xl py-2.5 border-[#1f2024]'>
        Backtest Results
      </h2>

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
