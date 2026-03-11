import { useBacktestProgress } from "../hooks/useBacktestProgress";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const stageMessages = {
  fetching_data: "Fetching market data",
  running_backtest: "Running backtest simulation",
  saving_results: "Saving results",
  completed: "Completed!",
  failed: "Failed",
};

const RunningBacktestCard = ({ backtestId, onComplete }) => {
  const { progress } = useBacktestProgress(backtestId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (progress?.stage === "completed") {
      queryClient.invalidateQueries({
        queryKey: ["backtestsSummarizedInfinite"],
      });
      queryClient.invalidateQueries({ queryKey: ["backtestsSummarized"] });

      if (onComplete) {
        onComplete(backtestId);
      }
    } else if (progress?.stage === "failed") {
      if (onComplete) {
        onComplete(backtestId);
      }
    }
  }, [progress?.stage, backtestId, onComplete, queryClient]);

  if (!progress) {
    return null;
  }

  const isCompleted = progress.stage === "completed";
  const isFailed = progress.stage === "failed";
  const stageProgress = progress.stage_progress || 0;

  const handleClick = () => {
    if (isCompleted && progress.result_id) {
      navigate(`/backtest/${progress.result_id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-background w-full p-4 rounded-lg border transition-colors relative ${
        isCompleted
          ? "border-green-500 ring-1 ring-green-500/50 cursor-pointer hover:bg-green-500/5"
          : isFailed
            ? "border-red-500 ring-1 ring-red-500/50"
            : "border-blue-500 ring-1 ring-blue-500/50"
      }`}
    >
      {/* Header */}
      <div className='flex justify-between items-center mb-2'>
        <div className='flex items-center gap-2'>
          {!isCompleted && !isFailed && (
            <div className='animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent' />
          )}
          {isCompleted && (
            <svg
              className='h-4 w-4 text-green-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          )}
          {isFailed && (
            <svg
              className='h-4 w-4 text-red-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          )}
          <span className='text-primary font-medium'>{progress.strategy}</span>
        </div>
        <span className='text-xs text-primary/60'>
          Step {progress.current_step}/{progress.total_steps}
        </span>
      </div>

      {/* Progress bar */}
      <div className='w-full bg-border rounded-full h-2 overflow-hidden mb-2'>
        <div
          className={`h-full transition-all duration-300 ${
            isFailed
              ? "bg-red-500"
              : isCompleted
                ? "bg-green-500"
                : "bg-blue-500"
          }`}
          style={{ width: `${stageProgress}%` }}
        />
      </div>

      {/* Status */}
      <div className='flex justify-between items-center'>
        <span className='text-sm text-primary/70'>
          {isFailed
            ? progress.error
            : stageMessages[progress.stage] || progress.message}
        </span>
        <div className='flex items-center gap-3'>
          {!isCompleted && !isFailed && (
            <span className='text-sm text-primary/70 font-medium'>
              {Math.round(stageProgress)}%
            </span>
          )}
          <span className='text-sm text-primary/70'>{progress.symbol}</span>
        </div>
      </div>
    </div>
  );
};

export default RunningBacktestCard;
