import { useState, useMemo } from "react";
import { useBacktestsSummarizedInfinite } from "@hooks/backtests/useBacktests";
import { useDebounce } from "@hooks/useDebounce";
import BacktestList from "./components/BacktestList";
import SearchBar from "./components/SearchBar";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorState from "./components/ErrorState";

const Backtests = () => {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const pageSize = 50;

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetching } =
    useBacktestsSummarizedInfinite(pageSize, debouncedSearch);

  const backtests = useMemo(() => {
    return data?.pages?.flatMap((page) => page.backtests) ?? [];
  }, [data]);

  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-5xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-primary'>Backtests</h1>
          <SearchBar value={searchInput} onChange={setSearchInput} />
        </div>

        {/* Error State */}
        {error && <ErrorState message={error.message} />}

        {/* Initial Loading State */}
        {isLoading && (
          <div className='flex justify-center py-12'>
            <LoadingSpinner />
          </div>
        )}

        {/* Backtests List */}
        {!error && (
          <BacktestList
            backtests={backtests}
            isLoading={isFetching}
            hasNextPage={hasNextPage}
            onLoadMore={fetchNextPage}
          />
        )}
      </div>
    </div>
  );
};

export default Backtests;
