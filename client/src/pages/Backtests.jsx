import React, { useState, useEffect } from "react";
import { useBacktestsSummarized } from "../hooks/backtests/useBacktests";
import { useDebounce } from "../hooks/useDebounce";
import BacktestList from "../components/backtests/BacktestList";
import SearchBar from "../components/backtests/SearchBar";
import LoadingSpinner from "../components/backtests/LoadingSpinner";
import ErrorState from "../components/backtests/ErrorState";

const Backtests = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const pageSize = 50;

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error } = useBacktestsSummarized(
    page,
    pageSize,
    debouncedSearch,
  );
  const backtests = data?.backtests || [];
  const hasNextPage = data?.pagination?.total_pages > page;

  return (
    <div className='min-h-screen bg-modal p-6'>
      <div className='max-w-5xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-white'>Backtests</h1>
          <SearchBar value={searchInput} onChange={setSearchInput} />
        </div>

        {/* Error State */}
        {error && <ErrorState message={error.message} />}

        {/* Initial Loading State */}
        {isLoading && page === 1 && (
          <div className='flex justify-center py-12'>
            <LoadingSpinner />
          </div>
        )}

        {/* Backtests List */}
        {!error && (
          <BacktestList
            backtests={backtests}
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            onLoadMore={() => setPage((p) => p + 1)}
          />
        )}
      </div>
    </div>
  );
};

export default Backtests;
