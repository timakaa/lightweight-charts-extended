import React from "react";

const SearchBar = ({ value, onChange }) => (
  <input
    type='text'
    placeholder='Search backtests...'
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className='px-4 py-2 rounded-lg bg-modal border border-modal-border text-white focus:outline-none focus:border-blue-500 w-64'
  />
);

export default SearchBar;
