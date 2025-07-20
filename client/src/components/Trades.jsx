import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTradesByBacktestId } from "../hooks/backtests/useBacktests";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useTradeNavigation } from "../hooks/useTradeNavigation";

const Trades = ({ chart, candleData, chartDataInfo }) => {
  const { backtestId } = useParams();
  const [page, setPage] = useState(1);
  const [trades, setTrades] = useState([]);
  const [hasNext, setHasNext] = useState(true);
  const pageSize = 10;

  const { data, isLoading, error, isFetching } = useTradesByBacktestId(
    parseInt(backtestId),
    page,
    pageSize,
  );

  useEffect(() => {
    setPage(1);
    setTrades([]);
    setHasNext(true);
  }, [backtestId]);

  useEffect(() => {
    if (data?.trades) {
      setTrades((prev) =>
        page === 1 ? data.trades : [...prev, ...data.trades],
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

  const { navigateToTrade, isLoadingForTrade, loadingTradeId } =
    useTradeNavigation(chart, candleData, chartDataInfo);

  const handleTradeClick = (trade) => {
    const tradeId = trade.id || `${trade.entry_time}-${trade.symbol}`;
    navigateToTrade(trade, chartDataInfo?.loadMore);
  };

  if (isLoading && page === 1) {
    return (
      <div className='border-t-[4px] cursor-default z-10 h-[350px] border-t-[#2E2E2E] bg-modal text-white absolute bottom-0 left-0 right-0 p-4 overflow-auto'>
        <div className='flex justify-center items-center h-full'>
          <span className='text-gray-400'>Loading trades...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='border-t-[4px] cursor-default z-10 h-[350px] border-t-[#2E2E2E] bg-modal text-white absolute bottom-0 left-0 right-0 p-4 overflow-auto'>
        <div className='flex justify-center items-center h-full'>
          <span className='text-red-400'>Error loading trades</span>
        </div>
      </div>
    );
  }

  return (
    <div className='border-t-[4px] cursor-default z-10 h-[350px] border-t-[#2E2E2E] bg-modal text-white absolute bottom-0 left-0 right-0 p-4 overflow-auto'>
      <div className='flex justify-between items-center mb-3'>
        <div className='flex items-center gap-2'>
          <h2 className='text-base font-bold tracking-wide'>Trade History</h2>
          {isLoadingForTrade && (
            <div className='flex items-center gap-1 text-blue-400 text-xs'>
              <div className='animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full'></div>
              Loading chart data...
            </div>
          )}
        </div>
        <span className='text-xs text-gray-400'>
          {data?.pagination?.total_count || trades.length} trades
        </span>
      </div>

      <div className='grid grid-cols-2 gap-2 mb-4'>
        {trades.map((trade, index) => {
          const tradeId = trade.id || `${trade.entry_time}-${trade.symbol}`;
          const isLoadingThisTrade =
            isLoadingForTrade && loadingTradeId === tradeId;

          return (
            <div
              key={index}
              onClick={() => !isLoadingForTrade && handleTradeClick(trade)}
              className={`rounded p-2 transition-all duration-200 ${
                isLoadingForTrade
                  ? isLoadingThisTrade
                    ? "cursor-wait bg-blue-900/30 border border-blue-500/50"
                    : "cursor-not-allowed bg-gray-800/50 opacity-60"
                  : `cursor-pointer hover:bg-[#1e1c1c] hover:shadow-md ${
                      (trade.pnl || 0) >= 0 ? "bg-[#131b17]" : "bg-[#221515]"
                    }`
              }`}
              title={
                isLoadingForTrade
                  ? isLoadingThisTrade
                    ? "Loading chart data..."
                    : "Please wait, loading chart data for another trade..."
                  : "Click to navigate to trade on chart"
              }
            >
              <div className='flex justify-between items-start'>
                <div className='flex items-center gap-1.5'>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      trade.trade_type.toUpperCase() === "LONG"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-red-900/50 text-red-400"
                    }`}
                  >
                    {trade.trade_type.toUpperCase()}
                  </span>
                  <h3 className='text-xs font-medium'>
                    {trade.symbol}{" "}
                    <span className='text-gray-400'>#{index + 1}</span>
                  </h3>
                </div>
                <span
                  className={`text-xs font-mono ${
                    (trade.pnl || 0) >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  ${(trade.pnl || 0).toFixed(2)}
                </span>
              </div>

              <div className='grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400'>
                <div className='flex justify-between'>
                  <span>Entry</span>
                  <span className='font-mono text-white'>
                    ${trade.entry_price.toFixed(2)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Exit</span>
                  <span className='font-mono text-white'>
                    ${trade.exit_price.toFixed(2)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Date</span>
                  <span className='text-white'>
                    {trade.entry_time
                      ? new Date(trade.entry_time).toLocaleString(undefined, {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : "N/A"}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Size</span>
                  <span className='text-white'>{trade.size}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {hasNext && (
        <div
          ref={loaderRef}
          className='h-10 flex justify-center items-center mt-4'
        >
          {isFetching && (
            <div className='text-gray-400 text-sm'>Loading more trades...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Trades;
