import React from "react";

export const TickerModalHeader = ({ onClose }) => (
  <div className='flex items-center justify-between p-4 border-b border-[#2E2E2E]'>
    <h2 className='text-white text-lg font-semibold'>Select Symbol</h2>
    <button
      onClick={onClose}
      className='text-gray-400 hover:text-white text-xl'
    >
      ×
    </button>
  </div>
);
