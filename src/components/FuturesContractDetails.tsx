
import { FuturesContractDetailsProps } from './types/futuresTypes';

// Constants
const FUTURES_CONTRACTS_KEY = 'futures_contracts';

export function FuturesContractDetails({ 
  details, 
  value,
  symbol,
  contractDetails,
  onChange,
  pointValue
}: FuturesContractDetailsProps) {
  // Support both old and new prop structures
  const actualDetails = contractDetails || details;
  const actualValue = pointValue || value;
  
  if (!actualDetails?.exchange && !actualDetails?.tickSize && !actualDetails?.tickValue) return null;
  
  const handleChange = (field: string, value: any) => {
    if (onChange) {
      onChange({
        ...actualDetails,
        [field]: value
      });
    }
  };
  
  // Get custom contract details if available
  const getCustomContractDetails = () => {
    if (!symbol) return null;
    
    try {
      const storedContractsJson = localStorage.getItem(FUTURES_CONTRACTS_KEY);
      if (storedContractsJson) {
        const storedContracts = JSON.parse(storedContractsJson);
        return storedContracts.find((c: any) => 
          c.symbol.toUpperCase() === symbol.toUpperCase()
        );
      }
    } catch (error) {
      console.error('Error reading stored contracts:', error);
    }
    return null;
  };
  
  const customContract = getCustomContractDetails();
  
  // Use custom point value if available, otherwise use contract details
  let displayTickValue = actualDetails.tickValue;
  
  // If we have custom contract settings for this symbol, use them with priority
  if (customContract) {
    displayTickValue = Number(customContract.pointValue);
    console.log(`Using custom contract point value for ${symbol}: ${displayTickValue}`);
  }
  
  // Format the tick value for display with commas for large numbers
  const formattedTickValue = displayTickValue ? 
    Number(displayTickValue).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) : '';
  
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 border rounded-md bg-muted/20">
      <dt className="text-muted-foreground">Exchange:</dt>
      <dd>{actualDetails.exchange || (customContract?.exchange || 'DEFAULT')}</dd>
      
      <dt className="text-muted-foreground">Tick Size:</dt>
      <dd>{actualDetails.tickSize ? Number(actualDetails.tickSize).toFixed(5) : (customContract?.tickSize || '0.01')}</dd>
      
      <dt className="text-muted-foreground">Contract Size:</dt>
      <dd>{actualDetails.contractSize || (customContract?.contractSize || 1)}</dd>
      
      <dt className="text-muted-foreground font-medium">Point Value:</dt>
      <dd className="font-medium">${formattedTickValue}</dd>
      
      {actualDetails.tickSize && displayTickValue && (
        <>
          <dt className="text-muted-foreground font-medium">Tick Value:</dt>
          <dd className="font-medium">${(Number(actualDetails.tickSize) * Number(displayTickValue)).toFixed(5)}</dd>
        </>
      )}
      
      <dt className="text-xs text-muted-foreground col-span-2 mt-2 border-t pt-2">
        Risk calculation uses point value to determine dollar risk based on price movement.
        {customContract && (
          <span className="block mt-1 text-green-600 font-medium">
            Using custom contract settings for {symbol}.
          </span>
        )}
      </dt>
    </dl>
  );
}
