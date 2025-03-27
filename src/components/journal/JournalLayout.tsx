
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function JournalLayout() {
  const location = useLocation();
  const path = location.pathname;
  
  // Determine the current view based on the path
  const isMonthlyView = path === '/journal/monthly';
  const isWeeklyView = path === '/journal/weekly' || path === '/journal';
  const isDetailView = !isWeeklyView && !isMonthlyView;
  
  // Determine which tab is active
  const activeTab = isMonthlyView ? 'monthly' : 'weekly';
  
  // Determine back link based on current view
  const backLinkPath = path.includes('/monthly') ? '/journal/monthly' : '/journal/weekly';
  
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
            to={backLinkPath}
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
