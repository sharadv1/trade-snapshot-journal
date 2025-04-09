
import { useState, useEffect, useCallback } from 'react';
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
  
  const loadIdeas = useCallback(() => {
    console.log('Loading ideas from storage');
    const loadedIdeas = getIdeas();
    console.log(`Loaded ${loadedIdeas.length} ideas from storage`);
    setIdeas(loadedIdeas);
  }, []);
  
  useEffect(() => {
    loadIdeas();
    
    // Listen for storage events to refresh the list
    const handleStorageChange = () => {
      console.log('Storage change detected, reloading ideas');
      loadIdeas();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen to our custom event for same-window updates
    window.addEventListener('ideas-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ideas-updated', handleStorageChange);
    };
  }, [loadIdeas]);
  
  // Refresh ideas when statusFilter or sortBy changes
  useEffect(() => {
    loadIdeas();
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
      deleteIdea(ideaToDelete);
      setIdeaToDelete(null);
      toast.success('Trade idea deleted successfully');
      loadIdeas();
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
      return new Date(b.date).getTime() - new Date(a.date).getTime();
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
