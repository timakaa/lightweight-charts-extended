import { useState, useEffect } from "react";
import BacktestProgressToast from "./BacktestProgressToast";

/**
 * Container that shows running backtests in the bottom-right corner
 * Max 4 backtests at a time
 */
const BacktestProgressContainer = () => {
  const [runningBacktests, setRunningBacktests] = useState([]);

  // Listen for new backtest events
  useEffect(() => {
    const handleNewBacktest = (event) => {
      const { backtestId } = event.detail;
      setRunningBacktests((prev) => {
        // Don't add duplicates
        if (prev.includes(backtestId)) return prev;
        // Keep max 4
        const updated = [...prev, backtestId];
        return updated.slice(-4);
      });
    };

    window.addEventListener("backtest:started", handleNewBacktest);
    return () => {
      window.removeEventListener("backtest:started", handleNewBacktest);
    };
  }, []);

  const handleRemove = (backtestId) => {
    setRunningBacktests((prev) => prev.filter((id) => id !== backtestId));
  };

  if (runningBacktests.length === 0) {
    return null;
  }

  return (
    <div className='fixed bottom-4 right-4 z-30 flex flex-col gap-2 w-64'>
      {runningBacktests.map((backtestId) => (
        <BacktestProgressToast
          key={backtestId}
          backtestId={backtestId}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
};

export default BacktestProgressContainer;
