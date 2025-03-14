
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trade, PartialExit } from '@/types';
import { updateTrade, getTradeById } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';
import { CircleDollarSign, SplitSquareVertical, Calendar, X } from 'lucide-react';

interface ExitTradeFormProps {
  trade: Trade;
  onClose: () => void;
  onUpdate: () => void;
}

export function ExitTradeForm({ trade, onClose, onUpdate }: ExitTradeFormProps) {
  const [activeTab, setActiveTab] = useState('full');
  const [exitPrice, setExitPrice] = useState<number | undefined>(trade.exitPrice);
  const [exitDate, setExitDate] = useState<string>(
    trade.exitDate || new Date().toISOString().slice(0, 16)
  );
  const [fees, setFees] = useState<number | undefined>(trade.fees);
  const [notes, setNotes] = useState<string>('');

  // Partial exit state
  const [partialQuantity, setPartialQuantity] = useState<number>(
    Math.floor(trade.quantity / 2) // Default to half the position
  );
  const [partialExitPrice, setPartialExitPrice] = useState<number | undefined>(undefined);
  const [partialExitDate, setPartialExitDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [partialFees, setPartialFees] = useState<number | undefined>(undefined);
  const [partialNotes, setPartialNotes] = useState<string>('');

  // Calculate total quantity exited so far
  const totalExitedQuantity = (trade.partialExits || []).reduce(
    (total, exit) => total + exit.quantity, 
    0
  );
  
  // Calculate remaining quantity
  const remainingQuantity = trade.quantity - totalExitedQuantity;

  const handleFullExit = () => {
    if (!exitPrice) {
      toast.error("Please enter an exit price");
      return;
    }

    try {
      const updatedTrade: Trade = {
        ...trade,
        exitPrice,
        exitDate,
        fees,
        status: 'closed'
      };
      
      updateTrade(updatedTrade);
      toast.success("Trade closed successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error closing trade:", error);
      toast.error("Failed to close trade");
    }
  };

  const handlePartialExit = () => {
    if (!partialExitPrice) {
      toast.error("Please enter an exit price");
      return;
    }

    if (partialQuantity <= 0 || partialQuantity > remainingQuantity) {
      toast.error(`Quantity must be between 1 and ${remainingQuantity}`);
      return;
    }

    try {
      const newPartialExit: PartialExit = {
        id: crypto.randomUUID(),
        exitDate: partialExitDate,
        exitPrice: partialExitPrice,
        quantity: partialQuantity,
        fees: partialFees,
        notes: partialNotes
      };

      const updatedTrade: Trade = {
        ...trade,
        partialExits: [
          ...(trade.partialExits || []),
          newPartialExit
        ]
      };
      
      // If this exit closes the position completely
      if (partialQuantity === remainingQuantity) {
        updatedTrade.status = 'closed';
      }
      
      updateTrade(updatedTrade);
      toast.success("Partial exit recorded successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error recording partial exit:", error);
      toast.error("Failed to record partial exit");
    }
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exitPrice" className="flex items-center gap-1">
                  <CircleDollarSign className="h-4 w-4" />
                  Exit Price <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="exitPrice" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={exitPrice || ''}
                  onChange={(e) => setExitPrice(parseFloat(e.target.value))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exitDate" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Exit Date & Time
                </Label>
                <Input 
                  id="exitDate" 
                  type="datetime-local"
                  value={exitDate}
                  onChange={(e) => setExitDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fees">Fees & Commissions</Label>
                <Input 
                  id="fees" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={fees || ''}
                  onChange={(e) => setFees(parseFloat(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this exit..."
                  className="min-h-20"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="partial" className="space-y-4 mt-0">
            <div className="bg-muted/30 p-3 rounded-md mb-4">
              <p className="text-sm text-muted-foreground">
                Remaining quantity: <span className="font-medium">{remainingQuantity}</span> of {trade.quantity}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partialQuantity" className="flex items-center gap-1">
                  <SplitSquareVertical className="h-4 w-4" />
                  Quantity to Exit <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="partialQuantity" 
                  type="number"
                  min="1"
                  max={remainingQuantity}
                  step="1"
                  value={partialQuantity}
                  onChange={(e) => setPartialQuantity(parseInt(e.target.value))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partialExitPrice" className="flex items-center gap-1">
                  <CircleDollarSign className="h-4 w-4" />
                  Exit Price <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="partialExitPrice" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={partialExitPrice || ''}
                  onChange={(e) => setPartialExitPrice(parseFloat(e.target.value))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partialExitDate" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Exit Date & Time
                </Label>
                <Input 
                  id="partialExitDate" 
                  type="datetime-local"
                  value={partialExitDate}
                  onChange={(e) => setPartialExitDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partialFees">Fees & Commissions</Label>
                <Input 
                  id="partialFees" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={partialFees || ''}
                  onChange={(e) => setPartialFees(parseFloat(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partialNotes">Notes</Label>
                <Textarea 
                  id="partialNotes"
                  value={partialNotes}
                  onChange={(e) => setPartialNotes(e.target.value)}
                  placeholder="Add any notes about this partial exit..."
                  className="min-h-20"
                />
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={activeTab === 'full' ? handleFullExit : handlePartialExit}
        >
          {activeTab === 'full' ? 'Close Trade' : 'Record Partial Exit'}
        </Button>
      </CardFooter>
    </Card>
  );
}
