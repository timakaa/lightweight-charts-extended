import { useState, useEffect } from "react";
import { useDebounce } from "@hooks/useDebounce";
import { useTickers } from "@hooks/useTickers";
import { TickerModalHeader } from "./TickerModalHeader";
import { TickerModalSearch } from "./TickerModalSearch";
import { TickerModalSort } from "./TickerModalSort";
import { TickerModalTable } from "./TickerModalTable";
import { TickerModalLoader } from "./TickerModalLoader";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const TickerModalContent = ({ onClose, onSelectTicker, initialLetter }) => {
  const [searchInput, setSearchInput] = useState(initialLetter || "");
  const [sortBy, setSortBy] = useState("volume");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [allTickers, setAllTickers] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 50;

  // Use the debounce hook correctly - it returns a debounced value
  const debouncedSearch = useDebounce(searchInput, 300);

  // Reset page and tickers when search or sort changes
  useEffect(() => {
    setPage(1);
    setAllTickers([]);
    setHasMore(true);
  }, [debouncedSearch, sortBy, sortOrder]);

  const { data, isLoading, isFetching } = useTickers({
    search: debouncedSearch,
    sortBy,
    sortOrder,
    page,
    pageSize,
  });

  useEffect(() => {
    if (data?.tickers) {
      setAllTickers((prev) =>
        page === 1 ? data.tickers : [...prev, ...data.tickers],
      );
      setHasMore(data.pagination?.has_next || false);
    }
  }, [data]);

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setPage(1);
    setAllTickers([]);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (
      scrollHeight - scrollTop <= clientHeight * 1.5 &&
      hasMore &&
      !isFetching
    ) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className='w-full max-h-[80vh] flex flex-col'>
      <TickerModalHeader onClose={onClose} />
      <TickerModalSearch search={searchInput} onChange={setSearchInput} />
      <TickerModalSort
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
      <div
        className='overflow-y-auto flex-1'
        onScroll={handleScroll}
        style={{ maxHeight: "calc(80vh - 200px)" }}
      >
        {isLoading && page === 1 ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-primary/70'>Loading tickers...</div>
          </div>
        ) : (
          <>
            <TickerModalTable
              tickers={allTickers}
              onSelectTicker={onSelectTicker}
            />
            {isFetching && <TickerModalLoader />}
          </>
        )}
      </div>
    </div>
  );
};

const TickerModal = ({ isOpen, onClose, onSelectTicker, initialLetter }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className='p-0 gap-0 w-[600px] max-w-[600px] max-h-[80vh] flex flex-col overflow-hidden cursor-default' showCloseButton={false}>
      <TickerModalContent
        onClose={onClose}
        onSelectTicker={onSelectTicker}
        initialLetter={initialLetter}
      />
    </DialogContent>
  </Dialog>
);

export default TickerModal;
