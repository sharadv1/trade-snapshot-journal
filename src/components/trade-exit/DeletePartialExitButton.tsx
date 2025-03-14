
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
import { Trade } from '@/types';
import { toast } from '@/utils/toast';
import { getTradeById, updateTrade } from '@/utils/tradeStorage';

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
      
      // Filter out the partial exit
      const updatedPartialExits = latestTrade.partialExits?.filter(exit => exit.id !== exitId) || [];
      
      // Update trade status if there are no more exits
      let status = latestTrade.status;
      if (updatedPartialExits.length === 0 && status === 'closed') {
        status = 'open';
      }
      
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits: updatedPartialExits,
        status,
        // Clear exit data if reopening the trade
        exitDate: status === 'open' ? undefined : latestTrade.exitDate,
        exitPrice: status === 'open' ? undefined : latestTrade.exitPrice
      };
      
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
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          Delete
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
