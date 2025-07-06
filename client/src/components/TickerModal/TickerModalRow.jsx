import React from "react";

const formatPrice = (price) => {
  if (!price) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(price);
};

const formatPercentage = (percentage) => {
  if (!percentage) return "0.00%";
  const color = percentage >= 0 ? "text-green-500" : "text-red-500";
  return (
    <span className={color}>
      {percentage >= 0 ? "+" : ""}
      {percentage.toFixed(2)}%
    </span>
  );
};

const formatVolume = (volume) => {
  if (!volume) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(volume);
};

export const TickerModalRow = ({ ticker, onClick }) => (
  <div
    className='grid grid-cols-4 gap-4 p-4 text-sm text-white border-b border-[#2E2E2E] hover:bg-[#2E2E2E] cursor-pointer'
    onClick={onClick}
  >
    <div className='font-medium'>{ticker.symbol}</div>
    <div className='text-right'>${formatPrice(ticker.last)}</div>
    <div className='text-right'>{formatPercentage(ticker.percentage)}</div>
    <div className='text-right text-gray-400'>
      {formatVolume(ticker.volume)}
    </div>
  </div>
);
