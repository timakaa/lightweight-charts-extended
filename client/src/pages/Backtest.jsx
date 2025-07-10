import React from "react";
import Chart from "../components/TradingChart";
import BacktestSidebar from "../components/BacktestSidebar";

const Backtest = () => {
  return (
    <div className='h-screen w-screen relative'>
      <div className='mr-[399px] h-full'>
        <Chart trades={["dsf"]} />
      </div>
      <BacktestSidebar />
    </div>
  );
};

export default Backtest;
