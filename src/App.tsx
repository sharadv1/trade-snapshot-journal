
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import TradeEntry from '@/pages/TradeEntry';
import TradeEdit from '@/pages/TradeEdit';
import TradeDetail from '@/pages/TradeDetail';
import Analytics from '@/pages/Analytics';
import StrategyManagement from '@/pages/StrategyManagement';
import NotFound from '@/pages/NotFound';
import { Toaster } from "@/components/ui/sonner";
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/home" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trade/new" element={<TradeEntry />} />
          <Route path="/trade/:id" element={<TradeDetail />} />
          <Route path="/trade/edit/:id" element={<TradeEdit />} />
          <Route path="/trade/:id/edit" element={<TradeEdit />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/strategies" element={<StrategyManagement />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
