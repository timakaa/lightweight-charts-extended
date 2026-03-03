import { useState, useEffect } from "react";
import { useStrategies } from "@hooks/useStrategies";
import { useDebounce } from "@hooks/useDebounce";
import AsyncSelect from "@/components/ui/async-select";

const AsyncStrategySelect = ({ value, onChange }) => {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [allStrategies, setAllStrategies] = useState([]);

  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading, isFetching } = useStrategies({
    page,
    pageSize: 50,
    search: debouncedSearch,
  });

  // Reset when search changes
  useEffect(() => {
    setPage(1);
    setAllStrategies([]);
  }, [debouncedSearch]);

  // Accumulate strategies
  useEffect(() => {
    if (data?.strategies) {
      setAllStrategies((prev) =>
        page === 1 ? data.strategies : [...prev, ...data.strategies],
      );
    }
  }, [data, page]);

  const handleLoadMore = () => {
    if (data?.pagination?.has_next) {
      setPage((prev) => prev + 1);
    }
  };

  const renderStrategyItem = (strategy) => (
    <div className='flex flex-col w-full'>
      <span className='text-sm font-medium text-foreground'>
        {strategy.display_name}
      </span>
      <span className='text-xs text-muted-foreground'>
        {strategy.description}
      </span>
    </div>
  );

  return (
    <AsyncSelect
      value={value}
      onChange={onChange}
      placeholder='Select strategy...'
      searchPlaceholder='Search strategies...'
      items={allStrategies}
      isLoading={isLoading && page === 1}
      isFetching={isFetching}
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      onLoadMore={handleLoadMore}
      renderItem={renderStrategyItem}
      getItemKey={(strategy) => strategy.name}
      getItemValue={(strategy) => strategy.name}
      getItemDisplay={(strategy) => strategy.display_name}
    />
  );
};

export default AsyncStrategySelect;
