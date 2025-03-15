
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
import { isTradeFullyExited } from '@/utils/tradeCalculations';

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

  const handleDelete = () => {
    try {
      // Fetch the latest trade data
      const latestTrade = getTradeById(trade.id);
      if (!latestTrade) {
        toast.error("Failed to retrieve latest trade data");
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
      if (isTradeFullyExited(updatedTrade)) {
        // If still fully exited, update the exitDate to the latest partial exit
        const sortedExits = [...updatedPartialExits].sort((a, b) => 
          new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
        );
        
        if (sortedExits.length > 0) {
          updatedTrade.exitDate = sortedExits[0].exitDate;
          
          // Recalculate weighted average exit price
          const totalQuantity = updatedTrade.quantity;
          let weightedSum = 0;
          
          updatedPartialExits.forEach(exit => {
            weightedSum += exit.exitPrice * exit.quantity;
          });
          
          updatedTrade.exitPrice = weightedSum / totalQuantity;
        }
      } else if (updatedPartialExits.length === 0) {
        // If no more partial exits, revert to open status if appropriate
        const totalExitedQuantity = updatedPartialExits.reduce(
          (total, exit) => total + exit.quantity, 0
        );
        
        if (totalExitedQuantity < updatedTrade.quantity) {
          updatedTrade.status = 'open';
          updatedTrade.exitDate = undefined;
          updatedTrade.exitPrice = undefined;
        }
      }
      
      updateTrade(updatedTrade);
      toast.success("Partial exit deleted successfully");
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting partial exit:", error);
      toast.error("Failed to delete partial exit");
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
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
