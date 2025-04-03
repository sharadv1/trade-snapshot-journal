
import React, { useState, useEffect } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getMaxRiskValues, saveMaxRiskValues } from '@/utils/maxRiskStorage';

interface MaxRiskFieldProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export function MaxRiskField({ value, onChange }: MaxRiskFieldProps) {
  const [open, setOpen] = useState(false);
  const [maxRiskValues, setMaxRiskValues] = useState<number[]>([]);
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const loadedValues = getMaxRiskValues();
    setMaxRiskValues(loadedValues);
    
    // If we have values but none is selected, select the first one
    if (loadedValues.length > 0 && value === undefined) {
      onChange(loadedValues[0]);
    }
  }, []);

  const handleAddValue = () => {
    const numValue = parseFloat(newValue.trim());
    if (!isNaN(numValue) && numValue > 0 && !maxRiskValues.includes(numValue)) {
      const updatedValues = [...maxRiskValues, numValue].sort((a, b) => a - b);
      setMaxRiskValues(updatedValues);
      saveMaxRiskValues(updatedValues);
      setNewValue('');
      setIsAdding(false);
    }
  };

  const handleDeleteValue = (valueToDelete: number) => {
    const updatedValues = maxRiskValues.filter(v => v !== valueToDelete);
    setMaxRiskValues(updatedValues);
    saveMaxRiskValues(updatedValues);
    
    // If the deleted value was selected, select the first one or clear
    if (value === valueToDelete) {
      if (updatedValues.length > 0) {
        onChange(updatedValues[0]);
      } else {
        onChange(0);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value !== undefined ? `$${value}` : "Select max risk..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search max risk..." />
          <CommandEmpty>
            {isAdding ? (
              <div className="flex items-center p-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1"
                  placeholder="Amount ($)"
                  type="number"
                  min="0"
                  step="25"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddValue}
                  className="ml-2"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost" 
                  onClick={() => setIsAdding(false)}
                  className="ml-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="py-2 px-1 text-center text-sm">
                <p>No values found</p>
                <Button 
                  variant="ghost"
                  className="mt-2 w-full" 
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Value
                </Button>
              </div>
            )}
          </CommandEmpty>
          <CommandGroup>
            {maxRiskValues.map((riskValue) => (
              <CommandItem
                key={riskValue.toString()}
                value={riskValue.toString()}
                onSelect={() => {
                  onChange(riskValue);
                  setOpen(false);
                }}
                className="group flex items-center justify-between"
              >
                ${riskValue}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteValue(riskValue);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </CommandItem>
            ))}
          </CommandGroup>
          {!isAdding && (
            <div className="p-1 border-t">
              <Button 
                variant="ghost"
                className="w-full" 
                onClick={() => setIsAdding(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Risk Value
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
