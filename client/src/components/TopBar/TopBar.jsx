import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Find from "@icons/Find";
import { useChartStore } from "@store/chart";
import TimeframeSelector from "./components/TimeframeSelector";
import BacktestModal from "@components/BacktestModal";
import RunBacktestModal from "@components/RunBacktestModal/RunBacktestModal";
import TimeframeModal from "./components/TimeframeModal";
import TickerModal from "./components/TickerModal/TickerModal";
import { useTimeframeModal } from "./hooks/useTimeframeModal";
import { useTickerModal } from "./hooks/useTickerModal";
import { useTheme } from "@hooks/useTheme";
import { Button } from "@components/ui/button";
import { Moon, Sun } from "lucide-react";

const DEFAULT_TICKER = "SOL/USDT";
const DEFAULT_TIMEFRAME = "1h";

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const [isRunBacktestModalOpen, setIsRunBacktestModalOpen] = useState(false);
  const ticker = useChartStore((state) => state.ticker);
  const setTicker = useChartStore((state) => state.setTicker);
  const timeframe = useChartStore((state) => state.timeframe);
  const setTimeframe = useChartStore((state) => state.setTimeframe);

  const timeframeModal = useTimeframeModal();
  const tickerModal = useTickerModal();
  const { theme, toggleTheme } = useTheme();

  const isBacktestPage = location.pathname.startsWith("/backtest");

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
      <div className='relative cursor-default bg-background border-b-4 border-border px-1 py-1 flex text-primary z-50'>
        {isBacktestPage && (
          <>
            <button
              onClick={() => navigate("/")}
              className='flex justify-center items-center p-2 hover:bg-foreground/10 duration-100 rounded-md text-sm font-[600]'
            >
              ← Return to Chart
            </button>
            <div className='mx-1 flex justify-center items-center'>
              <div className='h-[22px] w-[1px] bg-foreground/20'></div>
            </div>
          </>
        )}
        <button
          onClick={tickerModal.openModal}
          className='flex justify-center items-center p-2 hover:bg-foreground/10 duration-100 gap-x-1 rounded-md text-sm font-[600]'
        >
          <div className='flex-shrink-0'>
            <Find />
          </div>
          <span className='overflow-hidden whitespace-nowrap'>
            {ticker || DEFAULT_TICKER}
          </span>
        </button>
        <div className='mx-1 flex justify-center items-center'>
          <div className='h-[22px] w-[1px] bg-foreground/20'></div>
        </div>
        <TimeframeSelector />
        <>
          <div className='mx-1 flex justify-center items-center'>
            <div className='h-[22px] w-[1px] bg-foreground/20'></div>
          </div>
          <div className='flex items-center gap-1'>
            <Button
              onClick={() => setIsBacktestModalOpen(true)}
              className='flex justify-center items-center p-2 bg-transparent text-primary hover:bg-foreground/10 duration-100 rounded-md text-sm font-[600]'
            >
              Backtests
            </Button>
            <Button
              onClick={() => setIsRunBacktestModalOpen(true)}
              className='bg-primary text-primary-foreground hover:bg-primary/90'
            >
              Run Backtest
            </Button>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleTheme}
              className='h-9 w-9 text-primary'
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className='h-4 w-4' />
              ) : (
                <Moon className='h-4 w-4' />
              )}
            </Button>
          </div>
        </>
      </div>
      <BacktestModal
        isOpen={isBacktestModalOpen}
        onClose={() => setIsBacktestModalOpen(false)}
      />
      <RunBacktestModal
        isOpen={isRunBacktestModalOpen}
        onClose={() => setIsRunBacktestModalOpen(false)}
        onSubmit={(config) => {
          console.log("Backtest config:", config);
          // TODO: Call API to run backtest
          setIsRunBacktestModalOpen(false);
        }}
      />
      <TimeframeModal
        isOpen={timeframeModal.isModalOpen}
        inputValue={timeframeModal.inputValue}
        isValid={timeframeModal.isValid}
        onClose={timeframeModal.closeModal}
        onApply={timeframeModal.applyTimeframe}
        onInputChange={timeframeModal.handleInputChange}
        getPreviewTimeframe={timeframeModal.getPreviewTimeframe}
      />
      <TickerModal
        isOpen={tickerModal.isModalOpen}
        initialLetter={tickerModal.initialLetter}
        onClose={tickerModal.closeModal}
        onSelectTicker={tickerModal.handleTickerSelect}
      />
    </>
  );
};

export default TopBar;
