import React, { useState, useEffect, memo } from "react";
import { useParams } from "react-router-dom";
import { useTradesByBacktestId } from "@hooks/backtests/useBacktests";
import { useInfiniteScroll } from "@hooks/useInfiniteScroll";
import { useTradeNavigation } from "@hooks/useTradeNavigation";

const Trades = memo(
  ({ chart, candleData, chartDataInfo }) => {
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
      navigateToTrade(trade, chartDataInfo?.loadMore);
    };

    if (isLoading && page === 1) {
      return (
        <div className='border-t-[4px] cursor-default z-10 h-[350px] border-t-border bg-background text-foreground p-4 overflow-auto'>
          <div className='flex justify-center items-center h-full'>
            <span className='text-muted-foreground'>Loading trades...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className='border-t-[4px] cursor-default z-10 h-[350px] border-t-border bg-background text-foreground p-4 overflow-auto'>
          <div className='flex justify-center items-center h-full'>
            <span className='text-destructive'>Error loading trades</span>
          </div>
        </div>
      );
    }

    return (
      <div className='border-t-[4px] cursor-default z-10 h-[350px] border-t-border bg-background text-foreground p-4 overflow-auto'>
        <div className='flex justify-between items-center mb-3'>
          <div className='flex items-center gap-2'>
            <h2 className='text-base font-bold tracking-wide'>Trade History</h2>
            {isLoadingForTrade && (
              <div className='flex items-center gap-1 text-primary text-xs'>
                <div className='animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full'></div>
                Loading chart data...
              </div>
            )}
          </div>
          <span className='text-xs text-muted-foreground'>
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
                key={`${trade.entry_time}-${trade.symbol}-${index}`}
                onClick={() => !isLoadingForTrade && handleTradeClick(trade)}
                className={`rounded p-2 transition-all duration-200 ${
                  isLoadingForTrade
                    ? isLoadingThisTrade
                      ? "cursor-wait bg-primary/20 border border-primary/50"
                      : "cursor-not-allowed bg-muted/50 opacity-60"
                    : `cursor-pointer hover:shadow-md ${
                        (trade.pnl || 0) >= 0
                          ? "bg-success/20 border border-success/30 hover:bg-success/30 hover:border-success/50"
                          : "bg-error/20 border border-error/30 hover:bg-error/30 hover:border-error/50"
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
                          ? "bg-success/30 text-success-foreground"
                          : "bg-error/30 text-error-foreground"
                      }`}
                    >
                      {trade.trade_type.toUpperCase()}
                    </span>
                    <h3 className='text-xs text-foreground font-medium'>
                      {trade.symbol}{" "}
                      <span>#{data?.pagination?.total_count - index}</span>
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-mono font-semibold text-primary`}
                  >
                    ${(trade.pnl || 0).toFixed(2)}
                  </span>
                </div>

                <div className='grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-xs text-foreground'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Entry</span>
                    <span className='font-mono text-foreground'>
                      ${trade.entry_price.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Exit</span>
                    <span className='font-mono text-foreground'>
                      ${trade.exit_price.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Date</span>
                    <span className='text-foreground'>
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
                    <span className='text-muted-foreground'>Size</span>
                    <span className='text-foreground'>{trade.size}</span>
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
              <div className='text-muted-foreground text-sm'>
                Loading more trades...
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if chart, chartDataInfo.pagination, or chartDataInfo.loadMore changes
    // Don't re-render for candleData changes since we use a ref in useTradeNavigation
    return (
      prevProps.chart === nextProps.chart &&
      prevProps.chartDataInfo?.pagination?.has_next ===
        nextProps.chartDataInfo?.pagination?.has_next &&
      prevProps.chartDataInfo?.loadMore === nextProps.chartDataInfo?.loadMore
    );
  },
);

export default Trades;
