
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMMON_FUTURES_CONTRACTS, FuturesContract, FuturesContractDetails } from '@/types';

interface FuturesContractSelectorProps {
  onChange: (details: FuturesContractDetails) => void;
  initialSymbol?: string;
}

export function FuturesContractSelector({ 
  onChange,
  initialSymbol 
}: FuturesContractSelectorProps) {
  const [selectedContract, setSelectedContract] = useState<string>(initialSymbol || '');
  
  // Apply contract details when contract is selected
  useEffect(() => {
    if (selectedContract) {
      const contract = COMMON_FUTURES_CONTRACTS.find(c => c.symbol === selectedContract);
      if (contract) {
        const details: FuturesContractDetails = {
          exchange: contract.exchange,
          contractSize: 1, // Default value, can be customized later
          tickSize: contract.tickSize,
          tickValue: contract.tickValue
        };
        onChange(details);
      }
    }
  }, [selectedContract, onChange]);

  return (
    <div className="space-y-2">
      <Select 
        value={selectedContract} 
        onValueChange={setSelectedContract}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a common contract" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Custom Contract</SelectItem>
          {COMMON_FUTURES_CONTRACTS.map((contract) => (
            <SelectItem key={contract.symbol} value={contract.symbol}>
              {contract.symbol} - {contract.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="text-xs text-muted-foreground">
        {selectedContract && 
          COMMON_FUTURES_CONTRACTS.find(c => c.symbol === selectedContract)?.description
        }
      </div>
    </div>
  );
}
