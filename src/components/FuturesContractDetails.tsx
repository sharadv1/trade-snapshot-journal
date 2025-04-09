
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
  
  if (!actualDetails?.exchange && !actualDetails?.tickSize && !actualDetails?.tickValue && !symbol) return null;
  
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
  
  // Determine which point value to display, with custom contract taking priority
  let displayPointValue = actualDetails?.tickValue;
  let displayTickSize = actualDetails?.tickSize;
  let displayExchange = actualDetails?.exchange;
  let displayContractSize = actualDetails?.contractSize || 1;
  
  // If we have custom contract settings for this symbol, use them with priority
  if (customContract) {
    displayPointValue = Number(customContract.pointValue);
    displayTickSize = Number(customContract.tickSize);
    displayExchange = customContract.exchange;
    displayContractSize = customContract.contractSize || 1;
    console.log(`Using custom contract values for ${symbol}:`, customContract);
  }
  
  // Calculate tick value based on tick size and point value
  const tickValue = displayTickSize && displayPointValue ? 
    (Number(displayTickSize) * Number(displayPointValue)) : 0;
  
  // Format the point value for display with commas for large numbers
  const formattedPointValue = displayPointValue ? 
    Number(displayPointValue).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) : '';
  
  // Format the tick value for display
  const formattedTickValue = tickValue ? 
    tickValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 5
    }) : '';
  
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 border rounded-md bg-muted/20">
      <dt className="text-muted-foreground">Exchange:</dt>
      <dd>{displayExchange || 'DEFAULT'}</dd>
      
      <dt className="text-muted-foreground">Tick Size:</dt>
      <dd>{displayTickSize ? Number(displayTickSize).toFixed(5) : '0.01'}</dd>
      
      <dt className="text-muted-foreground">Contract Size:</dt>
      <dd>{displayContractSize || 1}</dd>
      
      <dt className="text-muted-foreground font-medium">Point Value:</dt>
      <dd className="font-medium">${formattedPointValue}</dd>
      
      {displayTickSize && displayPointValue && (
        <>
          <dt className="text-muted-foreground font-medium">Tick Value:</dt>
          <dd className="font-medium">${formattedTickValue}</dd>
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
