
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IdeaList } from '@/components/idea/IdeaList';
import { IdeaDialog } from '@/components/idea/IdeaDialog';
import { IdeaFilters } from '@/components/idea/IdeaFilters';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncIdeasWithServer } from '@/utils/ideaStorage';

export default function Ideas() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const location = useLocation();
  
  // Force reload ideas when navigating to this page or when it becomes visible
  useEffect(() => {
    console.log('Ideas page mounted or path changed');
    setRefreshKey(prev => prev + 1);
    
    // Attempt to sync with server if applicable
    syncIdeasWithServer().catch(error => {
      console.error('Failed to sync ideas with server:', error);
    });
    
    // Also reload ideas when the page becomes visible again (e.g., after navigating back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Ideas page visible again, refreshing data');
        setRefreshKey(prev => prev + 1);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);
  
  const handleIdeaAdded = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center">
            <Sparkles className="mr-2 h-6 w-6" /> Trade Ideas
          </h1>
          <p className="text-muted-foreground">
            Track potential trading opportunities and turn them into actual trades
          </p>
        </div>
        
        <IdeaDialog 
          trigger={
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              New Idea
            </Button>
          }
          onIdeaAdded={handleIdeaAdded}
        />
      </div>
      
      <IdeaFilters 
        statusFilter={statusFilter}
        sortBy={sortBy}
        onStatusFilterChange={setStatusFilter}
        onSortByChange={setSortBy}
      />
      
      <IdeaList 
        key={refreshKey} 
        statusFilter={statusFilter} 
        sortBy={sortBy} 
      />
    </div>
  );
}
