
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { useEffect } from 'react';

import { Layout } from './components/layout/Layout';
import { restoreServerConnection } from './utils/tradeStorage';

// Pages
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import TradeEntry from './pages/TradeEntry';
import TradeDetail from './pages/TradeDetail';
import TradeEdit from './pages/TradeEdit';
import Analytics from './pages/Analytics';
import StrategyManagement from './pages/StrategyManagement';
import Ideas from './pages/Ideas';

import './App.css';

// Create a client
const queryClient = new QueryClient();

function App() {
  // Restore server connection on app load
  useEffect(() => {
    restoreServerConnection();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="strategies" element={<StrategyManagement />} />
            <Route path="ideas" element={<Ideas />} />
            <Route path="trade/new" element={<TradeEntry />} />
            <Route path="trade/:id" element={<TradeDetail />} />
            <Route path="trade/:id/edit" element={<TradeEdit />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
