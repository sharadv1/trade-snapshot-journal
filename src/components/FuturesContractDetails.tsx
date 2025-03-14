
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trade, FuturesContractDetails as ContractDetails } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';

interface FuturesContractDetailsProps {
  trade: Trade;
}

export function FuturesContractDetails({ trade }: FuturesContractDetailsProps) {
  // Only show for futures contracts
  if (trade.type !== 'futures' || !trade.contractDetails) {
    return null;
  }

  const { 
    exchange, 
    contractSize, 
    tickSize, 
    tickValue, 
    expirationDate, 
    initialMargin, 
    maintenanceMargin 
  } = trade.contractDetails;

  return (
    <Card className="shadow-subtle border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Futures Contract Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Exchange:</span>
            <span>{exchange}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Contract Size:</span>
            <span>{contractSize}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tick Size:</span>
            <span>{tickSize}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tick Value:</span>
            <span>{formatCurrency(tickValue)}</span>
          </div>
          
          {expirationDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expiration Date:</span>
              <span>{new Date(expirationDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {initialMargin !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Initial Margin:</span>
              <span>{formatCurrency(initialMargin)}</span>
            </div>
          )}
          
          {maintenanceMargin !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Maintenance Margin:</span>
              <span>{formatCurrency(maintenanceMargin)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
