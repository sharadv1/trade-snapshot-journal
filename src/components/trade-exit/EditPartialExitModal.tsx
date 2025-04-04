import { useState } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogFooter, 
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CircleDollarSign, SplitSquareVertical, Calendar } from 'lucide-react';
import { Trade, PartialExit } from '@/types';
import { toast } from '@/utils/toast';
import { getTradeById, updateTrade } from '@/utils/storage/tradeOperations';

interface EditPartialExitModalProps {
  trade: Trade;
  partialExit: PartialExit;
  onSuccess: () => void;
  maxQuantity: number;
}

export function EditPartialExitModal({ 
  trade, 
  partialExit, 
  onSuccess,
  maxQuantity
}: EditPartialExitModalProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(partialExit.quantity);
  const [exitPrice, setExitPrice] = useState(partialExit.exitPrice);
  const [exitDate, setExitDate] = useState(partialExit.exitDate);
  const [fees, setFees] = useState<number | undefined>(partialExit.fees);
  const [notes, setNotes] = useState(partialExit.notes || '');

  const handleSave = () => {
    if (quantity <= 0 || quantity > maxQuantity) {
      toast.error(`Quantity must be between 1 and ${maxQuantity}`);
      return;
    }

    if (!exitPrice) {
      toast.error("Please enter an exit price");
      return;
    }

    try {
      // Fetch the latest trade data
      const latestTrade = getTradeById(trade.id);
      if (!latestTrade) {
        toast.error("Failed to retrieve latest trade data");
        return;
      }
      
      // Find and update the partial exit
      const updatedPartialExits = latestTrade.partialExits?.map(exit => 
        exit.id === partialExit.id 
          ? {
              ...exit,
              quantity,
              exitPrice,
              exitDate,
              fees,
              notes
            } 
          : exit
      ) || [];
      
      // We keep the base trade properties intact
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits: updatedPartialExits
      };
      
      // Calculate total exited quantity with the updated partial exit
      const totalExitedQuantity = updatedPartialExits.reduce(
        (total, exit) => total + exit.quantity, 0
      );
      
      // Update trade status based on exited quantity
      if (totalExitedQuantity >= updatedTrade.quantity) {
        // If fully exited through partials, update trade status to closed
        updatedTrade.status = 'closed';
        
        // Calculate weighted average exit price for the main trade
        const totalQuantity = updatedTrade.quantity;
        let weightedSum = 0;
        
        updatedPartialExits.forEach(exit => {
          weightedSum += exit.exitPrice * exit.quantity;
        });
        
        // Set the trade's exit price to the weighted average
        updatedTrade.exitPrice = weightedSum / totalQuantity;
        
        // Find the latest exit date among partial exits
        const sortedExits = [...updatedPartialExits].sort((a, b) => 
          new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
        );
        
        if (sortedExits.length > 0) {
          // Set the trade's exit date to the latest partial exit date
          updatedTrade.exitDate = sortedExits[0].exitDate;
        }
        
        // Sum up all fees
        updatedTrade.fees = updatedPartialExits.reduce(
          (sum, exit) => sum + (exit.fees || 0), 0
        );
      } 
      else if (latestTrade.status === 'closed') {
        // If we're updating an exit and the new total is less than the quantity,
        // we need to reopen the trade since it's no longer fully exited
        updatedTrade.status = 'open';
        updatedTrade.exitDate = undefined;
        updatedTrade.exitPrice = undefined;
        updatedTrade.fees = undefined;
      }
      
      // Update trade in storage
      console.log('Updating trade after partial exit edit:', updatedTrade);
      updateTrade(updatedTrade);
      
      // Ensure all components are notified of the change
      document.dispatchEvent(new CustomEvent('trade-updated'));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'trade-journal-trades',
      }));
      
      toast.success("Partial exit updated successfully");
      setOpen(false);
      
      // Call the onSuccess callback to refresh the data
      onSuccess();
      
    } catch (error) {
      console.error("Error updating partial exit:", error);
      toast.error("Failed to update partial exit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Partial Exit</DialogTitle>
          <DialogDescription>
            Update the details of this partial exit
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="editQuantity" className="flex items-center gap-1">
              <SplitSquareVertical className="h-4 w-4" />
              Quantity <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="editQuantity" 
              type="number"
              min="1"
              max={maxQuantity}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editExitPrice" className="flex items-center gap-1">
              <CircleDollarSign className="h-4 w-4" />
              Exit Price <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="editExitPrice" 
              type="number"
              min="0"
              step="0.01"
              value={exitPrice}
              onChange={(e) => setExitPrice(parseFloat(e.target.value))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editExitDate" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Exit Date & Time
            </Label>
            <Input 
              id="editExitDate" 
              type="datetime-local"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editFees">Fees & Commissions</Label>
            <Input 
              id="editFees" 
              type="number"
              min="0"
              step="0.01"
              value={fees || ''}
              onChange={(e) => setFees(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editNotes">Notes</Label>
            <Textarea 
              id="editNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this partial exit..."
              className="min-h-20"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
