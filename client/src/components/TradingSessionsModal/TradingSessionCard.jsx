import { useParams } from "react-router-dom";

const TradingSessionCard = ({ session, onClick }) => {
  const { sessionId } = useParams();
  const isActive = String(session.id) === String(sessionId);
  const isRunning = session.status === "running";

  const getPnlColor = (value) => {
    if (value > 0) return "text-green-500";
    if (value < 0) return "text-red-500";
    return "text-primary";
  };

  const formatDate = (ts) =>
    new Date(ts).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  return (
    <div
      onClick={onClick}
      className={`bg-background w-full p-4 rounded-lg border transition-colors cursor-pointer relative ${
        isActive
          ? "border-blue-500 ring-1 ring-blue-500/80 bg-blue-300/20"
          : "border-border hover:border-foreground/20"
      }`}
    >
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-slow { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>

      <div className='flex justify-between items-center mb-2'>
        <span className='text-primary font-medium truncate mr-2'>
          {session.title}
        </span>
        <div className='flex items-center gap-2 flex-shrink-0'>
          {session.is_paper && (
            <span className='text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400'>
              Paper
            </span>
          )}
          <span className={getPnlColor(session.total_pnl_percentage)}>
            {session.total_pnl_percentage != null
              ? `${session.total_pnl_percentage.toFixed(2)}%`
              : "—"}
          </span>
        </div>
      </div>

      <div className='flex justify-between items-center'>
        <span className='text-sm text-primary/70'>
          {session.symbol} · {session.timeframe} ·{" "}
          {formatDate(session.started_at || session.created_at)}
        </span>
        {isRunning ? (
          <span className='text-xs text-green-500 flex items-center gap-1'>
            <span className='relative flex h-3 w-3 items-center justify-center'>
              <span className='absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping-slow bg-green-500'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-green-500'></span>
            </span>
            LIVE
          </span>
        ) : (
          <span className='text-xs text-primary/40'>Stopped</span>
        )}
      </div>
    </div>
  );
};

export default TradingSessionCard;
