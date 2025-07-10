import React from "react";
import { useNavigate } from "react-router-dom";
import BacktestCard from "./BacktestCard";

const BacktestModalContent = ({ onClose }) => {
  const navigate = useNavigate();

  // Mock backtest data
  const backtests = [
    {
      id: "1",
      name: "SOL/USDT EMA Cross",
      created: "2024-03-15",
      profitLoss: "+24.5%",
    },
    {
      id: "2",
      name: "BTC/USDT RSI Strategy",
      created: "2024-03-14",
      profitLoss: "-12.3%",
    },
    {
      id: "3",
      name: "ETH/USDT Breakout",
      created: "2024-03-14",
      profitLoss: "+31.7%",
    },
    {
      id: "4",
      name: "BNB/USDT Mean Reversion",
      created: "2024-03-13",
      profitLoss: "+8.9%",
    },
    {
      id: "5",
      name: "AVAX/USDT Volume Strategy",
      created: "2024-03-13",
      profitLoss: "-5.2%",
    },
  ];

  const handleBacktestSelect = () => {
    onClose();
    navigate("/backtest");
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='p-4 border-b border-modal-border'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-bold text-white'>Backtests</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors'
          >
            ✕
          </button>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto p-4'>
        <div className='space-y-3'>
          {backtests.map((backtest, index) => (
            <BacktestCard
              key={`${backtest.id}-${index}`}
              backtest={backtest}
              onClick={handleBacktestSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const BacktestModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed cursor-default inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-modal rounded-lg w-[500px] h-[550px] flex flex-col'>
        <BacktestModalContent onClose={onClose} />
      </div>
    </div>
  );
};

export default BacktestModal;
