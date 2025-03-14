
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogFooter, 
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CircleDollarSign, SplitSquareVertical, Calendar } from 'lucide-react';
import { Trade, PartialExit } from '@/types';
import { toast } from '@/utils/toast';
import { getTradeById, updateTrade } from '@/utils/tradeStorage';

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
      
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits: updatedPartialExits
      };
      
      updateTrade(updatedTrade);
      toast.success("Partial exit updated successfully");
      setOpen(false);
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
