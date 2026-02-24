import React from "react";

const LoadingSpinner = () => (
  <div className='flex flex-col items-center justify-center gap-4'>
    <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
    <span className='text-gray-400'>Loading backtests...</span>
  </div>
);

export default LoadingSpinner;
