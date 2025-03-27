
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function JournalLayout() {
  const location = useLocation();
  const isMonthlyView = location.pathname === '/journal/monthly';
  const isWeeklyView = location.pathname === '/journal/weekly' || location.pathname === '/journal';
  const isDetailView = location.pathname.match(/^\/journal\/\d{4}-\d{2}-\d{2}$/);
  
  // Determine which tab is active
  const activeTab = isMonthlyView ? 'monthly' : 'weekly';
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Trading Journal</h1>
        {!isDetailView && (
          <Tabs value={activeTab} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly" asChild>
                <Link to="/journal/weekly">Weekly</Link>
              </TabsTrigger>
              <TabsTrigger value="monthly" asChild>
                <Link to="/journal/monthly">Monthly</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        {isDetailView && (
          <Link 
            to={isMonthlyView ? "/journal/monthly" : "/journal/weekly"}
            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Back to List
          </Link>
        )}
      </div>
      <Outlet />
    </div>
  );
}
