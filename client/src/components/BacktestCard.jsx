import React from "react";
import { useParams } from "react-router-dom";

const BacktestCard = ({ backtest, onClick }) => {
  const { backtestId } = useParams();
  const isActive = String(backtest.id) === String(backtestId);

  const getProfitLossColor = (value) => {
    const numericValue = parseFloat(value);
    if (numericValue > 0) return "text-green-500";
    if (numericValue < 0) return "text-red-500";
    return "text-white";
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[#0D0E10] p-4 rounded-lg border transition-colors cursor-pointer ${
        isActive
          ? "border-blue-500 ring-2 ring-blue-500 bg-blue-500/20"
          : "border-[#2a2e39] hover:border-[#3a3f4c]"
      }`}
    >
      <style>
        {`
          @keyframes ping {
            75%, 100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          .animate-ping-slow {
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}
      </style>
      <div className='flex justify-between items-center mb-2'>
        <span className='text-white font-medium'>{backtest.title}</span>
        <span className={getProfitLossColor(backtest.total_pnl_percentage)}>
          {backtest.total_pnl_percentage.toFixed(2)}%
        </span>
      </div>
      <div className='flex justify-between items-center'>
        <span className='text-sm text-gray-400'>
          {formatDate(backtest.created_at)}
        </span>
        {backtest.is_live && (
          <span className='text-xs text-red-500 flex items-center gap-1'>
            <span className='relative flex h-3 w-3 items-center justify-center'>
              <span className='absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping-slow bg-red-500'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-red-500'></span>
            </span>
            LIVE
          </span>
        )}
      </div>
    </div>
  );
};

export default BacktestCard;
