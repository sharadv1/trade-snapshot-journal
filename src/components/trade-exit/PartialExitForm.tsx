
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trade } from '@/types';
import { CircleDollarSign, SplitSquareVertical, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations/formatters';

interface PartialExitFormProps {
  trade: Trade;
  remainingQuantity: number;
  partialQuantity: number;
  setPartialQuantity: (quantity: number) => void;
  partialExitPrice: number | undefined;
  setPartialExitPrice: (price: number) => void;
  partialExitDate: string;
  setPartialExitDate: (date: string) => void;
  partialFees: number | undefined;
  setPartialFees: (fees: number | undefined) => void;
  partialNotes: string | undefined;
  setPartialNotes: (notes: string | undefined) => void;
  isClosedTradeConversion?: boolean;
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
  setPartialNotes,
  isClosedTradeConversion = false,
}: PartialExitFormProps) {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setPartialQuantity(1); // Default to 1 instead of 0
      return;
    }
    
    // Allow decimal input including intermediate states
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      // Handle special cases like "." or "0."
      if (value === '.' || value === '0.' || value.endsWith('.')) {
        setPartialQuantity(value as any);
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          // Ensure the value doesn't exceed remainingQuantity and is at least 0.001
          const validValue = Math.max(0.001, Math.min(numValue, remainingQuantity));
          setPartialQuantity(validValue);
        }
      }
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setPartialExitPrice(0);
      return;
    }
    
    // Allow decimal input including intermediate states
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      // Handle special cases like "." or "0."
      if (value === '.' || value === '0.' || value.endsWith('.')) {
        setPartialExitPrice(value as any);
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          setPartialExitPrice(numValue);
        }
      }
    }
  };

  const handleFeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setPartialFees(undefined);
      return;
    }
    
    // Allow decimal input including intermediate states
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      // Handle special cases like "." or "0."
      if (value === '.' || value === '0.' || value.endsWith('.')) {
        setPartialFees(value as any);
      } else {
        const numValue = parseFloat(value);
        setPartialFees(isNaN(numValue) ? undefined : numValue);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="partialQuantity" className="flex items-center gap-1">
          <SplitSquareVertical className="h-4 w-4" />
          Quantity <span className="text-destructive">*</span>
        </Label>
        <Input
          id="partialQuantity"
          type="text"
          inputMode="decimal"
          min="0.001"
          max={remainingQuantity}
          value={partialQuantity || 1}
          onChange={handleQuantityChange}
          required
          disabled={isClosedTradeConversion} // Disable if this is a closed trade conversion
        />
        {isClosedTradeConversion ? (
          <p className="text-xs text-muted-foreground">
            Full quantity used for closed trade
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Minimum: 0.001. Max: {remainingQuantity}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="partialExitPrice" className="flex items-center gap-1">
          <CircleDollarSign className="h-4 w-4" />
          Exit Price <span className="text-destructive">*</span>
        </Label>
        <Input
          id="partialExitPrice"
          type="text"
          inputMode="decimal"
          min="0.001"
          value={partialExitPrice || ''}
          onChange={handlePriceChange}
          required
        />
        <p className="text-xs text-muted-foreground">
          Exit price must be greater than zero
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="partialExitDate" className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Exit Date & Time <span className="text-destructive">*</span>
        </Label>
        <Input
          id="partialExitDate"
          type="datetime-local"
          value={partialExitDate.slice(0, 16)}
          onChange={(e) => setPartialExitDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="partialFees" className="flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          Fees & Commissions
        </Label>
        <Input
          id="partialFees"
          type="text"
          inputMode="decimal"
          min="0"
          value={partialFees || ''}
          onChange={handleFeesChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="partialNotes">Notes</Label>
        <Textarea
          id="partialNotes"
          value={partialNotes || ''}
          onChange={(e) => setPartialNotes(e.target.value)}
          placeholder="Add any notes about this exit..."
          className="min-h-20"
        />
      </div>
    </div>
  );
}
