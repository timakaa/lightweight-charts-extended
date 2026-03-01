import React from "react";
import { Button } from "@/components/ui/button";

const SORTS = [
  { key: "last", label: "Price" },
  { key: "volumePriceRatio", label: "Popular" },
  { key: "percentage", label: "Change" },
];

export const TickerModalSort = ({ sortBy, sortOrder, onSort }) => (
  <div className='flex gap-2 p-4 border-b border-border'>
    {SORTS.map(({ key, label }) => (
      <Button
        key={key}
        variant={sortBy === key ? "default" : "outline"}
        size='sm'
        onClick={() => onSort(key)}
        className={
          sortBy === key
            ? "bg-primary text-primary-foreground"
            : "bg-background border-border text-gray-300 hover:bg-accent hover:text-white"
        }
      >
        {label}
        {sortBy === key && (
          <span className='ml-1'>{sortOrder === "desc" ? "↓" : "↑"}</span>
        )}
      </Button>
    ))}
  </div>
);
