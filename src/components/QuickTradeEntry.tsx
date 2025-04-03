
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trade } from '@/types';
import { addTrade } from '@/utils/tradeStorage';
import { toast } from 'sonner';
import { formatISO } from 'date-fns';
import { Plus } from 'lucide-react';

interface QuickTradeEntryProps {
  onTradeAdded: () => void;
  compact?: boolean;
}

export function QuickTradeEntry({ onTradeAdded, compact = false }: QuickTradeEntryProps) {
  const [tradeType, setTradeType] = useState<'stock' | 'futures' | 'options'>('stock');
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [strategy, setStrategy] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  
  const handleAddEntry = () => {
    if (!symbol || !entryDate || !entryPrice || !quantity) {
      toast.error('Please fill in all required entry fields');
      return;
    }
    
    const hasExit = exitDate && exitPrice;
    
    const newTrade: Partial<Trade> = {
      symbol: symbol.toUpperCase(),
      direction,
      type: tradeType,
      status: hasExit ? 'closed' : 'open',
      entryDate: formatISO(new Date(entryDate)),
      entryPrice: parseFloat(entryPrice),
      quantity: parseFloat(quantity),
      strategy,
      tags: [],
      images: [],
      partialExits: []
    };
    
    if (hasExit) {
      newTrade.exitDate = formatISO(new Date(exitDate));
      newTrade.exitPrice = parseFloat(exitPrice);
    }
    
    const id = addTrade(newTrade as Trade);
    toast.success('Trade added successfully');
    onTradeAdded();
    
    setSymbol('');
    setEntryPrice('');
    setQuantity('');
    setExitDate('');
    setExitPrice('');
  };
  
  const handleAddExit = () => {
    if (!exitDate || !exitPrice) {
      toast.error('Please fill in all exit fields');
      return;
    }
    
    handleAddEntry();
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Quick Trade Entry</CardTitle>
      </CardHeader>
      <CardContent>
        {!compact && (
          <Tabs defaultValue="stock" onValueChange={(value) => setTradeType(value as any)}>
            <TabsList className="grid grid-cols-3 w-full max-w-xs mb-6">
              <TabsTrigger value="stock">Stock</TabsTrigger>
              <TabsTrigger value="futures">Futures</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        <div className={`grid grid-cols-1 ${compact ? 'gap-y-4' : 'md:grid-cols-3 gap-x-8 gap-y-6'}`}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input 
                id="symbol" 
                placeholder="AAPL" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>
            
            {!compact && (
              <div>
                <Label>Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Swing Trade">Swing Trade</SelectItem>
                    <SelectItem value="Day Trade">Day Trade</SelectItem>
                    <SelectItem value="Momentum">Momentum</SelectItem>
                    <SelectItem value="Breakout">Breakout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Direction</Label>
              <Select value={direction} onValueChange={(value) => setDirection(value as 'long' | 'short')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Entry Points</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entry-date" className="text-xs text-muted-foreground">Date</Label>
                  <Input 
                    id="entry-date" 
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="entry-price" className="text-xs text-muted-foreground">Price</Label>
                  <Input 
                    id="entry-price" 
                    type="number"
                    placeholder="0.00"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>
          
          {!compact && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Exit Points</Label>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddExit}
                    disabled={!exitDate || !exitPrice || !symbol || !entryDate || !entryPrice || !quantity}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Exit
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exit-date" className="text-xs text-muted-foreground">Date</Label>
                    <Input 
                      id="exit-date" 
                      type="date"
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exit-price" className="text-xs text-muted-foreground">Price</Label>
                    <Input 
                      id="exit-price" 
                      type="number"
                      placeholder="0.00"
                      value={exitPrice}
                      onChange={(e) => setExitPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <Button 
          className={`${compact ? 'w-full mt-4' : 'w-full mt-6'}`} 
          onClick={handleAddEntry}
          disabled={!symbol || !entryDate || !entryPrice || !quantity}
        >
          <Plus className="h-4 w-4 mr-1" />
          {compact ? 'Add Trade' : 'Add Entry'}
        </Button>
      </CardContent>
    </Card>
  );
}
