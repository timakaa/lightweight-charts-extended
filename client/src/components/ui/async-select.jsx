import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [selectedDisplayText, setSelectedDisplayText] = useState("");
  const buttonRef = useRef(null);
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

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Open upwards if not enough space below and more space above
      const openUpwards = spaceBelow < 450 && spaceAbove > spaceBelow;

      // Calculate max height based on available space
      const maxHeight = openUpwards
        ? Math.min(spaceAbove - 8, 400)
        : Math.min(spaceBelow - 8, 400);

      setDropdownPosition({
        bottom: openUpwards ? viewportHeight - rect.top + 4 : null,
        top: openUpwards ? null : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight,
        openUpwards,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearchInput(newValue);
  };

  // Handle scroll for pagination
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

  // Handle item selection
  const handleSelect = (item) => {
    const itemValue = getItemValue ? getItemValue(item) : item;
    onChange(itemValue);
    setIsOpen(false);
    setSearchInput("");
  };

  // Get display text for selected value
  const getDisplayText = () => {
    if (!value) return placeholder;
    return selectedDisplayText || value;
  };

  // Close dropdown
  const handleClose = () => {
    setIsOpen(false);
    setSearchInput("");
  };

  // Expose close function to parent via callback
  useEffect(() => {
    if (onCloseRequest) {
      onCloseRequest(handleClose);
    }
  }, [onCloseRequest]);

  const dropdownContent =
    isOpen &&
    dropdownPosition &&
    createPortal(
      <>
        <div
          className='fixed inset-0 z-[9998] cursor-default animate-in fade-in-0 duration-100'
          onClick={handleClose}
        />
        <div
          className='fixed z-[9999] bg-background border border-border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col'
          style={{
            ...(dropdownPosition.top !== null && {
              top: `${dropdownPosition.top}px`,
            }),
            ...(dropdownPosition.bottom !== null && {
              bottom: `${dropdownPosition.bottom}px`,
            }),
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: `${dropdownPosition.maxHeight}px`,
          }}
        >
          {/* Header Buttons (if provided) */}
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
        </div>
      </>,
      document.body,
    );

  return (
    <>
      <Button
        ref={buttonRef}
        type='button'
        variant='outline'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full justify-between bg-background border-border text-foreground hover:bg-accent'
      >
        <span>{getDisplayText()}</span>
        <Search className='h-4 w-4 opacity-50' />
      </Button>
      {dropdownContent}
    </>
  );
};

export default AsyncSelect;
