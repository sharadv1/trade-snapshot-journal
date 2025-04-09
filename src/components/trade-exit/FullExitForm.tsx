
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CircleDollarSign, Calendar, DollarSign } from 'lucide-react';
import { Trade } from '@/types';

interface FullExitFormProps {
  trade: Trade;
  exitPrice: number | undefined;
  setExitPrice: (price: number | undefined) => void;
  exitDate: string;
  setExitDate: (date: string) => void;
  fees: number | undefined;
  setFees: (fees: number | undefined) => void;
  notes: string;
  setNotes: (notes: string) => void;
}

export function FullExitForm({
  exitPrice,
  setExitPrice,
  exitDate,
  setExitDate,
  fees,
  setFees,
  notes,
  setNotes
}: FullExitFormProps) {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setExitPrice(undefined);
      return;
    }
    
    // Allow decimal input like "0.", "." or valid numbers
    if (value === '.' || value === '0.' || /^\d*\.?\d*$/.test(value)) {
      if (value === '.' || value === '0.') {
        setExitPrice(value as any);
      } else {
        const numValue = parseFloat(value);
        setExitPrice(isNaN(numValue) ? undefined : numValue);
      }
    }
  };

  const handleFeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setFees(undefined);
      return;
    }
    
    // Allow decimal input like "0.", "." or valid numbers
    if (value === '.' || value === '0.' || /^\d*\.?\d*$/.test(value)) {
      if (value === '.' || value === '0.') {
        setFees(value as any);
      } else {
        const numValue = parseFloat(value);
        setFees(isNaN(numValue) ? undefined : numValue);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="exitPrice" className="flex items-center gap-1">
          <CircleDollarSign className="h-4 w-4" />
          Exit Price <span className="text-destructive">*</span>
        </Label>
        <Input 
          id="exitPrice" 
          type="text"
          inputMode="decimal"
          min="0"
          value={exitPrice || ''}
          onChange={handlePriceChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="exitDate" className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Exit Date & Time
        </Label>
        <Input 
          id="exitDate" 
          type="datetime-local"
          value={exitDate}
          onChange={(e) => setExitDate(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="fees" className="flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          Fees & Commissions
        </Label>
        <Input 
          id="fees" 
          type="text"
          inputMode="decimal"
          min="0"
          value={fees || ''}
          onChange={handleFeesChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this exit..."
          className="min-h-20"
        />
      </div>
    </div>
  );
}
