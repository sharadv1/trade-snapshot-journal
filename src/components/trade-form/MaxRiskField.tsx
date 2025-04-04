
import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMaxRiskValues, getCurrentMaxRisk, setCurrentMaxRisk } from '@/utils/maxRiskStorage';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

interface MaxRiskFieldProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  isReadOnly?: boolean;
}

export function MaxRiskField({ value, onChange, isReadOnly = false }: MaxRiskFieldProps) {
  const [maxRiskValues, setMaxRiskValues] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load max risk values from storage
    try {
      const loadedValues = getMaxRiskValues();
      setMaxRiskValues(Array.isArray(loadedValues) ? loadedValues : []);
      
      // Load current max risk setting if not already set
      if (value === undefined) {
        const currentMaxRisk = getCurrentMaxRisk();
        if (currentMaxRisk !== null) {
          onChange(currentMaxRisk);
        }
      }
    } catch (error) {
      console.error('Error loading max risk values:', error);
      setMaxRiskValues([]);
    } finally {
      setIsLoaded(true);
    }
  }, [value, onChange]);

  const handleChange = (selectedValue: string) => {
    if (selectedValue === 'none') {
      setCurrentMaxRisk(null);
      onChange(undefined);
    } else {
      const riskValue = parseInt(selectedValue, 10);
      setCurrentMaxRisk(riskValue);
      onChange(riskValue);
    }
  };

  // Don't render anything until values are loaded
  if (!isLoaded) {
    return <Skeleton className="h-10 w-full" />;
  }

  // If in read-only mode, just display the value
  if (isReadOnly) {
    return (
      <Input 
        value={value ? `$${value}` : 'No max risk set'} 
        readOnly 
        className="bg-muted"
      />
    );
  }

  // Interactive dropdown for configuration page
  return (
    <Select
      value={value ? value.toString() : 'none'}
      onValueChange={handleChange}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select max risk" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No max risk</SelectItem>
        {maxRiskValues.length > 0 ? (
          maxRiskValues.map((riskValue) => (
            <SelectItem key={riskValue} value={riskValue.toString()}>
              ${riskValue}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="default" disabled>No values configured</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
