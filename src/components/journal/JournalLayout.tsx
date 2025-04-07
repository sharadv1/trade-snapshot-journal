
import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

export function JournalLayout() {
  const location = useLocation();
  const path = location.pathname;
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state when component mounts
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine the current view based on the path
  const isMonthlyView = path.includes('/journal/monthly');
  const isWeeklyView = path.includes('/journal/weekly') || path === '/journal';
  const isDetailView = (isWeeklyView && path.includes('/journal/weekly/')) || 
                       (isMonthlyView && path.includes('/journal/monthly/'));
  
  // Determine which tab is active
  const activeTab = isMonthlyView ? 'monthly' : 'weekly';
  
  // Determine back link based on current view
  const backLinkPath = path.includes('/monthly') ? '/journal/monthly' : '/journal/weekly';
  
  // Don't render until mounted to prevent flashing
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/journal">Journal</BreadcrumbLink>
            </BreadcrumbItem>
            {isDetailView && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={backLinkPath}>
                    {path.includes('/monthly') ? 'Monthly' : 'Weekly'} List
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Detail</BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold w-1/3">Trading Journal</h1>
        <div className="w-1/3 flex justify-center">
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
        </div>
        <div className="w-1/3"></div> {/* Empty div to balance the layout */}
      </div>
      <Outlet />
    </div>
  );
}
