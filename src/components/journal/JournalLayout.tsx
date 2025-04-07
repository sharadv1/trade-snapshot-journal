
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'react-router-dom';

export function JournalLayout() {
  const location = useLocation();
  const isWeekly = location.pathname.includes('/weekly') || location.pathname === '/journal';
  const isMonthly = location.pathname.includes('/monthly');
  
  const value = isWeekly ? 'weekly' : isMonthly ? 'monthly' : 'weekly';
  
  return (
    <div className="w-full py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trading Journal</h1>
      </div>
      
      <Tabs value={value} className="w-full mb-6">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="weekly" asChild className="flex-1">
            <NavLink to="/journal/weekly" className={({ isActive }) => isActive ? 'data-[state=active]' : ''}>
              Weekly Reflections
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="monthly" asChild className="flex-1">
            <NavLink to="/journal/monthly" className={({ isActive }) => isActive ? 'data-[state=active]' : ''}>
              Monthly Reflections
            </NavLink>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
}
