import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTradingSessionsInfinite } from "@hooks/useTradingSessions";
import { useInfiniteScroll } from "@hooks/useInfiniteScroll";
import TradingSessionCard from "./TradingSessionCard";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
    <>
      <div className='flex items-center justify-between p-4 border-b border-border flex-shrink-0'>
        <DialogTitle className='text-lg font-semibold text-primary'>
          Live Sessions
        </DialogTitle>
        <DialogClose asChild>
          <Button
            variant='ghost'
            size='icon'
            className='text-primary/70 hover:text-primary h-8 w-8'
          >
            <X className='h-4 w-4' />
          </Button>
        </DialogClose>
      </div>
      <div className='p-4 border-b border-border flex-shrink-0'>
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
    </>
  );
};

const TradingSessionsModal = ({ isOpen, onClose }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className='p-0 gap-0 w-[500px] max-w-[500px] max-h-[80vh] flex flex-col overflow-hidden cursor-default' showCloseButton={false}>
      <TradingSessionsModalContent onClose={onClose} />
    </DialogContent>
  </Dialog>
);

export default TradingSessionsModal;
