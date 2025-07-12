import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BacktestCard from "./BacktestCard";
import { useBacktestsSummarized } from "../hooks/backtests/useBacktests";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

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
    debouncedSearch
  );

  useEffect(() => {
    setPage(1);
    setBacktests([]);
    setHasNext(true);
  }, [debouncedSearch]);

  useEffect(() => {
    if (data?.backtests) {
      setBacktests((prev) =>
        page === 1 ? data.backtests : [...prev, ...data.backtests]
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

  const handleBacktestSelect = () => {
    onClose();
    navigate("/backtest");
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='p-4 border-b border-modal-border'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-white'>Backtests</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors'
          >
            ✕
          </button>
        </div>
        <input
          ref={inputRef}
          type='text'
          placeholder='Search backtests...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full px-3 py-2 bg-modal text-white rounded-md border border-modal-border focus:outline-none focus:border-blue-500'
        />
      </div>

      <div className='flex-1 overflow-y-auto p-4'>
        {isLoading && page === 1 ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-white'>Loading...</div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-red-500'>Error: {error.message}</div>
          </div>
        ) : (
          <>
            <div className='space-y-3'>
              {backtests.map((backtest, index) => (
                <BacktestCard
                  key={`${backtest.id}-${index}`}
                  backtest={backtest}
                  onClick={handleBacktestSelect}
                />
              ))}
            </div>
            {hasNext && (
              <div
                ref={loaderRef}
                className='h-10 flex justify-center items-center'
              >
                {isFetching && (
                  <div className='text-white'>Loading more...</div>
                )}
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
      className='fixed cursor-default inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-modal rounded-lg w-[500px] h-[550px] flex flex-col'>
        <BacktestModalContent onClose={onClose} />
      </div>
    </div>
  );
};

export default BacktestModal;