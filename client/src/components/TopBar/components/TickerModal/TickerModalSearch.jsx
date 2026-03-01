import React from "react";
import { Input } from "@/components/ui/input";

export const TickerModalSearch = ({ search, onChange }) => {
  const handleInputChange = (e) => {
    const upperCaseValue = e.target.value.toUpperCase();
    onChange(upperCaseValue);
  };

  return (
    <div className='p-4 border-b border-border'>
      <Input
        type='text'
        placeholder='Search symbols...'
        value={search}
        onChange={handleInputChange}
        className='bg-background border-border text-white'
        autoFocus
      />
    </div>
  );
};
