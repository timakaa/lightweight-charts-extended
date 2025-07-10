import React from "react";

const Trades = () => {
  const trades = [
    {
      id: 1,
      symbol: "BTCUSDT",
      entry: 158.12,
      exit: 159.45,
      profit: 245.32,
      type: "LONG",
      date: "2024-03-10 12:45",
      status: "CLOSED",
    },
    {
      id: 2,
      symbol: "BTCUSDT",
      entry: 157.89,
      exit: 156.34,
      profit: -125.45,
      type: "LONG",
      date: "2024-03-10 13:20",
      status: "CLOSED",
    },
    {
      id: 3,
      symbol: "BTCUSDT",
      entry: 156.78,
      exit: 158.9,
      profit: 312.67,
      type: "LONG",
      date: "2024-03-10 14:15",
      status: "CLOSED",
    },
    {
      id: 4,
      symbol: "BTCUSDT",
      entry: 159.23,
      exit: 158.45,
      profit: -145.89,
      type: "SHORT",
      date: "2024-03-10 15:30",
      status: "CLOSED",
    },
    {
      id: 5,
      symbol: "BTCUSDT",
      entry: 158.34,
      exit: 159.78,
      profit: -234.56,
      type: "SHORT",
      date: "2024-03-10 16:15",
      status: "CLOSED",
    },
    {
      id: 6,
      symbol: "BTCUSDT",
      entry: 159.67,
      exit: 161.23,
      profit: 289.45,
      type: "LONG",
      date: "2024-03-10 16:45",
      status: "CLOSED",
    },
    {
      id: 7,
      symbol: "BTCUSDT",
      entry: 161.12,
      exit: 160.34,
      profit: -156.78,
      type: "LONG",
      date: "2024-03-10 17:20",
      status: "CLOSED",
    },
    {
      id: 8,
      symbol: "BTCUSDT",
      entry: 160.45,
      exit: 159.23,
      profit: 198.34,
      type: "SHORT",
      date: "2024-03-10 17:45",
      status: "CLOSED",
    },
    {
      id: 9,
      symbol: "BTCUSDT",
      entry: 159.34,
      exit: 161.56,
      profit: 412.23,
      type: "LONG",
      date: "2024-03-10 18:15",
      status: "CLOSED",
    },
    {
      id: 10,
      symbol: "BTCUSDT",
      entry: 161.45,
      exit: 160.23,
      profit: 189.67,
      type: "SHORT",
      date: "2024-03-10 18:45",
      status: "CLOSED",
    },
  ];

  return (
    <div className='border-t-[4px] cursor-default z-10 h-[350px] border-t-[#2E2E2E] bg-modal text-white absolute bottom-0 left-0 right-0 p-4 overflow-auto'>
      <div className='flex justify-between items-center mb-3'>
        <h2 className='text-base font-bold tracking-wide'>Trade History</h2>
        <span className='text-xs text-gray-400'>{trades.length} trades</span>
      </div>

      <div className='grid grid-cols-2 gap-2'>
        {trades.map((trade) => (
          <div
            key={trade.id}
            className='bg-[#1A1A1A] cursor-pointer rounded p-2 hover:bg-[#242424] transition-colors'
          >
            <div className='flex justify-between items-start'>
              <div className='flex items-center gap-1.5'>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    trade.type === "LONG"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-red-900/50 text-red-400"
                  }`}
                >
                  {trade.type}
                </span>
                <h3 className='text-xs font-medium'>{trade.symbol}</h3>
              </div>
              <span
                className={`text-xs font-mono ${
                  trade.profit >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                ${trade.profit.toFixed(2)}
              </span>
            </div>

            <div className='grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400'>
              <div className='flex justify-between'>
                <span>Entry</span>
                <span className='font-mono text-white'>${trade.entry}</span>
              </div>
              <div className='flex justify-between'>
                <span>Exit</span>
                <span className='font-mono text-white'>${trade.exit}</span>
              </div>
              <div className='flex justify-between'>
                <span>Date</span>
                <span className='text-white'>{trade.date}</span>
              </div>
              <div className='flex justify-between'>
                <span>Status</span>
                <span
                  className={`${
                    trade.status === "OPEN" ? "text-blue-400" : "text-gray-400"
                  }`}
                >
                  {trade.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Trades;
