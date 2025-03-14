
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trade, PartialExit } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';

interface PartialExitsListProps {
  trade: Trade;
}

export function PartialExitsList({ trade }: PartialExitsListProps) {
  if (!trade.partialExits || trade.partialExits.length === 0) {
    return null;
  }

  // Sort partial exits by date (newest first)
  const sortedExits = [...trade.partialExits].sort((a, b) => 
    new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
  );

  // Calculate total quantity exited so far
  const totalExitedQuantity = sortedExits.reduce(
    (total, exit) => total + exit.quantity, 
    0
  );

  // Calculate remaining quantity
  const remainingQuantity = trade.quantity - totalExitedQuantity;

  return (
    <Card className="shadow-subtle border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Partial Exits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Total Position:</span>
              <span className="font-medium">{trade.quantity} units</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Exited:</span>
              <span className="font-medium">{totalExitedQuantity} units</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Remaining:</span>
              <span className="font-medium">{remainingQuantity} units</span>
            </div>
          </div>

          <div className="divide-y">
            {sortedExits.map((exit) => (
              <div key={exit.id} className="py-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {exit.quantity} units @ {formatCurrency(exit.exitPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(exit.exitDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                {exit.notes && (
                  <p className="text-sm text-muted-foreground">{exit.notes}</p>
                )}
                
                {exit.fees !== undefined && exit.fees > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Fees: {formatCurrency(exit.fees)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
