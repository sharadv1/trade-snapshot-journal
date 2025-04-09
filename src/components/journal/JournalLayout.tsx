
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Scissors } from 'lucide-react';
import { toast } from '@/utils/toast';
import { removeDuplicateReflections } from '@/utils/journalStorage';

export function JournalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isWeekly = location.pathname.includes('/weekly') || location.pathname === '/journal';
  const isMonthly = location.pathname.includes('/monthly');
  const [isRemoving, setIsRemoving] = useState(false);
  
  const value = isWeekly ? 'weekly' : isMonthly ? 'monthly' : 'weekly';
  
  const handleRemoveDuplicates = async () => {
    setIsRemoving(true);
    
    try {
      console.log('Starting duplicate removal process...');
      const result = await removeDuplicateReflections();
      
      if (result.weeklyRemoved > 0 || result.monthlyRemoved > 0) {
        toast.success(`Removed ${result.weeklyRemoved + result.monthlyRemoved} duplicate reflections (${result.weeklyRemoved} weekly, ${result.monthlyRemoved} monthly)`);
        
        // Dispatch events to trigger UI updates
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('journal-updated'));
        
        // Force a page refresh to ensure clean state
        if (location.pathname.includes('/journal')) {
          // Refresh the page by navigating to a different route and back
          const currentPath = location.pathname;
          navigate('/journal', { replace: true });
          setTimeout(() => {
            navigate(currentPath, { replace: true });
          }, 100);
        }
      } else {
        toast.info('No duplicate reflections found');
      }
    } catch (error) {
      console.error('Error removing duplicates:', error);
      toast.error('Failed to remove duplicates');
    } finally {
      setTimeout(() => {
        setIsRemoving(false);
      }, 800);
    }
  };
  
  useEffect(() => {
    // Set up event listeners for journal updates
    const handleJournalUpdate = () => {
      console.log('Journal updated event received in JournalLayout');
      
      // Refresh component state to reflect deleted entries
      if (location.pathname.includes('/journal') && !location.pathname.includes('/weekly/') && !location.pathname.includes('/monthly/')) {
        // Don't refresh if we're on a specific reflection page
        navigate(location.pathname, { replace: true });
      }
    };
    
    window.addEventListener('journal-updated', handleJournalUpdate);
    window.addEventListener('journalUpdated', handleJournalUpdate);
    
    return () => {
      window.removeEventListener('journal-updated', handleJournalUpdate);
      window.removeEventListener('journalUpdated', handleJournalUpdate);
    };
  }, [location.pathname, navigate]);
  
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
