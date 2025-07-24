import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Chart from "./components/TradingChart";
import Backtest from "./pages/Backtest";
import Backtests from "./pages/Backtests";

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
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route
            path='/'
            element={
              <div style={{ overflow: "hidden" }}>
                <Chart />
              </div>
            }
          />
          <Route path='/backtest' element={<Backtests />} />
          <Route path='/backtest/:backtestId' element={<Backtest />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
