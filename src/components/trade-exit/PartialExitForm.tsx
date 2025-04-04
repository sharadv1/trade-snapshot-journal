
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CircleDollarSign, SplitSquareVertical, Calendar } from 'lucide-react';
import { Trade } from '@/types';
import { useEffect } from 'react';

interface PartialExitFormProps {
  trade: Trade;
  remainingQuantity: number;
  partialQuantity: number;
  setPartialQuantity: (quantity: number) => void;
  partialExitPrice: number | undefined;
  setPartialExitPrice: (price: number | undefined) => void;
  partialExitDate: string;
  setPartialExitDate: (date: string) => void;
  partialFees: number | undefined;
  setPartialFees: (fees: number | undefined) => void;
  partialNotes: string | undefined;
  setPartialNotes: (notes: string | undefined) => void;
}

export function PartialExitForm({
  trade,
  remainingQuantity,
  partialQuantity,
  setPartialQuantity,
  partialExitPrice,
  setPartialExitPrice,
  partialExitDate,
  setPartialExitDate,
  partialFees,
  setPartialFees,
  partialNotes,
  setPartialNotes
}: PartialExitFormProps) {
  // Ensure partial quantity is never greater than remaining quantity
  useEffect(() => {
    if (partialQuantity > remainingQuantity) {
      setPartialQuantity(remainingQuantity);
    }
  }, [remainingQuantity, partialQuantity, setPartialQuantity]);

  // Ensure remaining quantity is never negative
  const actualRemainingQuantity = Math.max(0, remainingQuantity);

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 p-3 rounded-md mb-4">
        <p className="text-sm text-muted-foreground">
          Remaining quantity: <span className="font-medium">{actualRemainingQuantity}</span> of {trade.quantity}
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="partialQuantity" className="flex items-center gap-1">
          <SplitSquareVertical className="h-4 w-4" />
          Quantity to Exit <span className="text-destructive">*</span>
        </Label>
        <Input 
          id="partialQuantity" 
          type="number"
          min="1"
          max={actualRemainingQuantity}
          step="1"
          value={partialQuantity}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value)) {
              setPartialQuantity(Math.min(value, actualRemainingQuantity));
            }
          }}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="partialExitPrice" className="flex items-center gap-1">
          <CircleDollarSign className="h-4 w-4" />
          Exit Price <span className="text-destructive">*</span>
        </Label>
        <Input 
          id="partialExitPrice" 
          type="number"
          min="0"
          step="0.01"
          value={partialExitPrice || ''}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            setPartialExitPrice(isNaN(value) ? undefined : value);
          }}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="partialExitDate" className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Exit Date & Time
        </Label>
        <Input 
          id="partialExitDate" 
          type="datetime-local"
          value={partialExitDate}
          onChange={(e) => setPartialExitDate(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="partialFees">Fees & Commissions</Label>
        <Input 
          id="partialFees" 
          type="number"
          min="0"
          step="0.01"
          value={partialFees || ''}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            setPartialFees(isNaN(value) ? undefined : value);
          }}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="partialNotes">Notes</Label>
        <Textarea 
          id="partialNotes"
          value={partialNotes || ''}
          onChange={(e) => setPartialNotes(e.target.value)}
          placeholder="Add any notes about this partial exit..."
          className="min-h-20"
        />
      </div>
    </div>
  );
}
