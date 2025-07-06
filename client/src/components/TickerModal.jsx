import React, { useState, useEffect } from "react";
import { useTickers } from "../hooks/useTickers";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import {
  TickerModalHeader,
  TickerModalSearch,
  TickerModalSort,
  TickerModalTable,
  TickerModalLoader,
} from "./TickerModal/index";

const TickerModalContent = ({ onClose, onSelectTicker, initialLetter }) => {
  const [searchInput, setSearchInput] = useState(initialLetter || "");
  const [debouncedSearch, setDebouncedSearch] = useState(initialLetter || "");
  const [sortBy, setSortBy] = useState("last");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [tickers, setTickers] = useState([]);
  const [hasNext, setHasNext] = useState(true);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const { data, isLoading, error, isFetching } = useTickers({
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
    enabled: true,
  });

  // Initialize search with initial letter
  React.useEffect(() => {
    if (initialLetter && searchInput !== initialLetter) {
      setSearchInput(initialLetter);
      setDebouncedSearch(initialLetter);
    }
  }, [initialLetter]);

  // Reset on search/sort
  React.useEffect(() => {
    setPage(1);
    setTickers([]);
    setHasNext(true);
  }, [debouncedSearch, sortBy, sortOrder]);

  // Append new tickers when data changes
  React.useEffect(() => {
    if (data?.tickers) {
      setTickers((prev) =>
        page === 1 ? data.tickers : [...prev, ...data.tickers],
      );
      setHasNext(data.pagination?.has_next);
    }
  }, [data, page]);

  // Infinite scroll hook
  const { loaderRef } = useInfiniteScroll({
    hasNext,
    isFetching,
    onLoadMore: () => setPage((prev) => prev + 1),
    offset: 200,
  });

  const handleTickerSelect = (ticker) => {
    onSelectTicker(ticker);
    onClose();
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
    setTickers([]);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  return (
    <>
      <TickerModalHeader onClose={onClose} />
      <TickerModalSearch search={searchInput} onChange={handleSearchChange} />
      <TickerModalSort
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
      <div className='flex-1 overflow-y-auto'>
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
            <TickerModalTable
              tickers={tickers}
              onSelectTicker={handleTickerSelect}
            />
            {hasNext && (
              <TickerModalLoader ref={loaderRef} isFetching={isFetching} />
            )}
          </>
        )}
      </div>
    </>
  );
};

const TickerModal = ({ isOpen, onClose, onSelectTicker, initialLetter }) => {
  // Close modal if click outside content
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed cursor-default inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-[#1E1E1E] rounded-lg w-[600px] max-h-[80vh] flex flex-col'>
        <TickerModalContent
          onClose={onClose}
          onSelectTicker={onSelectTicker}
          initialLetter={initialLetter}
        />
      </div>
    </div>
  );
};

export default TickerModal;
