import { useLocation } from "react-router-dom";
import Trades from "./Trades";
import DeleteButton from "./DeleteButton";

const ChartContainer = ({
  chartContainerRef,
  chart,
  candleData,
  chartDataInfo,
  hasSelectedDrawing,
  onDeleteSelected,
}) => {
  const { pathname } = useLocation();
  const isBacktestView = pathname.startsWith("/backtest");

  return (
    <div className='flex flex-col relative w-full h-full'>
      <div
        ref={chartContainerRef}
        className={`w-full -mb-1 h-full ${isBacktestView ? "mb-[350px]" : ""}`}
      />
      {isBacktestView && (
        <Trades
          chart={chart}
          candleData={candleData}
          chartDataInfo={chartDataInfo}
        />
      )}
      <DeleteButton onClick={onDeleteSelected} isVisible={hasSelectedDrawing} />
    </div>
  );
};

export default ChartContainer;
