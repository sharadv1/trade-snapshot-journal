
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, PencilLine, XCircle, CheckCircle, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradeIdea } from '@/types';
import { getIdeas, updateIdea, deleteIdea } from '@/utils/ideaStorage';
import { Badge } from '@/components/ui/badge';
import { IdeaDialog } from './IdeaDialog';
import { toast } from '@/utils/toast';
import { format } from 'date-fns';
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

export function IdeaList() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  const [editingIdea, setEditingIdea] = useState<TradeIdea | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  
  const loadIdeas = () => {
    const loadedIdeas = getIdeas();
    setIdeas(loadedIdeas);
  };
  
  useEffect(() => {
    loadIdeas();
    
    // Listen for storage events to refresh the list
    const handleStorageChange = () => {
      loadIdeas();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
  
  const toggleStatus = (idea: TradeIdea, newStatus: 'still valid' | 'invalidated' | 'taken') => {
    updateIdea({
      ...idea,
      status: newStatus
    });
    loadIdeas();
    toast.success(`Trade idea marked as ${newStatus}`);
  };
  
  const createTradeFromIdea = (idea: TradeIdea) => {
    // Navigate to the new trade page and pass the idea ID to prefill
    navigate(`/trade/new?ideaId=${idea.id}`);
  };
  
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
          {ideas.map((idea) => (
            <Card key={idea.id} className="overflow-hidden flex flex-col">
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
              
              {idea.images && idea.images.length > 0 && (
                <div className="px-4 pt-2">
                  <div className="w-full h-32 rounded-md overflow-hidden">
                    <img 
                      src={idea.images[0]} 
                      alt={`${idea.symbol} chart`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <CardContent className="p-4 pt-2 flex-grow">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {idea.description || 'No description provided'}
                </p>
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
                {idea.status !== 'still valid' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleStatus(idea, 'still valid')}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Mark Valid
                  </Button>
                )}
                
                {idea.status !== 'invalidated' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleStatus(idea, 'invalidated')}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Invalidate
                  </Button>
                )}
                
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
              </CardFooter>
            </Card>
          ))}
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
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
