import React from "react";

const SORTS = [
  { key: "last", label: "Price" },
  { key: "volumePriceRatio", label: "Popular" },
  { key: "percentage", label: "Change" },
];

export const TickerModalSort = ({ sortBy, sortOrder, onSort }) => (
  <div className='flex gap-2 p-4 border-b border-[#2E2E2E]'>
    {SORTS.map(({ key, label }) => (
      <button
        key={key}
        onClick={() => onSort(key)}
        className={`px-3 py-1 rounded text-sm ${
          sortBy === key
            ? "bg-blue-600 text-white"
            : "bg-[#2E2E2E] text-gray-300 hover:bg-[#3D3D3D]"
        }`}
      >
        {label}
        {sortBy === key && (
          <span className='ml-1'>{sortOrder === "desc" ? "↓" : "↑"}</span>
        )}
      </button>
    ))}
  </div>
);
