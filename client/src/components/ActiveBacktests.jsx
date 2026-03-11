import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import BacktestProgress from "./BacktestProgress";

/**
 * Component to display all currently running backtests
 */
const ActiveBacktests = () => {
  const [activeBacktests, setActiveBacktests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch active backtests on mount
    const fetchActive = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/backtest/progress/active`,
        );
        if (response.ok) {
          const data = await response.json();
          setActiveBacktests(Object.values(data));
        }
      } catch (error) {
        console.error("Failed to fetch active backtests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActive();
  }, []);

  const handleComplete = (backtestId) => {
    // Remove from active list
    setActiveBacktests((prev) => prev.filter((bt) => bt.id !== backtestId));
  };

  const handleError = (backtestId) => {
    // Remove from active list
    setActiveBacktests((prev) => prev.filter((bt) => bt.id !== backtestId));
  };

  if (isLoading) {
    return null;
  }

  if (activeBacktests.length === 0) {
    return null;
  }

  return (
    <div className='mb-6 space-y-3'>
      <h3 className='text-lg font-semibold text-primary'>Running Backtests</h3>
      <div className='space-y-3'>
        {activeBacktests.map((backtest) => (
          <BacktestProgress
            key={backtest.id}
            backtestId={backtest.id}
            onComplete={() => handleComplete(backtest.id)}
            onError={() => handleError(backtest.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ActiveBacktests;
