import React from "react";

const BacktestCard = ({ backtest, onClick }) => {
  const getProfitLossColor = (value) => {
    const numericValue = parseFloat(value);
    if (numericValue > 0) return "text-green-500";
    if (numericValue < 0) return "text-red-500";
    return "text-white";
  };

  return (
    <div
      onClick={onClick}
      className='bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2e39] hover:border-[#3a3f4c] cursor-pointer transition-colors'
    >
      <div className='flex justify-between items-center mb-2'>
        <span className='text-white font-medium'>{backtest.name}</span>
        <span className={getProfitLossColor(backtest.profitLoss)}>
          {backtest.profitLoss}
        </span>
      </div>
      <div className='text-sm text-gray-400'>{backtest.created}</div>
    </div>
  );
};

export default BacktestCard;
