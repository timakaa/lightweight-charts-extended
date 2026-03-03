import Chart from "@components/Chart/Chart";
import TopBar from "@components/TopBar/TopBar";
import Sidebar from "@components/Sidebar/Sidebar";
import Trades from "@components/Trades/Trades";
import BacktestSidebar from "./components/BacktestSidebar/BacktestSidebar";
import { useParams, useSearchParams } from "react-router-dom";
import { useBacktestDrawings } from "@hooks/backtests/useBacktests";
import { useState } from "react";
import NotFound404 from "@components/404/404";
import { normalizeSymbol } from "@/helpers/symbol";

const Backtest = () => {
  const { backtestId } = useParams();
  const [searchParams] = useSearchParams();
  const ticker = normalizeSymbol(searchParams.get("ticker")) || "BTC/USDT"; // Read ticker from URL (consistent with TopBar)
  const { data: backtestDrawings, error } = useBacktestDrawings(backtestId);
  const [chartData, setChartData] = useState(null);

  // Show 404 when backtest is not found
  if (error) {
    return <NotFound404 />;
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
              <Chart
                drawings={backtestDrawings}
                onChartReady={setChartData}
                symbol={ticker}
              />
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
      <div className='w-[500px] flex-shrink-0'>
        <BacktestSidebar />
      </div>
    </div>
  );
};

export default Backtest;
