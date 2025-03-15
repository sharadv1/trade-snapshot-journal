
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trade } from '@/types';
import { X } from 'lucide-react';
import { FullExitForm } from './trade-exit/FullExitForm';
import { PartialExitForm } from './trade-exit/PartialExitForm';
import { useExitTradeLogic } from './trade-exit/useExitTradeLogic';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { DialogTitle } from '@/components/ui/dialog';

interface ExitTradeFormProps {
  trade: Trade;
  onClose: () => void;
  onUpdate: () => void;
}

export function ExitTradeForm({ trade, onClose, onUpdate }: ExitTradeFormProps) {
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
    remainingQuantity,
    handleFullExit,
    handlePartialExit
  } = useExitTradeLogic(trade, onUpdate, onClose);

  // Wrapper functions to ensure trade updates are visible immediately
  const handleSubmitFullExit = async () => {
    await handleFullExit();
    onUpdate(); // Ensure parent component refreshes data
  };

  const handleSubmitPartialExit = async () => {
    await handlePartialExit();
    onUpdate(); // Ensure parent component refreshes data
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Exit Trade: {trade.symbol}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <DialogTitle className="sr-only">Exit Trade</DialogTitle>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="full">Full Exit</TabsTrigger>
            <TabsTrigger value="partial" disabled={remainingQuantity === 0}>
              Partial Exit
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          <TabsContent value="full" className="space-y-4 mt-0">
            <FullExitForm 
              trade={trade}
              exitPrice={exitPrice}
              setExitPrice={setExitPrice}
              exitDate={exitDate}
              setExitDate={setExitDate}
              fees={fees}
              setFees={setFees}
              notes={notes}
              setNotes={setNotes}
            />
          </TabsContent>
          
          <TabsContent value="partial" className="space-y-4 mt-0">
            <PartialExitForm 
              trade={trade}
              remainingQuantity={remainingQuantity}
              partialQuantity={partialQuantity}
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
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={activeTab === 'full' ? handleSubmitFullExit : handleSubmitPartialExit}
        >
          {activeTab === 'full' ? 'Close Trade' : 'Record Partial Exit'}
        </Button>
      </CardFooter>
    </Card>
  );
}
