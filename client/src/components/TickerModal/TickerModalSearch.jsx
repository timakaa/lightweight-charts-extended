import React from "react";

export const TickerModalSearch = ({ search, onChange }) => {
  const handleInputChange = (e) => {
    const upperCaseValue = e.target.value.toUpperCase();
    onChange({ target: { value: upperCaseValue } });
  };

  return (
    <div className='p-4 border-b border-[#2E2E2E]'>
      <input
        type='text'
        placeholder='Search symbols...'
        value={search}
        onChange={handleInputChange}
        className='w-full px-3 py-2 bg-[#2E2E2E] text-white rounded-md border border-[#4A4A4A] focus:border-blue-500 focus:outline-none'
        autoFocus
      />
    </div>
  );
};
