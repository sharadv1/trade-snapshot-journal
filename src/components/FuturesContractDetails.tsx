
import { FuturesContractDetailsProps } from './types/futuresTypes';

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
  
  // Check if this is a full-sized Silver contract (SI) vs micro (SIL)
  const normalizedSymbol = symbol?.toUpperCase().trim();
  
  // Detect full-sized Silver (SI) contracts
  const isFullSilver = normalizedSymbol === 'SI' || 
                       (normalizedSymbol?.includes('SI') && 
                        !normalizedSymbol?.includes('SIL') && 
                        !normalizedSymbol?.includes('MSFT'));
  
  // Detect micro Silver (SIL) contracts
  const isMicroSilver = normalizedSymbol === 'SIL' || 
                        normalizedSymbol?.includes('SIL');
  
  // For Silver contracts, override the displayed value
  let displayTickValue = actualDetails.tickValue;
  
  // Override to proper values for SI and SIL
  if (isFullSilver) {
    displayTickValue = 5000; // Full-sized Silver
  } else if (isMicroSilver) {
    displayTickValue = 1000; // Micro Silver
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
      <dd>{actualDetails.exchange || 'DEFAULT'}</dd>
      
      <dt className="text-muted-foreground">Tick Size:</dt>
      <dd>{actualDetails.tickSize ? Number(actualDetails.tickSize).toFixed(5) : '0.01'}</dd>
      
      <dt className="text-muted-foreground">Contract Size:</dt>
      <dd>{actualDetails.contractSize || 1}</dd>
      
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
        {isFullSilver && (
          <span className="block mt-1 text-amber-600 font-medium">
            Silver futures (SI) have a standard point value of $5,000 per full point.
          </span>
        )}
        {isMicroSilver && (
          <span className="block mt-1 text-amber-600 font-medium">
            Micro Silver futures (SIL) have a standard point value of $1,000 per full point.
          </span>
        )}
      </dt>
    </dl>
  );
}
