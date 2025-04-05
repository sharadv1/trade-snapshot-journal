
import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trade } from '@/types';
import { X, RefreshCcw, CalendarClock } from 'lucide-react';
import { FullExitForm } from './trade-exit/FullExitForm';
import { PartialExitForm } from './trade-exit/PartialExitForm';
import { useExitTradeLogic } from './trade-exit/useExitTradeLogic';
import { PartialExitsList } from './PartialExitsList';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRemainingQuantity, isTradeFullyExited } from '@/utils/calculations/tradeStatus';

interface ExitTradeFormProps {
  trade: Trade;
  onClose: () => void;
  onUpdate: () => void;
  remainingQuantity?: number;
}

export function ExitTradeForm({ trade, onClose, onUpdate, remainingQuantity: propRemainingQuantity }: ExitTradeFormProps) {
  const {
    activeTab,
    setActiveTab,
    exitPrice,
    setExitPrice,
    exitDate,
    setExitDate,
    fees,
    setFees,
    notes,
    setNotes,
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
    handleFullExit,
    handlePartialExit,
    handleReopenTrade
  } = useExitTradeLogic(trade, onUpdate, onClose);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reopened, setReopened] = useState(false);
  
  const actualRemainingQuantity = Math.max(
    propRemainingQuantity !== undefined ? propRemainingQuantity : calculatedRemainingQuantity,
    0
  );
  
  const isTradeActuallyClosed = trade.status === 'closed' || actualRemainingQuantity <= 0;
  const isClosed = trade.status === 'closed';
  const isFullyExited = isTradeFullyExited(trade);

  useEffect(() => {
    console.log('ExitTradeForm mounted for trade:', trade.id, 'Status:', trade.status);
    console.log('Remaining quantity:', actualRemainingQuantity);
    console.log('Is fully exited:', isFullyExited);
    
    if (actualRemainingQuantity <= 0 && trade.status === 'open' && !isSubmitting) {
      console.log('Trade is fully exited but still open, closing it automatically');
      handleFullExit();
    }
    
    if (reopened && trade.status === 'closed') {
      setReopened(false);
    }
    
    return () => {
      console.log('ExitTradeForm unmounted for trade:', trade.id);
    };
  }, [trade.id, trade.status, actualRemainingQuantity, isFullyExited, handleFullExit, isSubmitting, reopened]);

  useEffect(() => {
    if (actualRemainingQuantity <= 0 && activeTab === 'partial') {
      setActiveTab('full');
    }
  }, [actualRemainingQuantity, activeTab, setActiveTab]);

  const handleSubmitFullExit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Submitting full exit form');
    try {
      const success = await handleFullExit();
      if (success) {
        console.log("Full exit successful, modal should close");
        setTimeout(() => {
          if (onClose) onClose();
        }, 300);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPartialExit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Submitting partial exit form');
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

  const handleTradeReopen = async () => {
    setIsSubmitting(true);
    try {
      console.log('Attempting to reopen trade...');
      const success = await handleReopenTrade();
      if (success) {
        console.log("Trade reopened successfully, staying on page");
        setReopened(true);
        onUpdate();
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
            {isClosed && !reopened && (
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
            {reopened && (
              <div className="mt-1">
                <Badge variant="outline" className="bg-green-50">Reopened</Badge>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleManualClose} type="button">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {isClosed && !reopened ? (
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This trade is already closed. You can view details in the partial exits tab or reopen the trade.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Exit Details</h3>
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
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={handleTradeReopen}
            disabled={isSubmitting}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reopen Trade
          </Button>
          
          <PartialExitsList 
            trade={trade}
            onUpdate={onUpdate}
            allowEditing={true}
          />
        </CardContent>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="full">Full Exit</TabsTrigger>
                <TabsTrigger value="partial" disabled={actualRemainingQuantity <= 0}>
                  Partial Exit
                </TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="pt-6">
              <TabsContent value="full" className="space-y-4 mt-0">
                {actualRemainingQuantity <= 0 ? (
                  <Alert>
                    <AlertDescription>
                      This trade has been fully exited through partial exits. 
                      Click "Close Trade" to finalize and close the trade.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form id="full-exit-form" onSubmit={handleSubmitFullExit}>
                    <FullExitForm 
                      trade={trade}
                      exitPrice={exitPrice}
                      setExitPrice={setExitPrice}
                      exitDate={exitDate}
                      setExitDate={setExitDate}
                      fees={fees}
                      setFees={setFees}
                      notes={notes || ''}
                      setNotes={setNotes}
                    />
                  </form>
                )}
              </TabsContent>
              
              <TabsContent value="partial" className="space-y-4 mt-0">
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
              </TabsContent>
            </CardContent>
          </Tabs>
          
          <CardFooter className="flex justify-between space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleManualClose} type="button">
              Cancel
            </Button>
            <Button 
              type="submit"
              form={activeTab === 'full' ? 'full-exit-form' : 'partial-exit-form'}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : activeTab === 'full' 
                ? (actualRemainingQuantity <= 0 ? 'Close Trade' : 'Close Trade') 
                : 'Record Partial Exit'}
            </Button>
          </CardFooter>
        </>
      )}
      
      {(!isClosed || reopened) && trade.partialExits && trade.partialExits.length > 0 && (
        <div className="px-6 pb-6">
          <PartialExitsList 
            trade={trade}
            onUpdate={onUpdate}
            allowEditing={true}
          />
        </div>
      )}
    </Card>
  );
}
