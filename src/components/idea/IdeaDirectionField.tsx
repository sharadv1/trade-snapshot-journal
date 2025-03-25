
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface IdeaDirectionFieldProps {
  value: 'long' | 'short' | undefined;
  onChange: (value: 'long' | 'short') => void;
  isReadOnly: boolean;
}

export function IdeaDirectionField({ value, onChange, isReadOnly }: IdeaDirectionFieldProps) {
  // Set a default value when direction is undefined
  const safeValue = value || 'long';
  
  return (
    <div className="space-y-2">
      <Label>Direction</Label>
      <RadioGroup
        value={safeValue}
        onValueChange={(value) => onChange(value as 'long' | 'short')}
        className="flex space-x-4"
        disabled={isReadOnly}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="long" id="long" />
          <Label htmlFor="long" className="flex items-center cursor-pointer">
            <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
            Long
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="short" id="short" />
          <Label htmlFor="short" className="flex items-center cursor-pointer">
            <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
            Short
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
