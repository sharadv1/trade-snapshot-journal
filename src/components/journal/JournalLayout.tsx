
import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors } from 'lucide-react';
import { toast } from '@/utils/toast';
import { removeDuplicateReflections } from '@/utils/journalStorage';

export function JournalLayout() {
  const location = useLocation();
  const isWeekly = location.pathname.includes('/weekly') || location.pathname === '/journal';
  const isMonthly = location.pathname.includes('/monthly');
  const [isRemoving, setIsRemoving] = useState(false);
  
  const value = isWeekly ? 'weekly' : isMonthly ? 'monthly' : 'weekly';
  
  const handleRemoveDuplicates = () => {
    setIsRemoving(true);
    try {
      const { weeklyRemoved, monthlyRemoved } = removeDuplicateReflections();
      const totalRemoved = weeklyRemoved + monthlyRemoved;
      
      if (totalRemoved > 0) {
        toast.success(`Removed ${totalRemoved} duplicate reflections (${weeklyRemoved} weekly, ${monthlyRemoved} monthly)`);
        // Force refresh UI components
        window.dispatchEvent(new Event('storage'));
      } else {
        toast.info('No duplicate reflections found');
      }
    } catch (error) {
      console.error('Error removing duplicates:', error);
      toast.error('Failed to remove duplicates');
    } finally {
      setIsRemoving(false);
    }
  };
  
  return (
    <div className="w-full py-6 space-y-6 container mx-auto max-w-screen-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trading Journal</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveDuplicates}
          disabled={isRemoving}
          className="flex items-center gap-1"
        >
          <Scissors className="h-4 w-4" />
          <span>{isRemoving ? 'Removing...' : 'Remove Duplicates'}</span>
        </Button>
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
