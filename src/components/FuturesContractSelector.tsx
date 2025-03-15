
import { FuturesContractSelectorProps } from './types/futuresTypes';
import { COMMON_FUTURES_CONTRACTS } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function FuturesContractSelector({ selectedValue, value, onSelect, onChange }: FuturesContractSelectorProps) {
  // Use either value or selectedValue based on which is provided
  const currentValue = value || selectedValue;
  
  const handleSelect = (value: string) => {
    const contract = COMMON_FUTURES_CONTRACTS.find(c => c.symbol === value);
    if (contract) {
      // Call the appropriate callback based on which was provided
      if (onSelect) {
        onSelect({
          exchange: contract.exchange,
          contractSize: 1,
          tickSize: contract.tickSize,
          tickValue: contract.tickSize * contract.pointValue,
        });
      }
      
      if (onChange) {
        onChange(value);
      }
    }
  };

  return (
    <Select value={currentValue} onValueChange={handleSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select a contract" />
      </SelectTrigger>
      <SelectContent>
        {COMMON_FUTURES_CONTRACTS.map((contract) => (
          <SelectItem key={contract.symbol} value={contract.symbol}>
            {contract.symbol} - {contract.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
