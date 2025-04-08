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
    // Allow input to start with "0." or "."
    const value = e.target.value;
    if (value === '' || value === '.' || value === '0.') {
      // Keep the input as is to allow typing
      setPartialQuantity(value as any);
    } else {
      // Convert to number if it's a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Ensure the value doesn't exceed remainingQuantity
        setPartialQuantity(Math.min(numValue, remainingQuantity));
      }
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow input to start with "0." or "."
    const value = e.target.value;
    if (value === '' || value === '.' || value === '0.') {
      // Keep the input as is to allow typing
      setPartialExitPrice(value as any);
    } else {
      // Convert to number if it's a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setPartialExitPrice(numValue);
      }
    }
  };

  const handleFeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || value === '.' || value === '0.') {
      // Keep the input as is to allow typing
      setPartialFees(value as any);
    } else if (value === '') {
      setPartialFees(undefined);
    } else {
      // Convert to number if it's a valid number
      const numValue = parseFloat(value);
      setPartialFees(isNaN(numValue) ? undefined : numValue);
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
          min="0.000000001"
          max={remainingQuantity}
          value={partialQuantity || ''}
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
            Supports small values (e.g. 0.000033432). Max: {remainingQuantity}
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
          min="0"
          value={partialExitPrice || ''}
          onChange={handlePriceChange}
          required
        />
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
