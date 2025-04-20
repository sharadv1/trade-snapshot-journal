
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Analytics from '@/pages/Analytics';
import TradeEntry from '@/pages/TradeEntry';
import { TradeDetail } from '@/pages/TradeDetail';
import TradeEdit from '@/pages/TradeEdit';
import Ideas from '@/pages/Ideas';
import StrategyManagement from '@/pages/StrategyManagement';
import NotFound from '@/pages/NotFound';
import { Layout } from '@/components/layout/Layout';
import SymbolManagement from '@/pages/SymbolManagement';
import { WeeklyJournal } from '@/pages/WeeklyJournal';
import { MonthlyJournal } from '@/pages/MonthlyJournal';
import { JournalLayout } from '@/components/journal/JournalLayout';
import { WeeklyReflectionsPage } from '@/components/journal/WeeklyReflectionsPage';
import { MonthlyReflectionsPage } from '@/components/journal/MonthlyReflectionsPage';
import Configs from '@/pages/Configs';
import Lessons from '@/pages/Lessons';
import { format, addDays } from 'date-fns';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import AllTrades from '@/pages/AllTrades';
import { clearTradeCache } from '@/utils/tradeCalculations';

// Helper component to handle legacy route redirects
const LegacyWeekRedirect = () => {
  const { weekId } = useParams();
  // Clear cache before redirection to ensure fresh data
  clearTradeCache();
  return <Navigate to={`/journal/weekly/${weekId}`} replace />;
};

// Helper component to handle new week/month redirects to current date
const CurrentWeekRedirect = () => {
  const today = new Date();
  // For weekly reflection, we can use the start date of current week and optionally add days
  // to make sure we're working with the current week, not previous week
  const nextWeek = addDays(today, 1); // Add 1 day to ensure we're in the current week
  const currentWeekId = format(nextWeek, 'yyyy-MM-dd');
  
  // Clear cache before redirection to ensure fresh data
  clearTradeCache();
  return <Navigate to={`/journal/weekly/${currentWeekId}`} replace />;
};

const CurrentMonthRedirect = () => {
  const today = new Date();
  const currentMonthId = format(today, 'yyyy-MM');
  // Clear cache before redirection to ensure fresh data
  clearTradeCache();
  return <Navigate to={`/journal/monthly/${currentMonthId}`} replace />;
};

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/trade/new" element={<TradeEntry />} />
            <Route path="/trade/:id" element={<TradeDetail />} />
            <Route path="/trade/:id/edit" element={<TradeEdit />} />
            <Route path="/trade/edit/:id" element={<TradeEdit />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="/strategies" element={<StrategyManagement />} />
            <Route path="/symbols" element={<SymbolManagement />} />
            <Route path="/configs" element={<Configs />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/trades" element={<AllTrades />} />
            
            <Route path="/journal" element={<JournalLayout />}>
              <Route index element={<Navigate to="/journal/weekly" replace />} />
              <Route path="weekly" element={<WeeklyReflectionsPage />} />
              <Route path="monthly" element={<MonthlyReflectionsPage />} />
              <Route path="weekly/new-week" element={<CurrentWeekRedirect />} />
              <Route path="monthly/new-month" element={<CurrentMonthRedirect />} />
              <Route path="weekly/:weekId" element={<WeeklyJournal />} />
              <Route path="monthly/:monthId" element={<MonthlyJournal />} />
              <Route path=":weekId" element={<LegacyWeekRedirect />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
