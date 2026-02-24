import Chart from "@components/Chart/Chart";
import TopBar from "@components/TopBar/TopBar";
import Sidebar from "@components/Sidebar/Sidebar";
import Trades from "@components/Trades/Trades";
import BacktestSidebar from "./components/BacktestSidebar";
import { useNavigate, useParams } from "react-router-dom";
import { useBacktestDrawings } from "@hooks/backtests/useBacktests";
import { useState } from "react";

const Backtest = () => {
  const { backtestId } = useParams();
  const { data: backtestDrawings, error } = useBacktestDrawings(backtestId);
  const navigate = useNavigate();
  const [chartData, setChartData] = useState(null);

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
    <div className='fixed inset-0 flex bg-black'>
      {/* Main content area */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        <TopBar />
        <div className='flex-1 flex overflow-hidden'>
          {chartData && <Sidebar {...chartData.drawingTools} />}
          <div className='flex-1 flex flex-col overflow-hidden'>
            <div className='flex-1 overflow-hidden'>
              <Chart drawings={backtestDrawings} onChartReady={setChartData} />
            </div>
            {chartData && (
              <Trades
                chart={chartData.chart}
                candleData={chartData.candleData}
                chartDataInfo={chartData.chartDataInfo}
              />
            )}
          </div>
        </div>
      </div>
      {/* Sidebar on the right - part of flex layout */}
      <div className='w-[400px] flex-shrink-0'>
        <BacktestSidebar />
      </div>
    </div>
  );
};

export default Backtest;
