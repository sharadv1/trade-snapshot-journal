
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
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
import { WeeklyJournal } from '@/pages/WeeklyJournal'; // Changed to named import
import { JournalLayout } from '@/components/journal/JournalLayout';
import { WeeklyReflectionsPage } from '@/components/journal/WeeklyReflectionsPage';
import { MonthlyReflectionsPage } from '@/components/journal/MonthlyReflectionsPage';
import Configs from '@/pages/Configs';
import Lessons from '@/pages/Lessons';
import { format } from 'date-fns';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/toaster';

// Helper component to handle legacy route redirects
const LegacyWeekRedirect = () => {
  const { weekId } = useParams();
  return <Navigate to={`/journal/weekly/${weekId}`} replace />;
};

// Helper component to handle new week/month redirects to current date
const CurrentWeekRedirect = () => {
  const today = new Date();
  const currentWeekId = format(today, 'yyyy-MM-dd');
  return <Navigate to={`/journal/weekly/${currentWeekId}`} replace />;
};

const CurrentMonthRedirect = () => {
  const today = new Date();
  const currentMonthId = format(today, 'yyyy-MM');
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
            {/* Supporting both URL patterns for edit: */}
            <Route path="/trade/:id/edit" element={<TradeEdit />} />
            <Route path="/trade/edit/:id" element={<TradeEdit />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="/strategies" element={<StrategyManagement />} />
            <Route path="/symbols" element={<SymbolManagement />} />
            <Route path="/configs" element={<Configs />} />
            <Route path="/lessons" element={<Lessons />} />
            
            {/* Journal routes with nested structure */}
            <Route path="/journal" element={<JournalLayout />}>
              {/* Default route redirects to weekly */}
              <Route index element={<Navigate to="/journal/weekly" replace />} />
              
              {/* Explicit weekly and monthly list views */}
              <Route path="weekly" element={<WeeklyReflectionsPage />} />
              <Route path="monthly" element={<MonthlyReflectionsPage />} />
              
              {/* Handle "new-week" and "new-month" routes */}
              <Route path="weekly/new-week" element={<CurrentWeekRedirect />} />
              <Route path="monthly/new-month" element={<CurrentMonthRedirect />} />
              
              {/* Weekly detail view */}
              <Route path="weekly/:weekId" element={<WeeklyJournal />} />
              
              {/* Monthly detail view */}
              <Route path="monthly/:monthId" element={<WeeklyJournal />} />
              
              {/* Legacy route for backward compatibility */}
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
