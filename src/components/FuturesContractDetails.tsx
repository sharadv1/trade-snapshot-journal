
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
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
      <dt className="text-muted-foreground">Exchange:</dt>
      <dd>{actualDetails.exchange}</dd>
      
      <dt className="text-muted-foreground">Tick Size:</dt>
      <dd>{actualDetails.tickSize}</dd>
      
      <dt className="text-muted-foreground">Contract Size:</dt>
      <dd>{actualDetails.contractSize || 1}</dd>
      
      <dt className="text-muted-foreground">Point Value:</dt>
      <dd>${actualDetails.tickValue}</dd>
      
      {actualValue !== undefined && (
        <>
          <dt className="text-muted-foreground font-medium">Tick Value:</dt>
          <dd className="font-medium">${(actualDetails.tickSize || 0) * (actualDetails.tickValue || 0)}</dd>
        </>
      )}
    </dl>
  );
}
