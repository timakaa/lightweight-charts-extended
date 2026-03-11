import { useBacktestProgress } from "../hooks/useBacktestProgress";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const stageMessages = {
  fetching_data: "Fetching data",
  running_backtest: "Running backtest",
  saving_results: "Saving",
  completed: "Completed!",
  failed: "Failed",
};

const BacktestProgressToast = ({ backtestId, onRemove }) => {
  const { progress } = useBacktestProgress(backtestId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (progress?.stage === "completed") {
      queryClient.invalidateQueries({
        queryKey: ["backtestsSummarizedInfinite"],
      });
      queryClient.invalidateQueries({ queryKey: ["backtestsSummarized"] });

      // Auto-remove after 3 seconds
      setTimeout(() => {
        onRemove(backtestId);
      }, 3000);
    } else if (progress?.stage === "failed") {
      // Auto-remove failed after 5 seconds
      setTimeout(() => {
        onRemove(backtestId);
      }, 5000);
    }
  }, [progress?.stage, backtestId, onRemove, queryClient]);

  if (!progress) {
    return null;
  }

  const isCompleted = progress.stage === "completed";
  const isFailed = progress.stage === "failed";
  const stageProgress = progress.stage_progress || 0;

  const handleClick = () => {
    if (isCompleted && progress.result_id) {
      navigate(`/backtest/${progress.result_id}`);
      onRemove(backtestId);
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    onRemove(backtestId);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative cursor-default bg-background border border-border rounded-lg p-3 shadow-lg transition-all ${
        isCompleted ? "cursor-pointer hover:border-green-500" : ""
      }`}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className='absolute top-2 right-2 text-primary/50 hover:text-primary transition-colors'
      >
        <X className='h-3 w-3' />
      </button>

      {/* Header */}
      <div className='flex items-center gap-2 mb-2 pr-6'>
        {!isCompleted && !isFailed && (
          <div className='animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent flex-shrink-0' />
        )}
        {isCompleted && (
          <svg
            className='h-3 w-3 text-green-500 flex-shrink-0'
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
            className='h-3 w-3 text-red-500 flex-shrink-0'
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
        <div className='flex-1 min-w-0'>
          <div className='text-xs font-medium text-primary truncate'>
            {progress.strategy}
          </div>
          <div className='text-xs text-primary/60 truncate'>
            {progress.symbol}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className='w-full bg-border rounded-full h-1 overflow-hidden mb-1'>
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
      <div className='flex items-center justify-between text-xs'>
        <span className={isFailed ? "text-red-500" : "text-primary/60"}>
          {isFailed
            ? "Failed"
            : stageMessages[progress.stage] || progress.message}
        </span>
        <div className='flex items-center gap-2'>
          {!isCompleted && !isFailed && (
            <span className='text-primary/70 font-medium'>
              {Math.round(stageProgress)}%
            </span>
          )}
          <span className='text-primary/50'>
            {progress.current_step}/{progress.total_steps}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BacktestProgressToast;
