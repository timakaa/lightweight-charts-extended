import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Loader2 } from "lucide-react";

/**
 * Reusable async select component with search and pagination
 */
const AsyncSelect = ({
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  items = [],
  isLoading = false,
  isFetching = false,
  searchInput,
  setSearchInput,
  onLoadMore,
  renderItem,
  getItemKey,
  getItemValue,
  getItemDisplay,
  headerButtons,
  onCloseRequest,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDisplayText, setSelectedDisplayText] = useState("");
  const scrollRef = useRef(null);

  // Update display text when value or items change
  useEffect(() => {
    if (!value) {
      setSelectedDisplayText("");
      return;
    }

    const selectedItem = items.find((item) => {
      const itemValue = getItemValue ? getItemValue(item) : item;
      return itemValue === value;
    });

    if (selectedItem) {
      const displayText = getItemDisplay
        ? getItemDisplay(selectedItem)
        : getItemValue
          ? getItemValue(selectedItem)
          : selectedItem;
      setSelectedDisplayText(displayText);
    }
  }, [value, items, getItemValue, getItemDisplay]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleScroll = useCallback(
    (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (
        scrollHeight - scrollTop <= clientHeight * 1.5 &&
        !isFetching &&
        onLoadMore
      ) {
        onLoadMore();
      }
    },
    [isFetching, onLoadMore],
  );

  const handleSelect = (item) => {
    const itemValue = getItemValue ? getItemValue(item) : item;
    onChange(itemValue);
    setIsOpen(false);
    setSearchInput("");
  };

  const getDisplayText = () => {
    if (!value) return placeholder;
    return selectedDisplayText || value;
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchInput("");
  };

  useEffect(() => {
    if (onCloseRequest) {
      onCloseRequest(handleClose);
    }
  }, [onCloseRequest]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='w-full justify-between bg-background border-border text-foreground hover:bg-accent'
        >
          <span>{getDisplayText()}</span>
          <Search className='h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[var(--radix-popover-trigger-width)] p-0'
        align='start'
      >
        {headerButtons && (
          <div className='p-2 border-b border-border cursor-default'>
            {headerButtons}
          </div>
        )}
        <div className='p-2 border-b border-border cursor-default'>
          <Input
            type='text'
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={handleSearchChange}
            className='bg-background border-border text-foreground'
            autoFocus
          />
        </div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onWheel={(e) => e.stopPropagation()}
          className='max-h-[250px] overflow-y-auto'
        >
          {isLoading ? (
            <div className='flex items-center justify-center p-4'>
              <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
              <span className='ml-2 text-sm text-muted-foreground'>
                Loading...
              </span>
            </div>
          ) : items.length > 0 ? (
            <>
              {items.map((item) => {
                const key = getItemKey ? getItemKey(item) : item;
                const itemValue = getItemValue ? getItemValue(item) : item;
                const isSelected = value === itemValue;
                return (
                  <button
                    key={key}
                    type='button'
                    onClick={() => handleSelect(item)}
                    className={`w-full px-3 py-2 text-left hover:bg-accent transition-colors ${
                      isSelected ? "bg-accent" : ""
                    }`}
                  >
                    {renderItem ? renderItem(item, isSelected) : itemValue}
                  </button>
                );
              })}
              {isFetching && (
                <div className='flex items-center justify-center p-2'>
                  <Loader2 className='h-3 w-3 animate-spin text-muted-foreground' />
                </div>
              )}
            </>
          ) : (
            <div className='p-4 cursor-default text-center text-sm text-muted-foreground'>
              No items found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AsyncSelect;
