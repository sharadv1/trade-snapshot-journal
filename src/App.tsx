
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Analytics from '@/pages/Analytics';
import TradeEntry from '@/pages/TradeEntry';
import TradeDetail from '@/pages/TradeDetail';
import TradeEdit from '@/pages/TradeEdit';
import Ideas from '@/pages/Ideas';
import StrategyManagement from '@/pages/StrategyManagement';
import NotFound from '@/pages/NotFound';
import { Layout } from '@/components/layout/Layout';
import SymbolManagement from '@/pages/SymbolManagement';
import WeeklyJournal from '@/pages/WeeklyJournal';
import { JournalLayout } from '@/components/journal/JournalLayout';
import { ReflectionsList } from '@/components/journal/ReflectionsList';
import { MonthlyReflectionsList } from '@/components/journal/MonthlyReflectionsList';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/trade/new" element={<TradeEntry />} />
          <Route path="/trade/:id" element={<TradeDetail />} />
          {/* Supporting both URL patterns for edit: */}
          <Route path="/trade/:id/edit" element={<TradeEdit />} />
          <Route path="/trade/edit/:id" element={<TradeEdit />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/strategies" element={<StrategyManagement />} />
          <Route path="/symbols" element={<SymbolManagement />} />
          
          {/* Journal routes with nested structure */}
          <Route path="/journal" element={<JournalLayout />}>
            <Route index element={<ReflectionsList />} />
            <Route path="weekly" element={<ReflectionsList />} />
            <Route path="monthly" element={<MonthlyReflectionsList />} />
            <Route path=":weekId" element={<WeeklyJournal />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
