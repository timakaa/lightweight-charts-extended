import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Chart from "./components/TradingChart";

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
      <div style={{ overflow: "hidden" }}>
        <Chart />
      </div>
    </QueryClientProvider>
  );
}

export default App;
