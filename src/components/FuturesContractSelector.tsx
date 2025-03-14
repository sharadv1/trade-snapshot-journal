
import { FuturesContractSelectorProps } from './types/futuresTypes';
import { COMMON_FUTURES_CONTRACTS } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function FuturesContractSelector({ selectedValue, onSelect }: FuturesContractSelectorProps) {
  const handleSelect = (value: string) => {
    const contract = COMMON_FUTURES_CONTRACTS.find(c => c.symbol === value);
    if (contract) {
      onSelect({
        exchange: contract.exchange,
        contractSize: 1,
        tickSize: contract.tickSize,
        tickValue: contract.pointValue,
      });
    }
  };

  return (
    <Select value={selectedValue} onValueChange={handleSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select a contract" />
      </SelectTrigger>
      <SelectContent>
        {COMMON_FUTURES_CONTRACTS.map((contract) => (
          <SelectItem key={contract.symbol} value={contract.symbol}>
            {contract.symbol} - {contract.description}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
