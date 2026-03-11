import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Chart from "@components/Chart/Chart";
import TopBar from "@components/TopBar/TopBar";
import Sidebar from "@components/Sidebar/Sidebar";
import Backtest from "@pages/Backtest/Backtest";
import Backtests from "@pages/Backtests/Backtests";
import NotFound404 from "@components/404/404";
import ErrorBoundary from "@components/ErrorBoundary";
import BacktestProgressContainer from "@components/BacktestProgressContainer";

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
                <ErrorBoundary
                  title='TopBar Error'
                  message='The top bar encountered an error. Please refresh the page.'
                >
                  <TopBar />
                </ErrorBoundary>
                <div className='flex-1 flex overflow-hidden'>
                  {drawingTools && (
                    <ErrorBoundary
                      title='Sidebar Error'
                      message='The sidebar encountered an error.'
                      onReset={() => setDrawingTools(null)}
                    >
                      <Sidebar {...drawingTools} />
                    </ErrorBoundary>
                  )}
                  <div className='flex-1 overflow-hidden'>
                    <ErrorBoundary
                      title='Chart Error'
                      message='The chart encountered an error. Try refreshing the page or changing the symbol.'
                      onReset={() => setDrawingTools(null)}
                    >
                      <Chart
                        onChartReady={(data) =>
                          setDrawingTools(data.drawingTools)
                        }
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path='/backtest'
            element={
              <ErrorBoundary
                title='Backtests Error'
                message='Failed to load backtests page.'
              >
                <Backtests />
              </ErrorBoundary>
            }
          />
          <Route
            path='/backtest/:backtestId'
            element={
              <ErrorBoundary
                title='Backtest Error'
                message='Failed to load backtest details.'
              >
                <Backtest />
              </ErrorBoundary>
            }
          />
          <Route path='*' element={<NotFound404 />} />
        </Routes>

        {/* Global backtest progress toasts */}
        <BacktestProgressContainer />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
