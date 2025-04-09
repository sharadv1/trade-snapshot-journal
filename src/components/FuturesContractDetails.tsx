
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
  
  if (!actualDetails?.exchange) return null;
  
  const handleChange = (field: string, value: any) => {
    if (onChange) {
      onChange({
        ...actualDetails,
        [field]: value
      });
    }
  };
  
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 border rounded-md bg-muted/20">
      <dt className="text-muted-foreground">Exchange:</dt>
      <dd>{actualDetails.exchange}</dd>
      
      <dt className="text-muted-foreground">Tick Size:</dt>
      <dd>{parseFloat(actualDetails.tickSize).toFixed(5)}</dd>
      
      <dt className="text-muted-foreground">Contract Size:</dt>
      <dd>{actualDetails.contractSize || 1}</dd>
      
      <dt className="text-muted-foreground font-medium">Point Value:</dt>
      <dd className="font-medium">${actualDetails.tickValue}</dd>
      
      {actualDetails.tickSize && actualDetails.tickValue && (
        <>
          <dt className="text-muted-foreground font-medium">Tick Value:</dt>
          <dd className="font-medium">${(actualDetails.tickSize * actualDetails.tickValue).toFixed(5)}</dd>
        </>
      )}
      
      <dt className="text-xs text-muted-foreground col-span-2 mt-2 border-t pt-2">
        Risk calculation uses point value to determine dollar risk based on price movement.
      </dt>
    </dl>
  );
}
