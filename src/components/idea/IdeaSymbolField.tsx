
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface IdeaSymbolFieldProps {
  value: string;
  onChange: (value: string) => void;
  isReadOnly: boolean;
}

export function IdeaSymbolField({ value, onChange, isReadOnly }: IdeaSymbolFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="symbol">Symbol <span className="text-destructive">*</span></Label>
      <Input
        id="symbol"
        name="symbol"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        required
        disabled={isReadOnly}
      />
    </div>
  );
}
