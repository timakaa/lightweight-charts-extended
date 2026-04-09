import Chart from "@components/Chart/Chart";
import TopBar from "@components/TopBar/TopBar";
import Sidebar from "@components/Sidebar/Sidebar";
import Trades from "@components/Trades/Trades";
import TradingSidebar from "./components/TradingSidebar/TradingSidebar";
import { useParams, useSearchParams } from "react-router-dom";
import { useTradingSession } from "@hooks/useTradingSession";
import { useState } from "react";
import NotFound404 from "@components/404/404";
import { normalizeSymbol } from "@/helpers/symbol";
import { useSocket } from "@/contexts/SocketContext";
import { useEffect } from "react";

const Trading = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const { data: session, error } = useTradingSession(sessionId);
  const [chartData, setChartData] = useState(null);
  const { emit } = useSocket();

  // Derive symbol from session data or URL param - wait for session to load
  const rawSymbol = session?.symbol || searchParams.get("ticker");
  const sessionSymbol = rawSymbol ? normalizeSymbol(rawSymbol) : "BTC/USDT";

  // Subscribe to trading:update socket room for this session
  useEffect(() => {
    if (!sessionId) return;
    emit("trading_subscribe", { session_id: Number(sessionId) });
    return () => {
      emit("trading_unsubscribe", { session_id: Number(sessionId) });
    };
  }, [sessionId, emit]);

  if (error) {
    return <NotFound404 />;
  }

  return (
    <div className='fixed inset-0 flex bg-background'>
      <div className='flex-1 flex flex-col overflow-hidden'>
        <TopBar />
        <div className='flex-1 flex overflow-hidden'>
          {chartData && <Sidebar {...chartData.drawingTools} />}
          <div className='flex-1 flex flex-col overflow-hidden'>
            <div className='flex-1 overflow-hidden'>
              <Chart
                drawings={null}
                onChartReady={setChartData}
                symbol={sessionSymbol}
              />
            </div>
            {chartData && (
              <Trades
                chart={chartData.chart}
                candleData={chartData.candleData}
                chartDataInfo={chartData.chartDataInfo}
              />
            )}
          </div>
        </div>
      </div>
      <div className='w-[500px] flex-shrink-0'>
        <TradingSidebar />
      </div>
    </div>
  );
};

export default Trading;
