import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Chart from "@components/Chart/Chart";
import TopBar from "@components/TopBar/TopBar";
import Sidebar from "@components/Sidebar/Sidebar";
import Backtest from "@pages/Backtest/Backtest";
import Backtests from "@pages/Backtests/Backtests";
import NotFound404 from "@components/404/404";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 1,
    },
  },
});

function App() {
  const [drawingTools, setDrawingTools] = React.useState(null);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route
            path='/'
            element={
              <div className='fixed inset-0 flex flex-col bg-background overflow-hidden'>
                <TopBar />
                <div className='flex-1 flex overflow-hidden'>
                  {drawingTools && <Sidebar {...drawingTools} />}
                  <div className='flex-1 overflow-hidden'>
                    <Chart
                      onChartReady={(data) =>
                        setDrawingTools(data.drawingTools)
                      }
                    />
                  </div>
                </div>
              </div>
            }
          />
          <Route path='/backtest' element={<Backtests />} />
          <Route path='/backtest/:backtestId' element={<Backtest />} />
          <Route path='*' element={<NotFound404 />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
