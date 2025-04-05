
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

  // Create initial partial exit if there's a closed trade with no partials
  useEffect(() => {
    if (isClosed && (!trade.partialExits || trade.partialExits.length === 0) && trade.exitPrice) {
      console.log('Closed trade with no partials detected - should be converted to use partials');
      // Don't actually create the partial here - we'll just show editing UI
    }
  }, [isClosed, trade]);

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
      
      <CardContent className="space-y-4">
        {/* Show partial exits list if they exist */}
        {trade.partialExits && trade.partialExits.length > 0 && (
          <PartialExitsList 
            trade={trade}
            onUpdate={onUpdate}
            allowEditing={true}
          />
        )}
        
        {/* For closed trades with no partials, create a special case to convert them */}
        {isClosed && (!trade.partialExits || trade.partialExits.length === 0) && trade.exitPrice && (
          <div className="space-y-2 bg-muted/30 p-3 rounded-md">
            <p className="text-sm">This trade was closed directly without partial exits. You can edit its exit details:</p>
            
            <form id="partial-exit-form" onSubmit={handleSubmitPartialExit}>
              <PartialExitForm 
                trade={trade}
                remainingQuantity={trade.quantity}
                partialQuantity={trade.quantity} 
                setPartialQuantity={setPartialQuantity}
                partialExitPrice={trade.exitPrice}
                setPartialExitPrice={setPartialExitPrice}
                partialExitDate={trade.exitDate || new Date().toISOString()}
                setPartialExitDate={setPartialExitDate}
                partialFees={trade.fees}
                setPartialFees={setPartialFees}
                partialNotes={trade.notes}
                setPartialNotes={setPartialNotes}
                isClosedTradeConversion={true}
              />
              
              <div className="flex justify-end mt-4">
                <Button 
                  type="submit"
                  form="partial-exit-form"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Convert to Partial Exit'}
                </Button>
              </div>
            </form>
          </div>
        )}
        
        {/* For non-fully exited trades, show the partial exit form */}
        {!isClosed && actualRemainingQuantity > 0 && (
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
            
            <div className="flex justify-end mt-4">
              <Button 
                type="submit"
                form="partial-exit-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Record Exit'}
              </Button>
            </div>
          </form>
        )}
        
        {/* For fully exited trades through partials, just show message */}
        {(actualRemainingQuantity <= 0 || isFullyExited) && !isClosed && (
          <div className="text-sm text-muted-foreground py-2">
            This trade has been fully exited through partial exits. Update the status to closed.
          </div>
        )}
      </CardContent>
      
      {/* No more footer with full exit option */}
    </Card>
  );
}
