import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BacktestCard from "../pages/Backtests/components/BacktestCard";
import RunningBacktestCard from "./RunningBacktestCard";
import { useBacktestsSummarizedInfinite } from "../hooks/backtests/useBacktests";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BacktestModalContent = ({ onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const inputRef = useRef(null);
  const [runningBacktests, setRunningBacktests] = useState([]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Listen for new backtest events
  useEffect(() => {
    const handleNewBacktest = (event) => {
      const { backtestId } = event.detail;
      console.log("Backtest started event received:", backtestId);
      setRunningBacktests((prev) => {
        if (prev.includes(backtestId)) return prev;
        // Add new backtest at the beginning (newest first)
        return [backtestId, ...prev];
      });
    };

    window.addEventListener("backtest:started", handleNewBacktest);
    return () => {
      window.removeEventListener("backtest:started", handleNewBacktest);
    };
  }, []);

  // Fetch active backtests on mount
  useEffect(() => {
    const fetchActiveBacktests = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/backtest/progress/active`,
        );
        if (response.ok) {
          const data = await response.json();
          const activeIds = Object.keys(data);
          console.log("Active backtests on mount:", activeIds);
          // Reverse to show newest first
          setRunningBacktests(activeIds.reverse());
        }
      } catch (error) {
        console.error("Failed to fetch active backtests:", error);
      }
    };

    fetchActiveBacktests();
  }, []);

  const handleBacktestComplete = (backtestId) => {
    // Remove from running list immediately
    setRunningBacktests((prev) => prev.filter((id) => id !== backtestId));
  };

  const { data, isLoading, error, isFetching, fetchNextPage, hasNextPage } =
    useBacktestsSummarizedInfinite(10, debouncedSearch);

  // Flatten all pages into a single array
  const backtests = useMemo(() => {
    return data?.pages?.flatMap((page) => page.backtests) ?? [];
  }, [data]);

  const { loaderRef } = useInfiniteScroll({
    hasNext: hasNextPage,
    isFetching,
    onLoadMore: fetchNextPage,
    offset: 200,
  });

  const handleBacktestSelect = (backtest) => {
    const { id, symbols } = backtest;
    // Get the first symbol from the backtest (normalized format: BTCUSDT)
    const ticker = symbols?.[0]?.ticker;
    onClose();
    // Navigate with ticker as query parameter (consistent with TopBar)
    navigate(`/backtest/${id}${ticker ? `?ticker=${ticker}` : ""}`);
  };

  return (
    <div className='flex flex-col h-full max-h-[80vh]'>
      <div className='p-4 border-b border-border flex-shrink-0'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-primary'>Backtests</h2>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='text-primary/70 hover:text-primary h-8 w-8'
          >
            ✕
          </Button>
        </div>
        <Input
          ref={inputRef}
          type='text'
          placeholder='Search backtests...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='bg-background border-border text-primary'
        />
      </div>

      <div className='flex-1 overflow-y-auto p-4 min-h-0'>
        {isLoading ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-primary'>Loading...</div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-red-500'>Error: {error.message}</div>
          </div>
        ) : (
          <>
            {/* Running backtests */}
            {runningBacktests.length > 0 && (
              <div className='space-y-3 mb-4'>
                {runningBacktests.map((backtestId) => (
                  <RunningBacktestCard
                    key={backtestId}
                    backtestId={backtestId}
                    onComplete={handleBacktestComplete}
                  />
                ))}
              </div>
            )}

            {/* Completed backtests */}
            {backtests.length > 0 ? (
              <>
                <div className='space-y-3'>
                  {backtests.map((backtest) => (
                    <BacktestCard
                      key={backtest.id}
                      backtest={backtest}
                      onClick={() => handleBacktestSelect(backtest)}
                    />
                  ))}
                </div>
                {hasNextPage && (
                  <div
                    ref={loaderRef}
                    className='h-10 flex justify-center items-center'
                  >
                    {isFetching && (
                      <div className='text-primary'>Loading more...</div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className='flex items-center justify-center p-8'>
                <div className='text-primary'>No backtests found</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const BacktestModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed cursor-default inset-0 bg-black/50 flex items-center justify-center z-[999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-background border border-border rounded-lg w-[500px] max-h-[80vh] flex flex-col'>
        <BacktestModalContent onClose={onClose} />
      </div>
    </div>
  );
};

export default BacktestModal;
