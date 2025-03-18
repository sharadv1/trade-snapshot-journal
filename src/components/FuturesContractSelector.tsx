
import { FuturesContractSelectorProps } from './types/futuresTypes';
import { COMMON_FUTURES_CONTRACTS } from '@/types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

  // Group contracts by type for better organization
  const standardContracts = COMMON_FUTURES_CONTRACTS.filter(c => !c.symbol.startsWith('M'));
  const microContracts = COMMON_FUTURES_CONTRACTS.filter(c => c.symbol.startsWith('M'));

  return (
    <Select value={currentValue} onValueChange={handleSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select a contract" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Standard Contracts</SelectLabel>
          {standardContracts
            .filter(c => !c.symbol.startsWith('M'))
            .map((contract) => (
              <SelectItem key={contract.symbol} value={contract.symbol}>
                {contract.symbol} - {contract.name}
              </SelectItem>
            ))}
        </SelectGroup>
        
        <SelectGroup>
          <SelectLabel>Micro Contracts</SelectLabel>
          {microContracts.map((contract) => (
            <SelectItem key={contract.symbol} value={contract.symbol}>
              {contract.symbol} - {contract.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
