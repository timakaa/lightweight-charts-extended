import React from "react";
import { useNavigate } from "react-router-dom";
import BacktestCard from "./BacktestCard";
import LoadingSpinner from "./LoadingSpinner";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const BacktestList = ({ backtests, isLoading, hasNextPage, onLoadMore }) => {
  const navigate = useNavigate();

  const handleBacktestClick = (backtestId) => {
    navigate(`/backtest/${backtestId}`);
  };

  const { loaderRef } = useInfiniteScroll({
    hasNext: hasNextPage,
    isFetching: isLoading,
    onLoadMore,
    offset: 200,
  });

  if (backtests.length === 0 && !isLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-gray-400'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-16 w-16 mb-4'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
        <p className='text-xl mb-2'>No backtests found</p>
        <p className='text-sm'>Create your first backtest to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {backtests.map((backtest) => (
          <BacktestCard
            key={backtest.id}
            backtest={backtest}
            onClick={() => handleBacktestClick(backtest.id)}
          />
        ))}
      </div>

      {/* Loading More Indicator */}
      {(isLoading || hasNextPage) && backtests.length > 0 && (
        <div ref={loaderRef} className='flex justify-center py-8'>
          {isLoading && <LoadingSpinner />}
        </div>
      )}
    </>
  );
};

export default BacktestList;
