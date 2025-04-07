
import { useNavigate } from 'react-router-dom';
import { TradeIdea } from '@/types';
import { toast } from '@/utils/toast';
import { useIdeaList } from './useIdeaList';
import { IdeaDialog } from './IdeaDialog';
import { IdeaCard } from './IdeaCard';
import { IdeaEmptyState } from './IdeaEmptyState';
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

export function IdeaList({ statusFilter = 'all', sortBy = 'date' }: { statusFilter?: string, sortBy?: string }) {
  const navigate = useNavigate();
  
  const {
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
  } = useIdeaList(statusFilter, sortBy);
  
  const createTradeFromIdea = (idea: TradeIdea) => {
    navigate(`/trade/new?ideaId=${idea.id}`);
  };
  
  return (
    <div className="space-y-4">
      {ideas.length === 0 ? (
        <IdeaEmptyState onIdeaAdded={loadIdeas} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {sortedIdeas.map((idea) => {
            // Find the related trade ID if idea is taken
            const relatedTradeId = idea.status === 'taken' ? findTradeForIdea(idea.id) : null;
            
            return (
              <IdeaCard
                key={idea.id}
                idea={idea}
                relatedTradeId={relatedTradeId}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                onCreateTradeClick={createTradeFromIdea}
              />
            );
          })}
        </div>
      )}
      
      {/* Edit Dialog */}
      {editingIdea && (
        <IdeaDialog
          mode="edit"
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
    </div>
  );
}
