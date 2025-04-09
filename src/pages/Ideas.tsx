
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IdeaList } from '@/components/idea/IdeaList';
import { IdeaDialog } from '@/components/idea/IdeaDialog';
import { IdeaFilters } from '@/components/idea/IdeaFilters';
import { useState } from 'react';

export default function Ideas() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  
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
