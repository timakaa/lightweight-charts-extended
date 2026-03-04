import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BacktestCard from "../pages/Backtests/components/BacktestCard";
import { useBacktestsSummarized } from "../hooks/backtests/useBacktests";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BacktestModalContent = ({ onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const inputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [backtests, setBacktests] = useState([]);
  const [hasNext, setHasNext] = useState(true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const { data, isLoading, error, isFetching } = useBacktestsSummarized(
    page,
    10,
    debouncedSearch,
  );

  useEffect(() => {
    setPage(1);
    setBacktests([]);
    setHasNext(true);
  }, [debouncedSearch]);

  useEffect(() => {
    if (data?.backtests) {
      setBacktests((prev) =>
        page === 1 ? data.backtests : [...prev, ...data.backtests],
      );
      setHasNext(data.pagination?.has_next);
    }
  }, [data, page]);

  const { loaderRef } = useInfiniteScroll({
    hasNext,
    isFetching,
    onLoadMore: () => setPage((prev) => prev + 1),
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
        {isLoading && page === 1 ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-primary'>Loading...</div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-red-500'>Error: {error.message}</div>
          </div>
        ) : backtests.length > 0 ? (
          <>
            <div className='space-y-3'>
              {backtests.map((backtest, index) => (
                <BacktestCard
                  key={`${backtest.id}-${index}`}
                  backtest={backtest}
                  onClick={() => handleBacktestSelect(backtest)}
                />
              ))}
            </div>
            {hasNext && (
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
