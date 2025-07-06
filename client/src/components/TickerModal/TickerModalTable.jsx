import React from "react";
import { TickerModalRow } from "./TickerModalRow";

export const TickerModalTable = ({ tickers, onSelectTicker }) => (
  <div>
    {/* Table Header */}
    <div className='grid grid-cols-4 gap-4 p-4 text-sm text-gray-400 border-b border-[#2E2E2E] font-medium'>
      <div>Symbol</div>
      <div className='text-right'>Price</div>
      <div className='text-right'>Change</div>
      <div className='text-right'>Volume</div>
    </div>
    {/* Tickers */}
    {tickers.map((ticker, index) => (
      <TickerModalRow
        key={`${ticker.symbol}-${index}`}
        ticker={ticker}
        onClick={() => onSelectTicker(ticker.symbol)}
      />
    ))}
  </div>
);
