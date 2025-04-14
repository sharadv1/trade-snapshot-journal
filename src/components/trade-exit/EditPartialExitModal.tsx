
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
import { formatInTimeZone } from 'date-fns-tz';

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
  // Ensure quantities are stored as numbers in state
  const initialQuantity = typeof partialExit.quantity === 'string' ? parseFloat(partialExit.quantity) : partialExit.quantity;
  const initialExitPrice = typeof partialExit.exitPrice === 'string' ? parseFloat(partialExit.exitPrice) : partialExit.exitPrice;
  
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [exitPrice, setExitPrice] = useState<number>(initialExitPrice);
  const [exitDate, setExitDate] = useState(partialExit.exitDate);
  const [fees, setFees] = useState<number | undefined>(partialExit.fees);
  const [notes, setNotes] = useState(partialExit.notes || '');

  const getCurrentCentralTime = () => {
    return formatInTimeZone(new Date(), 'America/Chicago', "yyyy-MM-dd'T'HH:mm");
  };

  const handleExitDateFocus = () => {
    if (!exitDate) {
      setExitDate(getCurrentCentralTime());
    }
  };

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
      const latestTrade = getTradeById(trade.id);
      if (!latestTrade) {
        toast.error("Failed to retrieve latest trade data");
        return;
      }
      
      const roundedExitPrice = Number(exitPrice.toFixed(2));
      
      const updatedPartialExits = latestTrade.partialExits?.map(exit => 
        exit.id === partialExit.id 
          ? {
              ...exit,
              quantity,
              exitPrice: roundedExitPrice,
              price: roundedExitPrice,
              exitDate,
              date: exitDate,
              fees,
              notes
            } 
          : exit
      ) || [];
      
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits: updatedPartialExits
      };
      
      const totalExitedQuantity = updatedPartialExits.reduce(
        (total, exit) => {
          const exitQty = typeof exit.quantity === 'string' ? parseFloat(exit.quantity) : exit.quantity;
          return total + exitQty;
        }, 0
      );
      
      const totalTradeQuantity = typeof updatedTrade.quantity === 'string' ? 
        parseFloat(updatedTrade.quantity.toString()) : 
        updatedTrade.quantity;
      
      // Auto-detect if target was reached based on exit price
      if (updatedTrade.takeProfit) {
        const targetPrice = typeof updatedTrade.takeProfit === 'string' ? 
          parseFloat(updatedTrade.takeProfit) : 
          updatedTrade.takeProfit;
          
        const isLong = updatedTrade.direction === 'long';
        const targetReached = isLong 
          ? roundedExitPrice >= targetPrice 
          : roundedExitPrice <= targetPrice;
        
        if (targetReached) {
          updatedTrade.targetReached = true;
        }
      }
      
      if (totalExitedQuantity >= totalTradeQuantity) {
        updatedTrade.status = 'closed';
        
        let weightedSum = 0;
        
        updatedPartialExits.forEach(exit => {
          const exitPrc = typeof exit.exitPrice === 'string' ? parseFloat(exit.exitPrice) : exit.exitPrice;
          const exitQty = typeof exit.quantity === 'string' ? parseFloat(exit.quantity) : exit.quantity;
          weightedSum += exitPrc * exitQty;
        });
        
        updatedTrade.exitPrice = Number((weightedSum / totalExitedQuantity).toFixed(2));
        
        const sortedExits = [...updatedPartialExits].sort((a, b) => 
          new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
        );
        
        if (sortedExits.length > 0) {
          updatedTrade.exitDate = sortedExits[0].exitDate;
        }
        
        updatedTrade.fees = updatedPartialExits.reduce(
          (sum, exit) => sum + (exit.fees || 0), 0
        );
      } 
      else if (latestTrade.status === 'closed' && totalExitedQuantity < totalTradeQuantity) {
        updatedTrade.status = 'open';
        updatedTrade.exitDate = undefined;
        updatedTrade.exitPrice = undefined;
        updatedTrade.fees = undefined;
      }
      
      console.log('Updating trade after partial exit edit:', updatedTrade);
      updateTrade(updatedTrade);
      
      document.dispatchEvent(new CustomEvent('trade-updated'));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'trade-journal-trades',
      }));
      
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
              value={exitDate && exitDate.length >= 16 ? exitDate.slice(0, 16) : ''}
              onChange={(e) => setExitDate(e.target.value)}
              onFocus={handleExitDateFocus}
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
              onChange={(e) => setFees(e.target.value ? parseFloat(e.target.value) : undefined)}
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
