import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BacktestCard from "../pages/Backtests/components/BacktestCard";
import RunningBacktestCard from "./RunningBacktestCard";
import { useBacktestsSummarizedInfinite } from "../hooks/backtests/useBacktests";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const handleNewBacktest = (event) => {
      const { backtestId } = event.detail;
      setRunningBacktests((prev) =>
        prev.includes(backtestId) ? prev : [backtestId, ...prev],
      );
    };
    window.addEventListener("backtest:started", handleNewBacktest);
    return () =>
      window.removeEventListener("backtest:started", handleNewBacktest);
  }, []);

  useEffect(() => {
    const fetchActiveBacktests = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/backtest/progress/active`,
        );
        if (response.ok) {
          const data = await response.json();
          setRunningBacktests(Object.keys(data).reverse());
        }
      } catch (error) {
        console.error("Failed to fetch active backtests:", error);
      }
    };
    fetchActiveBacktests();
  }, []);

  const handleBacktestComplete = (backtestId) =>
    setRunningBacktests((prev) => prev.filter((id) => id !== backtestId));

  const { data, isLoading, error, isFetching, fetchNextPage, hasNextPage } =
    useBacktestsSummarizedInfinite(10, debouncedSearch);

  const backtests = useMemo(
    () => data?.pages?.flatMap((page) => page.backtests) ?? [],
    [data],
  );

  const { loaderRef } = useInfiniteScroll({
    hasNext: hasNextPage,
    isFetching,
    onLoadMore: fetchNextPage,
    offset: 200,
  });

  const handleBacktestSelect = (backtest) => {
    const ticker = backtest.symbols?.[0]?.ticker;
    onClose();
    navigate(`/backtest/${backtest.id}${ticker ? `?ticker=${ticker}` : ""}`);
  };

  return (
    <>
      <div className='flex items-center justify-between p-4 border-b border-border flex-shrink-0'>
        <DialogTitle className='text-lg font-semibold text-primary'>
          Backtests
        </DialogTitle>
        <DialogClose asChild>
          <Button
            variant='ghost'
            size='icon'
            className='text-primary/70 hover:text-primary h-8 w-8'
          >
            <X className='h-4 w-4' />
          </Button>
        </DialogClose>
      </div>
      <div className='p-4 border-b border-border flex-shrink-0'>
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
    </>
  );
};

const BacktestModal = ({ isOpen, onClose }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className='p-0 gap-0 w-[500px] max-w-[500px] max-h-[80vh] flex flex-col overflow-hidden cursor-default' showCloseButton={false}>
      <BacktestModalContent onClose={onClose} />
    </DialogContent>
  </Dialog>
);

export default BacktestModal;
