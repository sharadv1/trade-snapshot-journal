
import { useState, useEffect, useCallback, useRef } from 'react';
import { TradeIdea } from '@/types';
import { getIdeas, deleteIdea } from '@/utils/ideaStorage';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { toast } from '@/utils/toast';

export function useIdeaList(statusFilter: string = 'all', sortBy: string = 'date') {
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  const [editingIdea, setEditingIdea] = useState<TradeIdea | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const mountedRef = useRef(true);
  
  const loadIdeas = useCallback(() => {
    if (!mountedRef.current) return;
    
    console.log('Loading ideas from storage');
    const loadedIdeas = getIdeas();
    console.log(`Loaded ${loadedIdeas.length} ideas from storage`);
    setIdeas(loadedIdeas);
  }, []);
  
  useEffect(() => {
    // Set mounted flag
    mountedRef.current = true;
    
    // Initial load
    loadIdeas();
    
    // Define the storage event handler
    const handleStorageChange = (event?: StorageEvent) => {
      // If no event or the event key matches our ideas storage key
      if (!event || event.key === 'trade-journal-ideas' || event.key === null) {
        console.log('Storage change detected, reloading ideas');
        if (mountedRef.current) {
          loadIdeas();
        }
      }
    };
    
    // Define custom event handler for ideas-updated event
    const handleIdeasUpdated = () => {
      console.log('ideas-updated event detected, reloading ideas');
      if (mountedRef.current) {
        loadIdeas();
      }
    };
    
    // Define visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        console.log('Page visible again, checking for updated ideas');
        loadIdeas();
      }
    };
    
    // Listen for multiple event types to ensure data is always fresh
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ideas-updated', handleIdeasUpdated);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set an interval to periodically check for ideas (as a fallback)
    const intervalId = setInterval(() => {
      if (mountedRef.current) {
        console.log('Periodic check for ideas');
        loadIdeas();
      }
    }, 5000);
    
    return () => {
      // Set mounted flag to false
      mountedRef.current = false;
      
      // Clean up event listeners
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ideas-updated', handleIdeasUpdated);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear interval
      clearInterval(intervalId);
    };
  }, [loadIdeas]);
  
  // Refresh ideas when statusFilter or sortBy changes
  useEffect(() => {
    if (mountedRef.current) {
      loadIdeas();
    }
  }, [statusFilter, sortBy, loadIdeas]);
  
  const handleEditClick = (idea: TradeIdea) => {
    setEditingIdea(idea);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (ideaId: string) => {
    setIdeaToDelete(ideaId);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (ideaToDelete) {
      const deleted = deleteIdea(ideaToDelete);
      if (deleted) {
        setIdeaToDelete(null);
        toast.success('Trade idea deleted successfully');
        loadIdeas();
      } else {
        toast.error('Failed to delete trade idea');
      }
    }
  };
  
  // Find the trade ID for a taken idea
  const findTradeForIdea = (ideaId: string): string | null => {
    // Search through all trades to find the one associated with this idea
    const allTrades = getTradesWithMetrics();
    const trade = allTrades.find(trade => trade.ideaId === ideaId);
    return trade ? trade.id : null;
  };
  
  // Filter and sort ideas
  const filteredIdeas = ideas.filter(idea => {
    if (statusFilter === 'all') return true;
    return idea.status === statusFilter;
  });
  
  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime();
    } else if (sortBy === 'symbol') {
      return a.symbol.localeCompare(b.symbol);
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  return {
    ideas,
    editingIdea,
    isEditDialogOpen,
    setIsEditDialogOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    ideaToDelete,
    loadIdeas,
    handleEditClick,
    handleDeleteClick,
    confirmDelete,
    findTradeForIdea,
    sortedIdeas,
    setEditingIdea
  };
}
