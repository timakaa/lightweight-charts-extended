import { useState, useEffect } from "react";
import { useTickers } from "@hooks/useTickers";
import { useDebounce } from "@hooks/useDebounce";
import AsyncSelect from "@/components/ui/async-select";

const AsyncSymbolSelect = ({ value, onChange }) => {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [allTickers, setAllTickers] = useState([]);

  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading, isFetching } = useTickers({
    page,
    pageSize: 50,
    search: debouncedSearch,
    sortBy: "volumePriceRatio",
    sortOrder: "desc",
  });

  // Reset when search changes
  useEffect(() => {
    setPage(1);
    setAllTickers([]);
  }, [debouncedSearch]);

  // Accumulate tickers
  useEffect(() => {
    if (data?.tickers) {
      setAllTickers((prev) =>
        page === 1 ? data.tickers : [...prev, ...data.tickers],
      );
    }
  }, [data, page]);

  const handleLoadMore = () => {
    if (data?.pagination?.has_next) {
      setPage((prev) => prev + 1);
    }
  };

  const renderTickerItem = (ticker) => (
    <div className='flex items-center justify-between w-full'>
      <div className='flex flex-col'>
        <span className='text-sm font-medium text-foreground'>
          {ticker.symbol}
        </span>
        {ticker.last && (
          <span className='text-xs text-muted-foreground'>
            ${parseFloat(ticker.last).toFixed(2)}
          </span>
        )}
      </div>
      {ticker.percentage && (
        <span
          className={`text-xs font-mono ${
            parseFloat(ticker.percentage) >= 0
              ? "text-success-foreground"
              : "text-error-foreground"
          }`}
        >
          {parseFloat(ticker.percentage) >= 0 ? "+" : ""}
          {parseFloat(ticker.percentage).toFixed(2)}%
        </span>
      )}
    </div>
  );

  return (
    <AsyncSelect
      value={value}
      onChange={onChange}
      placeholder='Select symbol...'
      searchPlaceholder='Search symbols...'
      items={allTickers}
      isLoading={isLoading && page === 1}
      isFetching={isFetching}
      onSearch={(search) => setSearchInput(search.toUpperCase())}
      onLoadMore={handleLoadMore}
      renderItem={renderTickerItem}
      getItemKey={(ticker) => ticker.symbol}
      getItemValue={(ticker) => ticker.symbol}
    />
  );
};

export default AsyncSymbolSelect;
