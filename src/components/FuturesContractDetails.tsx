
import { FuturesContractDetailsProps } from './types/futuresTypes';

export function FuturesContractDetails({ details, value }: FuturesContractDetailsProps) {
  if (!details.exchange) return null;
  
  return (
    <div className="bg-muted p-3 rounded-md text-sm mt-2">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Exchange:</dt>
        <dd>{details.exchange}</dd>
        
        <dt className="text-muted-foreground">Tick Size:</dt>
        <dd>{details.tickSize}</dd>
        
        <dt className="text-muted-foreground">Point Value:</dt>
        <dd>${details.tickValue}</dd>
        
        {value !== undefined && (
          <>
            <dt className="text-muted-foreground font-medium">Tick Value:</dt>
            <dd className="font-medium">${(details.tickSize || 0) * (details.tickValue || 0)}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
