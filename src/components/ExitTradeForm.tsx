
import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trade } from '@/types';
import { X, CalendarClock } from 'lucide-react';
import { PartialExitForm } from './trade-exit/PartialExitForm';
import { useExitTradeLogic } from './trade-exit/useExitTradeLogic';
import { PartialExitsList } from './PartialExitsList';
import { Badge } from '@/components/ui/badge';
import { getRemainingQuantity, isTradeFullyExited } from '@/utils/calculations/tradeStatus';

interface ExitTradeFormProps {
  trade: Trade;
  onClose: () => void;
  onUpdate: () => void;
  remainingQuantity?: number;
}

export function ExitTradeForm({ trade, onClose, onUpdate, remainingQuantity: propRemainingQuantity }: ExitTradeFormProps) {
  const {
    partialQuantity,
    setPartialQuantity,
    partialExitPrice,
    setPartialExitPrice,
    partialExitDate,
    setPartialExitDate,
    partialFees,
    setPartialFees,
    partialNotes,
    setPartialNotes,
    remainingQuantity: calculatedRemainingQuantity,
    handlePartialExit
  } = useExitTradeLogic(trade, onUpdate, onClose);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const actualRemainingQuantity = Math.max(
    propRemainingQuantity !== undefined ? propRemainingQuantity : calculatedRemainingQuantity,
    0
  );
  
  const isClosed = trade.status === 'closed';
  const isFullyExited = isTradeFullyExited(trade);

  useEffect(() => {
    console.log('ExitTradeForm mounted for trade:', trade.id, 'Status:', trade.status);
    console.log('Remaining quantity:', actualRemainingQuantity);
    console.log('Is fully exited:', isFullyExited);
    
    return () => {
      console.log('ExitTradeForm unmounted for trade:', trade.id);
    };
  }, [trade.id, trade.status, actualRemainingQuantity, isFullyExited]);

  const handleSubmitPartialExit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Recording partial exit');
    try {
      const success = await handlePartialExit();
      if (success) {
        console.log("Partial exit successful");
        
        if (actualRemainingQuantity - (partialQuantity || 0) <= 0) {
          console.log("This partial exit will close the trade, closing modal");
          setTimeout(() => {
            if (onClose) onClose();
          }, 300);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualClose = () => {
    console.log('Manual close button clicked, calling onClose callback');
    onClose();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Exit Trade: {trade.symbol}</CardTitle>
            {isClosed && (
              <div className="mt-1 flex items-center">
                <Badge variant="destructive" className="mr-2">Closed</Badge>
                {trade.exitDate && (
                  <span className="text-xs text-muted-foreground flex items-center">
                    <CalendarClock className="h-3 w-3 mr-1" />
                    {new Date(trade.exitDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleManualClose} type="button">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {isClosed ? (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Exit Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Exit Price:</div>
              <div className="font-medium text-right">${trade.exitPrice?.toFixed(2) || 'N/A'}</div>
              
              <div>Exit Date:</div>
              <div className="font-medium text-right">
                {trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : 'N/A'}
              </div>
              
              {trade.fees !== undefined && (
                <div className="contents">
                  <div>Fees:</div>
                  <div className="font-medium text-right">${trade.fees.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
          
          <PartialExitsList 
            trade={trade}
            onUpdate={onUpdate}
            allowEditing={true}
          />
        </CardContent>
      ) : (
        <div>
          <CardContent className="space-y-4">
            {actualRemainingQuantity <= 0 ? (
              <div className="text-sm text-muted-foreground py-2">
                This trade has been fully exited. No more exits can be recorded.
              </div>
            ) : (
              <form id="partial-exit-form" onSubmit={handleSubmitPartialExit}>
                <PartialExitForm 
                  trade={trade}
                  remainingQuantity={actualRemainingQuantity}
                  partialQuantity={partialQuantity || 1} 
                  setPartialQuantity={setPartialQuantity}
                  partialExitPrice={partialExitPrice}
                  setPartialExitPrice={setPartialExitPrice}
                  partialExitDate={partialExitDate}
                  setPartialExitDate={setPartialExitDate}
                  partialFees={partialFees}
                  setPartialFees={setPartialFees}
                  partialNotes={partialNotes}
                  setPartialNotes={setPartialNotes}
                />
              </form>
            )}
            
            {trade.partialExits && trade.partialExits.length > 0 && (
              <PartialExitsList 
                trade={trade}
                onUpdate={onUpdate}
                allowEditing={true}
              />
            )}
          </CardContent>
          
          {actualRemainingQuantity > 0 && (
            <CardFooter className="flex justify-between space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={handleManualClose} type="button">
                Cancel
              </Button>
              <Button 
                type="submit"
                form="partial-exit-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Record Exit'}
              </Button>
            </CardFooter>
          )}
        </div>
      )}
    </Card>
  );
}
