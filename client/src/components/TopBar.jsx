import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Find from "./icons/Find";
import { useChartStore } from "../store/chart";
import TimeframeSelector from "./TimeframeSelector";
import BacktestModal from "./BacktestModal";

const DEFAULT_TICKER = "SOL/USDT";
const DEFAULT_TIMEFRAME = "1h";

const TopBar = ({ onOpenTickerModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const ticker = useChartStore((state) => state.ticker);
  const setTicker = useChartStore((state) => state.setTicker);
  const timeframe = useChartStore((state) => state.timeframe);
  const setTimeframe = useChartStore((state) => state.setTimeframe);

  const isBacktestPage = location.pathname === "/backtest";

  // On mount, set ticker and timeframe from URL if present, otherwise set defaults if store is null
  useEffect(() => {
    const url = new URL(window.location.href);
    const urlTicker = url.searchParams.get("ticker");
    const urlTimeframe = url.searchParams.get("timeframe");
    if (urlTicker && urlTicker !== ticker) {
      setTicker(urlTicker);
    } else if (!urlTicker && !ticker) {
      setTicker(DEFAULT_TICKER);
    }
    if (urlTimeframe && urlTimeframe !== timeframe) {
      setTimeframe(urlTimeframe);
    } else if (!urlTimeframe && !timeframe) {
      setTimeframe(DEFAULT_TIMEFRAME);
    }
  }, []);

  // Update URL when ticker or timeframe changes
  useEffect(() => {
    if (ticker && timeframe) {
      const url = new URL(window.location.href);
      url.searchParams.set("ticker", ticker);
      url.searchParams.set("timeframe", timeframe);
      window.history.replaceState({}, "", url);
    }
  }, [ticker, timeframe]);

  return (
    <>
      <div className='relative cursor-default bg-[#0F0F0F] border-b-4 border-[#2E2E2E] px-1 py-1 flex text-white z-50'>
        {isBacktestPage && (
          <>
            <button
              onClick={() => navigate("/")}
              className='flex justify-center items-center p-2 hover:bg-[#2E2E2E] duration-100 rounded-md text-sm font-[600]'
            >
              ← Return to Chart
            </button>
            <div className='mx-1 flex justify-center items-center'>
              <div className='h-[22px] w-[1px] bg-[#4A4A4A]'></div>
            </div>
          </>
        )}
        <button
          onClick={onOpenTickerModal}
          className='flex justify-center items-center p-2 hover:bg-[#2E2E2E] duration-100 gap-x-1 rounded-md text-sm font-[600] max-w-[100px]'
        >
          <div className='flex-shrink-0'>
            <Find />
          </div>
          <span className='overflow-hidden whitespace-nowrap'>
            {ticker || DEFAULT_TICKER}
          </span>
        </button>
        <div className='mx-1 flex justify-center items-center'>
          <div className='h-[22px] w-[1px] bg-[#4A4A4A]'></div>
        </div>
        <TimeframeSelector />
        <>
          <div className='mx-1 flex justify-center items-center'>
            <div className='h-[22px] w-[1px] bg-[#4A4A4A]'></div>
          </div>
          <button
            onClick={() => setIsBacktestModalOpen(true)}
            className='flex justify-center items-center p-2 hover:bg-[#2E2E2E] duration-100 rounded-md text-sm font-[600]'
          >
            Backtests
          </button>
        </>
      </div>
      <BacktestModal
        isOpen={isBacktestModalOpen}
        onClose={() => setIsBacktestModalOpen(false)}
      />
    </>
  );
};

export default TopBar;
