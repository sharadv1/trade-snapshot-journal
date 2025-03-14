
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import TradeEntry from '@/pages/TradeEntry';
import TradeDetail from '@/pages/TradeDetail';
import TradeEdit from '@/pages/TradeEdit';
import NotFound from '@/pages/NotFound';
import { Toaster } from 'sonner';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trade/new" element={<TradeEntry />} />
          <Route path="/trade/:id" element={<TradeDetail />} />
          <Route path="/trade/edit/:id" element={<TradeEdit />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster richColors />
    </Router>
  );
}

export default App;
