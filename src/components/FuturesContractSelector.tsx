
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
import { useEffect, useState } from 'react';

// Constants
const FUTURES_CONTRACTS_KEY = 'futures_contracts';

export function FuturesContractSelector({ selectedValue, value, onSelect, onChange }: FuturesContractSelectorProps) {
  // Use either value or selectedValue based on which is provided
  const currentValue = value || selectedValue;
  const [allContracts, setAllContracts] = useState(COMMON_FUTURES_CONTRACTS);
  
  // Load custom contracts when component mounts
  useEffect(() => {
    try {
      const storedContractsJson = localStorage.getItem(FUTURES_CONTRACTS_KEY);
      if (storedContractsJson) {
        const storedContracts = JSON.parse(storedContractsJson);
        
        // Create a merged unique set of contracts, with custom ones taking precedence
        const combinedContracts = [...COMMON_FUTURES_CONTRACTS];
        
        // Add new custom contracts that don't exist in defaults
        storedContracts.forEach((contract: any) => {
          const existingIndex = combinedContracts.findIndex(c => c.symbol.toUpperCase() === contract.symbol.toUpperCase());
          if (existingIndex >= 0) {
            // Replace existing contract
            combinedContracts[existingIndex] = {
              ...contract,
              name: contract.description || contract.symbol,
            };
          } else {
            // Add new contract
            combinedContracts.push({
              symbol: contract.symbol,
              name: contract.description || contract.symbol,
              exchange: contract.exchange,
              tickSize: contract.tickSize,
              pointValue: contract.pointValue,
              contractSize: contract.contractSize || 1,
              description: contract.description
            });
          }
        });
        
        setAllContracts(combinedContracts);
      }
    } catch (error) {
      console.error('Error loading custom futures contracts:', error);
    }
  }, []);
  
  const handleSelect = (value: string) => {
    const contract = allContracts.find(c => c.symbol === value);
    if (contract) {
      // Call the appropriate callback based on which was provided
      if (onSelect) {
        onSelect({
          exchange: contract.exchange,
          contractSize: contract.contractSize || 1,
          tickSize: contract.tickSize,
          tickValue: contract.pointValue,
        });
      }
      
      if (onChange) {
        onChange(value);
      }
    }
  };

  // Group contracts by type for better organization
  const standardContracts = allContracts.filter(c => !c.symbol.startsWith('M'));
  const microContracts = allContracts.filter(c => c.symbol.startsWith('M'));
  const customContracts = allContracts.filter(c => !COMMON_FUTURES_CONTRACTS.some(presetContract => presetContract.symbol === c.symbol));

  return (
    <Select value={currentValue} onValueChange={handleSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select a contract" />
      </SelectTrigger>
      <SelectContent>
        {customContracts.length > 0 && (
          <SelectGroup>
            <SelectLabel>Custom Contracts</SelectLabel>
            {customContracts.map((contract) => (
              <SelectItem key={contract.symbol} value={contract.symbol}>
                {contract.symbol} - {contract.name || contract.description || contract.symbol}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        
        <SelectGroup>
          <SelectLabel>Standard Contracts</SelectLabel>
          {standardContracts
            .filter(c => !c.symbol.startsWith('M') && !customContracts.some(cc => cc.symbol === c.symbol))
            .map((contract) => (
              <SelectItem key={contract.symbol} value={contract.symbol}>
                {contract.symbol} - {contract.name}
              </SelectItem>
            ))}
        </SelectGroup>
        
        <SelectGroup>
          <SelectLabel>Micro Contracts</SelectLabel>
          {microContracts
            .filter(c => !customContracts.some(cc => cc.symbol === c.symbol))
            .map((contract) => (
              <SelectItem key={contract.symbol} value={contract.symbol}>
                {contract.symbol} - {contract.name}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
