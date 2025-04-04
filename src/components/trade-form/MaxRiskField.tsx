
import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMaxRiskValues, getCurrentMaxRisk, setCurrentMaxRisk } from '@/utils/maxRiskStorage';

interface MaxRiskFieldProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function MaxRiskField({ value, onChange }: MaxRiskFieldProps) {
  const [maxRiskValues, setMaxRiskValues] = useState<number[]>([]);

  useEffect(() => {
    // Load max risk values from storage
    const loadedValues = getMaxRiskValues();
    setMaxRiskValues(loadedValues);
    
    // Load current max risk setting if not already set
    if (value === undefined) {
      const currentMaxRisk = getCurrentMaxRisk();
      if (currentMaxRisk !== null) {
        onChange(currentMaxRisk);
      }
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
        {maxRiskValues.map((riskValue) => (
          <SelectItem key={riskValue} value={riskValue.toString()}>
            ${riskValue}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
