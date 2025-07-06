import React from "react";
import { useChartStore } from "../store/chart";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "D", "W"];

const TimeframeSelector = () => {
  const timeframe = useChartStore((state) => state.timeframe);
  const setTimeframe = useChartStore((state) => state.setTimeframe);

  return (
    <div className='flex items-center gap-x-1 text-sm'>
      {TIMEFRAMES.map((el) => (
        <button
          key={el}
          onClick={() => setTimeframe(el)}
          className={`hover:bg-[#3D3D3D] duration-100 h-full p-1 rounded-md ${
            timeframe === el ? "bg-[#3D3D3D] text-white" : ""
          }`}
        >
          {el}
        </button>
      ))}
    </div>
  );
};

export default TimeframeSelector;
