import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

/**
 * Reusable async select component with search and pagination
 *
 * @param {Object} props
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.placeholder - Placeholder text for button
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 * @param {Array} props.items - Array of items to display
 * @param {boolean} props.isLoading - Loading state for initial load
 * @param {boolean} props.isFetching - Loading state for pagination
 * @param {Function} props.onSearch - Callback when search input changes
 * @param {Function} props.onLoadMore - Callback to load more items
 * @param {Function} props.renderItem - Function to render each item (item, isSelected) => ReactNode
 * @param {Function} props.getItemKey - Function to get unique key for item
 * @param {Function} props.getItemValue - Function to get value from item for selection
 * @param {Function} props.getItemDisplay - Optional function to get display text from item (defaults to getItemValue)
 */
const AsyncSelect = ({
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  items = [],
  isLoading = false,
  isFetching = false,
  onSearch,
  onLoadMore,
  renderItem,
  getItemKey,
  getItemValue,
  getItemDisplay,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const buttonRef = useRef(null);
  const scrollRef = useRef(null);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearchInput(newValue);
    onSearch?.(newValue);
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

    // Find the selected item
    const selectedItem = items.find((item) => {
      const itemValue = getItemValue ? getItemValue(item) : item;
      return itemValue === value;
    });

    if (!selectedItem) return value;

    // Use getItemDisplay if provided, otherwise fall back to getItemValue
    if (getItemDisplay) {
      return getItemDisplay(selectedItem);
    }

    return getItemValue ? getItemValue(selectedItem) : selectedItem;
  };

  // Close dropdown
  const handleClose = () => {
    setIsOpen(false);
    setSearchInput("");
  };

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
          className='fixed z-[9999] bg-background border border-border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95 duration-100'
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          <div className='p-2 border-b border-border'>
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
              <div className='p-4 text-center text-sm text-muted-foreground'>
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
