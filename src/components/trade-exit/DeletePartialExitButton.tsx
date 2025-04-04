
import { useState } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Trade } from '@/types';
import { toast } from '@/utils/toast';
import { getTradeById, updateTrade } from '@/utils/tradeStorage';
import { isTradeFullyExited } from '@/utils/calculations/tradeStatus';

interface DeletePartialExitButtonProps {
  trade: Trade;
  exitId: string;
  onSuccess: () => void;
}

export function DeletePartialExitButton({ 
  trade, 
  exitId, 
  onSuccess 
}: DeletePartialExitButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Fetch the latest trade data
      const latestTrade = getTradeById(trade.id);
      if (!latestTrade) {
        toast.error("Failed to retrieve latest trade data");
        setIsDeleting(false);
        return;
      }
      
      // Filter out the partial exit to be deleted
      const updatedPartialExits = latestTrade.partialExits?.filter(
        exit => exit.id !== exitId
      ) || [];
      
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits: updatedPartialExits
      };
      
      // After deletion, check if trade is still fully exited
      const stillFullyExited = isTradeFullyExited(updatedTrade);
      
      if (stillFullyExited) {
        // If still fully exited, update the exitDate to the latest partial exit
        const sortedExits = [...updatedPartialExits].sort((a, b) => {
          const dateA = new Date(a.date || '').getTime() || 0;
          const dateB = new Date(b.date || '').getTime() || 0;
          return dateB - dateA;
        });
        
        if (sortedExits.length > 0) {
          updatedTrade.exitDate = sortedExits[0].date;
          
          // Recalculate weighted average exit price
          const totalQuantity = updatedTrade.quantity;
          let weightedSum = 0;
          
          updatedPartialExits.forEach(exit => {
            weightedSum += exit.price * exit.quantity;
          });
          
          updatedTrade.exitPrice = weightedSum / totalQuantity;
        }
      } else {
        // If no more partial exits or not fully exited, revert to open status
        if (updatedPartialExits.length === 0 || !stillFullyExited) {
          updatedTrade.status = 'open';
          updatedTrade.exitDate = undefined;
          updatedTrade.exitPrice = undefined;
        }
      }
      
      await updateTrade(updatedTrade);
      
      // Trigger a storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'trade-journal-trades',
        newValue: JSON.stringify(localStorage.getItem('trade-journal-trades'))
      }));
      
      toast.success("Partial exit deleted successfully");
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting partial exit:", error);
      toast.error("Failed to delete partial exit");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Partial Exit</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this partial exit? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
