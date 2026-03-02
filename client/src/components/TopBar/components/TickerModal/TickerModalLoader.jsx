import React from "react";

export const TickerModalLoader = React.forwardRef(({ isFetching }, ref) => (
  <div ref={ref} className='flex items-center justify-center p-4'>
    <div className='text-primary/70'>
      {isFetching ? "Loading more..." : "Scroll to load more..."}
    </div>
  </div>
));
