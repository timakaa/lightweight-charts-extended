import { useBacktestProgress } from "../hooks/useBacktestProgress";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const stageMessages = {
  fetching_data: "Fetching market data",
  running_backtest: "Running backtest simulation",
  saving_results: "Saving results",
  completed: "Backtest completed!",
  failed: "Backtest failed",
};

const BacktestProgress = ({ backtestId, onComplete, onError }) => {
  const { progress, isConnected, error } = useBacktestProgress(backtestId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (progress?.stage === "completed") {
      queryClient.invalidateQueries({
        queryKey: ["backtestsSummarizedInfinite"],
      });
      queryClient.invalidateQueries({ queryKey: ["backtestsSummarized"] });

      if (onComplete) {
        onComplete(progress.result_id);
      }
    } else if (progress?.stage === "failed") {
      if (onError) {
        onError(progress.error);
      }
    }
  }, [
    progress?.stage,
    progress?.result_id,
    progress?.error,
    onComplete,
    onError,
    queryClient,
  ]);

  if (!progress) {
    return (
      <div className='flex items-center gap-3 p-4 bg-background border border-border rounded-lg'>
        <div className='animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent' />
        <span className='text-sm text-primary'>Connecting...</span>
      </div>
    );
  }

  const isCompleted = progress.stage === "completed";
  const isFailed = progress.stage === "failed";
  const stageProgress = progress.stage_progress || 0;

  // Build status message with stage progress
  let statusMessage = stageMessages[progress.stage] || progress.message;
  if (!isCompleted && !isFailed && stageProgress > 0 && stageProgress < 100) {
    statusMessage = `${statusMessage}: ${stageProgress}%`;
  }

  return (
    <div className='p-4 bg-background border border-border rounded-lg space-y-3'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {!isCompleted && !isFailed && (
            <div className='animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent' />
          )}
          {isCompleted && (
            <svg
              className='h-5 w-5 text-green-500'
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
              className='h-5 w-5 text-red-500'
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
          <span className='text-sm font-medium text-primary'>
            {progress.strategy} - {progress.symbol}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-primary/60'>
            Step {progress.current_step}/{progress.total_steps}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className='w-full bg-border rounded-full h-2 overflow-hidden'>
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

      {/* Status Message */}
      <div className='flex items-center justify-between text-xs'>
        <span className={isFailed ? "text-red-500" : "text-primary/70"}>
          {isFailed ? progress.error : statusMessage}
        </span>
        {isConnected && !isCompleted && !isFailed && (
          <span className='text-green-500 flex items-center gap-1'>
            <span className='relative flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-green-500'></span>
            </span>
            Live
          </span>
        )}
      </div>
    </div>
  );
};

export default BacktestProgress;
