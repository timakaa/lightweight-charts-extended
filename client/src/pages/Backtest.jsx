import React from "react";
import Chart from "../components/TradingChart";
import BacktestSidebar from "../components/BacktestSidebar";

const Backtest = () => {
  return (
    <div className='h-screen w-screen overflow-hidden'>
      <div className='mr-[399px] h-full'>
        <Chart />
      </div>
      <BacktestSidebar />
    </div>
  );
};

export default Backtest;
