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
import { getTradeById, updateTrade } from '@/utils/storage/tradeOperations';
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
      
      // Create a copy of the trade with the updated partial exits
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits: updatedPartialExits
      };
      
      // Calculate total exited quantity with the updated partial exits
      const totalExitedQuantity = updatedPartialExits.reduce(
        (total, exit) => total + exit.quantity, 0
      );
      
      // Update trade status based on exited quantity
      if (totalExitedQuantity >= updatedTrade.quantity) {
        // If still fully exited after deletion, keep the trade closed
        updatedTrade.status = 'closed';
        
        // Recalculate the weighted average exit price
        const totalQuantity = updatedTrade.quantity;
        let weightedSum = 0;
        
        updatedPartialExits.forEach(exit => {
          weightedSum += exit.exitPrice * exit.quantity;
        });
        
        // Set the trade's exit price to the weighted average
        if (totalQuantity > 0) {
          updatedTrade.exitPrice = weightedSum / totalQuantity;
        }
        
        // Find the latest exit date among partial exits
        const sortedExits = [...updatedPartialExits].sort((a, b) => 
          new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
        );
        
        if (sortedExits.length > 0) {
          // Set the trade's exit date to the latest partial exit date
          updatedTrade.exitDate = sortedExits[0].exitDate;
        }
        
        // Recalculate total fees
        updatedTrade.fees = updatedPartialExits.reduce(
          (sum, exit) => sum + (exit.fees || 0), 0
        );
      } 
      else if (latestTrade.status === 'closed') {
        // If not fully exited after deletion but was closed before, reopen the trade
        updatedTrade.status = 'open';
        updatedTrade.exitDate = undefined;
        updatedTrade.exitPrice = undefined;
        updatedTrade.fees = undefined;
      }
      
      // Update trade in storage
      console.log('Updating trade after partial exit deletion:', updatedTrade);
      await updateTrade(updatedTrade);
      
      // Ensure all components are notified of the change
      document.dispatchEvent(new CustomEvent('trade-updated'));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'trade-journal-trades'
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
            {trade.status === 'closed' && (
              <span className="block mt-2 font-medium">
                Note: If this deletion causes the trade to no longer be fully exited, it will be reopened.
              </span>
            )}
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
