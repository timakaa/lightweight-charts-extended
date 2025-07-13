import React from "react";
import Chart from "../components/TradingChart";
import BacktestSidebar from "../components/BacktestSidebar";
import { useParams } from "react-router-dom";
import { useBacktestDrawings } from "../hooks/backtests/useBacktests";

const Backtest = () => {
  const { backtestId } = useParams();
  const { data: backtestDrawings } = useBacktestDrawings(backtestId);

  return (
    <div className='h-screen w-screen relative'>
      <div className='mr-[399px] h-full'>
        <Chart drawings={backtestDrawings} />
      </div>
      <BacktestSidebar />
    </div>
  );
};

export default Backtest;
