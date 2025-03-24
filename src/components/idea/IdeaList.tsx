
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, PencilLine, ArrowRight, ArrowUp, ArrowDown, Trash2, ChevronLeft, ChevronRight, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradeIdea } from '@/types';
import { getIdeas, updateIdea, deleteIdea } from '@/utils/ideaStorage';
import { Badge } from '@/components/ui/badge';
import { IdeaDialog } from './IdeaDialog';
import { toast } from '@/utils/toast';
import { format } from 'date-fns';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import { getTradesWithMetrics } from '@/utils/tradeOperations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function IdeaList({ statusFilter = 'all', sortBy = 'date' }: { statusFilter?: string, sortBy?: string }) {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  const [editingIdea, setEditingIdea] = useState<TradeIdea | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [displayedImageIndexes, setDisplayedImageIndexes] = useState<Record<string, number>>({});
  
  const loadIdeas = () => {
    const loadedIdeas = getIdeas();
    setIdeas(loadedIdeas);
    
    // Initialize the displayed image index for each idea
    const initialDisplayIndexes: Record<string, number> = {};
    loadedIdeas.forEach(idea => {
      initialDisplayIndexes[idea.id] = 0;
    });
    setDisplayedImageIndexes(initialDisplayIndexes);
  };
  
  useEffect(() => {
    loadIdeas();
    
    // Listen for storage events to refresh the list
    const handleStorageChange = () => {
      loadIdeas();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen to our custom event for same-window updates
    window.addEventListener('ideas-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ideas-updated', handleStorageChange);
    };
  }, []);
  
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
  
  const createTradeFromIdea = (idea: TradeIdea) => {
    navigate(`/trade/new?ideaId=${idea.id}`);
  };
  
  const handleImageClick = (image: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingImage(image);
  };
  
  const changeDisplayedImage = (ideaId: string, index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setDisplayedImageIndexes(prev => ({
      ...prev,
      [ideaId]: index
    }));
  };
  
  const handleThumbnailClick = (ideaId: string, index: number, image: string, e: React.MouseEvent) => {
    e.stopPropagation();
    changeDisplayedImage(ideaId, index, e);
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
  
  const renderStatusBadge = (status: TradeIdea['status']) => {
    switch (status) {
      case 'still valid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Still Valid</Badge>;
      case 'invalidated':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Invalidated</Badge>;
      case 'taken':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Taken</Badge>;
      default:
        return null;
    }
  };

  const renderDirectionBadge = (direction?: 'long' | 'short') => {
    if (!direction) return null;
    
    return direction === 'long' 
      ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
          <ArrowUp className="mr-1 h-3 w-3" /> Long
        </Badge>
      : <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
          <ArrowDown className="mr-1 h-3 w-3" /> Short
        </Badge>;
  };
  
  const renderImageGallery = (idea: TradeIdea) => {
    if (!idea.images || idea.images.length === 0) return null;
    
    const currentImageIndex = displayedImageIndexes[idea.id] || 0;
    const currentImage = idea.images[currentImageIndex];
    
    return (
      <div className="px-4 pt-2">
        {/* Main image */}
        <div 
          className="w-full h-32 rounded-md overflow-hidden relative cursor-pointer group"
          onClick={(e) => handleImageClick(currentImage, e)}
        >
          <img 
            src={currentImage} 
            alt={`${idea.symbol} chart`}
            className="w-full h-full object-cover"
          />
          
          {idea.images.length > 1 && (
            <>
              {/* Navigation arrows */}
              <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity px-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (currentImageIndex - 1 + idea.images.length) % idea.images.length;
                    changeDisplayedImage(idea.id, newIndex, e);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (currentImageIndex + 1) % idea.images.length;
                    changeDisplayedImage(idea.id, newIndex, e);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Image counter */}
              <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1}/{idea.images.length}
              </div>
            </>
          )}
        </div>
        
        {/* Thumbnails row */}
        {idea.images.length > 1 && (
          <div className="flex mt-2 gap-1 overflow-x-auto pb-1">
            {idea.images.map((image, idx) => (
              <button
                key={idx}
                className={`w-10 h-10 rounded overflow-hidden flex-shrink-0 border-2 ${
                  idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                }`}
                onClick={(e) => handleThumbnailClick(idea.id, idx, image, e)}
              >
                <img 
                  src={image} 
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {ideas.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No trade ideas yet</p>
            <IdeaDialog 
              trigger={<Button>Add Your First Idea</Button>} 
              onIdeaAdded={loadIdeas}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedIdeas.map((idea) => {
            // Find the related trade ID if idea is taken
            const relatedTradeId = idea.status === 'taken' ? findTradeForIdea(idea.id) : null;
            
            return (
              <ContextMenu key={idea.id}>
                <ContextMenuTrigger>
                  <Card className="overflow-hidden flex flex-col">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {idea.symbol}
                            {renderDirectionBadge(idea.direction)}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(idea.date), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                        {renderStatusBadge(idea.status)}
                      </div>
                    </CardHeader>
                    
                    {idea.images && idea.images.length > 0 && renderImageGallery(idea)}
                    
                    <CardContent className="p-4 pt-2 flex-grow">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {idea.description || 'No description provided'}
                      </p>
                      
                      {/* Add trade link for taken ideas */}
                      {idea.status === 'taken' && relatedTradeId && (
                        <div 
                          className="mt-3 text-sm text-primary font-medium flex items-center cursor-pointer hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/trade/${relatedTradeId}`);
                          }}
                        >
                          <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                          View associated trade
                        </div>
                      )}
                      
                      {idea.status === 'taken' && !relatedTradeId && (
                        <div className="mt-3 text-sm text-gray-500 italic">
                          This idea is marked as taken but the trade is no longer available.
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="p-4 pt-0 flex flex-wrap justify-between">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditClick(idea)}
                        >
                          <PencilLine className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        
                        {idea.status !== 'taken' && (
                          <Button 
                            size="sm"
                            onClick={() => createTradeFromIdea(idea)}
                          >
                            <ArrowRight className="mr-1 h-4 w-4" />
                            Create Trade
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(idea.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleEditClick(idea)}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit
                  </ContextMenuItem>
                  {idea.status !== 'taken' && (
                    <ContextMenuItem onClick={() => createTradeFromIdea(idea)}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Create Trade
                    </ContextMenuItem>
                  )}
                  {idea.status === 'taken' && relatedTradeId && (
                    <ContextMenuItem onClick={() => navigate(`/trade/${relatedTradeId}`)}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      View Trade
                    </ContextMenuItem>
                  )}
                  <ContextMenuItem 
                    onClick={() => handleDeleteClick(idea.id)}
                    className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      )}
      
      {/* Edit Dialog */}
      {editingIdea && (
        <IdeaDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          initialIdea={editingIdea}
          onIdeaAdded={() => {
            loadIdeas();
            setEditingIdea(null);
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this trade idea. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image viewer dialog */}
      {viewingImage && (
        <ImageViewerDialog 
          image={viewingImage} 
          isOpen={!!viewingImage} 
          onClose={() => setViewingImage(null)} 
        />
      )}
    </div>
  );
}
