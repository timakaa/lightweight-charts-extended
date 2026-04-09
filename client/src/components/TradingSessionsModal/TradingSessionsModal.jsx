import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTradingSessionsInfinite } from "@hooks/useTradingSessions";
import { useInfiniteScroll } from "@hooks/useInfiniteScroll";
import TradingSessionCard from "./TradingSessionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TradingSessionsModalContent = ({ onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data, isLoading, error, isFetching, fetchNextPage, hasNextPage } =
    useTradingSessionsInfinite(10);

  const sessions = useMemo(
    () => data?.pages?.flatMap((page) => page.sessions) ?? [],
    [data],
  );

  // Client-side search filter (backend doesn't support search on sessions yet)
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return sessions;
    const q = searchTerm.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.symbol?.toLowerCase().includes(q) ||
        s.strategy_name?.toLowerCase().includes(q),
    );
  }, [sessions, searchTerm]);

  const { loaderRef } = useInfiniteScroll({
    hasNext: hasNextPage,
    isFetching,
    onLoadMore: fetchNextPage,
    offset: 200,
  });

  const handleSelect = (session) => {
    onClose();
    navigate(`/trading/${session.id}`);
  };

  return (
    <div className='flex flex-col h-full max-h-[80vh]'>
      <div className='p-4 border-b border-border flex-shrink-0'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-primary'>Live Sessions</h2>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='text-primary/70 hover:text-primary h-8 w-8'
          >
            ✕
          </Button>
        </div>
        <Input
          ref={inputRef}
          type='text'
          placeholder='Search sessions...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='bg-background border-border text-primary'
        />
      </div>

      <div className='flex-1 overflow-y-auto p-4 min-h-0'>
        {isLoading ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-primary'>Loading...</div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-red-500'>Error: {error.message}</div>
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className='space-y-3'>
              {filtered.map((session) => (
                <TradingSessionCard
                  key={session.id}
                  session={session}
                  onClick={() => handleSelect(session)}
                />
              ))}
            </div>
            {hasNextPage && (
              <div
                ref={loaderRef}
                className='h-10 flex justify-center items-center'
              >
                {isFetching && (
                  <div className='text-primary'>Loading more...</div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className='flex items-center justify-center p-8'>
            <div className='text-primary'>No sessions found</div>
          </div>
        )}
      </div>
    </div>
  );
};

const TradingSessionsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className='fixed cursor-default inset-0 bg-black/50 flex items-center justify-center z-[999]'
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className='bg-background border border-border rounded-lg w-[500px] max-h-[80vh] flex flex-col'>
        <TradingSessionsModalContent onClose={onClose} />
      </div>
    </div>
  );
};

export default TradingSessionsModal;
