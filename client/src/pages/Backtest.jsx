import React from "react";
import Chart from "../components/TradingChart";
import BacktestSidebar from "../components/BacktestSidebar";
import { useNavigate, useParams } from "react-router-dom";
import { useBacktestDrawings } from "../hooks/backtests/useBacktests";

const Backtest = () => {
  const { backtestId } = useParams();
  const { data: backtestDrawings, error } = useBacktestDrawings(backtestId);
  const navigate = useNavigate();

  // Show 404 when backtest is not found
  if (error || !backtestDrawings) {
    return (
      <div className='h-screen w-screen flex items-center justify-center bg-modal'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-white mb-4'>404</h1>
          <p className='text-xl text-gray-300 mb-6'>Backtest not found</p>
          <button
            onClick={() => navigate("/")}
            to='/'
            className='inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
          >
            Go to Main Page
          </button>
        </div>
      </div>
    );
  }

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
