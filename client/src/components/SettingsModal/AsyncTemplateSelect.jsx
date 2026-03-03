import { useState, useEffect, useRef } from "react";
import { useTemplates } from "@/hooks/templates/useTemplates";
import { useDebounce } from "@hooks/useDebounce";
import AsyncSelect from "@/components/ui/async-select";
import { Button } from "@/components/ui/button";

const AsyncTemplateSelect = ({
  value,
  onChange,
  onApplyDefaults,
  onSaveTemplate,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [allTemplates, setAllTemplates] = useState([]);
  const closeDropdownRef = useRef(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading, isFetching } = useTemplates(
    page,
    10,
    debouncedSearch,
  );

  // Reset when search changes
  useEffect(() => {
    setPage(1);
    setAllTemplates([]);
  }, [debouncedSearch]);

  // Accumulate templates
  useEffect(() => {
    if (data?.templates) {
      setAllTemplates((prev) =>
        page === 1 ? data.templates : [...prev, ...data.templates],
      );
    }
  }, [data, page]);

  const handleLoadMore = () => {
    if (data?.pagination?.has_next) {
      setPage((prev) => prev + 1);
    }
  };

  const renderTemplateItem = (template) => (
    <div className='flex flex-col w-full'>
      <span className='text-sm font-medium text-foreground'>
        {template.name}
      </span>
      <span className='text-xs text-muted-foreground'>
        {new Date(template.created_at).toLocaleDateString()}
      </span>
    </div>
  );

  const headerButtons = (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        size='sm'
        onClick={(e) => {
          e.stopPropagation();
          onApplyDefaults?.();
          closeDropdownRef.current?.();
        }}
        className='flex-1 text-xs'
      >
        Apply Defaults
      </Button>
      <Button
        variant='outline'
        size='sm'
        onClick={(e) => {
          e.stopPropagation();
          onSaveTemplate?.();
          closeDropdownRef.current?.();
        }}
        className='flex-1 text-xs'
      >
        Save Template
      </Button>
    </div>
  );

  return (
    <AsyncSelect
      value={value}
      onChange={onChange}
      placeholder='Template'
      searchPlaceholder='Search templates...'
      items={allTemplates}
      isLoading={isLoading && page === 1}
      isFetching={isFetching}
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      onLoadMore={handleLoadMore}
      renderItem={renderTemplateItem}
      getItemKey={(template) => template.id}
      getItemValue={(template) => template.id}
      getItemDisplay={(template) => template.name}
      headerButtons={headerButtons}
      onCloseRequest={(closeFn) => {
        closeDropdownRef.current = closeFn;
      }}
    />
  );
};

export default AsyncTemplateSelect;
