import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from './ImageUpload';
import { FuturesContractSelector } from './FuturesContractSelector';
import { SymbolSelector } from './SymbolSelector';
import { Trade, FuturesContractDetails } from '@/types';
import { addTrade, updateTrade } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';

interface TradeFormProps {
  initialTrade?: Trade;
  isEditing?: boolean;
}

export function TradeForm({ initialTrade, isEditing = false }: TradeFormProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [images, setImages] = useState<string[]>(initialTrade?.images || []);

  const [trade, setTrade] = useState<Partial<Trade>>(
    initialTrade || {
      symbol: '',
      type: 'equity',
      direction: 'long',
      entryDate: new Date().toISOString().slice(0, 16),
      entryPrice: 0,
      quantity: 0,
      fees: 0,
      status: 'open',
      images: [],
      tags: [],
      partialExits: []
    }
  );

  const [contractDetails, setContractDetails] = useState<Partial<FuturesContractDetails>>(
    initialTrade?.contractDetails || {
      exchange: '',
      contractSize: 1,
      tickSize: 0.01,
      tickValue: 0.01
    }
  );

  const handleChange = (field: keyof Trade, value: any) => {
    setTrade(prev => ({ ...prev, [field]: value }));
  };

  const handleContractDetailsChange = (field: keyof FuturesContractDetails, value: any) => {
    setContractDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleContractDetailsSet = (details: FuturesContractDetails) => {
    setContractDetails(details);
  };

  const handleImageUpload = (base64Image: string) => {
    const newImages = [...images, base64Image];
    setImages(newImages);
    handleChange('images', newImages);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    handleChange('images', newImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trade.symbol || !trade.entryPrice || !trade.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      const tradeToSave = {
        ...trade,
        images,
        contractDetails: trade.type === 'futures' ? contractDetails : undefined
      };
      
      if (isEditing && initialTrade) {
        const updatedTrade = { ...initialTrade, ...tradeToSave } as Trade;
        updateTrade(updatedTrade);
        toast.success("Trade updated successfully");
      } else {
        const newTrade = {
          ...tradeToSave,
          id: crypto.randomUUID(),
        } as Trade;
        addTrade(newTrade);
        toast.success("Trade added successfully");
      }
      
      navigate('/');
    } catch (error) {
      console.error("Error saving trade:", error);
      toast.error("Failed to save trade");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-scale-in">
      <Card className="shadow-subtle border">
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Trade" : "New Trade"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Update the details of your existing trade" 
              : "Enter the details of your new trade"
            }
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="details">Trade Details</TabsTrigger>
              <TabsTrigger value="risk">Risk Parameters</TabsTrigger>
              <TabsTrigger value="contract" disabled={trade.type !== 'futures'}>
                Contract Details
              </TabsTrigger>
              <TabsTrigger value="notes">Notes & Images</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="pt-6">
            <TabsContent value="details" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol <span className="text-destructive">*</span></Label>
                  <SymbolSelector 
                    value={trade.symbol || ''} 
                    onChange={(value) => handleChange('symbol', value)}
                    tradeType={trade.type as 'equity' | 'futures' | 'option'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Type <span className="text-destructive">*</span></Label>
                  <Select 
                    value={trade.type as string} 
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="futures">Futures</SelectItem>
                      <SelectItem value="option">Option</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="direction">Direction <span className="text-destructive">*</span></Label>
                  <Select 
                    value={trade.direction as string} 
                    onValueChange={(value) => handleChange('direction', value)}
                  >
                    <SelectTrigger id="direction">
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
                  <Select 
                    value={trade.status as string} 
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entryDate">Entry Date & Time <span className="text-destructive">*</span></Label>
                  <Input 
                    id="entryDate" 
                    type="datetime-local" 
                    value={trade.entryDate}
                    onChange={(e) => handleChange('entryDate', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entryPrice">Entry Price <span className="text-destructive">*</span></Label>
                  <Input 
                    id="entryPrice" 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={trade.entryPrice}
                    onChange={(e) => handleChange('entryPrice', parseFloat(e.target.value))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity <span className="text-destructive">*</span></Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="0" 
                    step="1"
                    value={trade.quantity}
                    onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fees">Fees & Commissions</Label>
                  <Input 
                    id="fees" 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={trade.fees}
                    onChange={(e) => handleChange('fees', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              
              {trade.status === 'closed' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="exitDate">Exit Date & Time</Label>
                    <Input 
                      id="exitDate" 
                      type="datetime-local" 
                      value={trade.exitDate}
                      onChange={(e) => handleChange('exitDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exitPrice">Exit Price</Label>
                    <Input 
                      id="exitPrice" 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={trade.exitPrice}
                      onChange={(e) => handleChange('exitPrice', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="risk" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss Price</Label>
                  <Input 
                    id="stopLoss" 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={trade.stopLoss}
                    onChange={(e) => handleChange('stopLoss', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="takeProfit">Take Profit Price</Label>
                  <Input 
                    id="takeProfit" 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={trade.takeProfit}
                    onChange={(e) => handleChange('takeProfit', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="strategy">Strategy</Label>
                  <Input 
                    id="strategy" 
                    value={trade.strategy || ''}
                    onChange={(e) => handleChange('strategy', e.target.value)}
                    placeholder="e.g., Breakout, Momentum, Trend Following"
                  />
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/30">
                <h3 className="text-sm font-medium mb-2">Risk Management</h3>
                <p className="text-sm text-muted-foreground">
                  Setting a stop loss and take profit helps you maintain discipline and automatically calculates your risk-to-reward ratio.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="contract" className="space-y-4 mt-0">
              <FuturesContractSelector 
                onChange={handleContractDetailsSet}
                initialSymbol={
                  initialTrade?.symbol && initialTrade.type === 'futures' 
                    ? initialTrade.symbol.toUpperCase() 
                    : undefined
                }
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exchange">Exchange</Label>
                  <Input 
                    id="exchange" 
                    value={contractDetails.exchange || ''}
                    onChange={(e) => handleContractDetailsChange('exchange', e.target.value)}
                    placeholder="e.g., CME, CBOT"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contractSize">Contract Size</Label>
                  <Input 
                    id="contractSize" 
                    type="number"
                    min="1"
                    value={contractDetails.contractSize || 1}
                    onChange={(e) => handleContractDetailsChange('contractSize', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tickSize">Tick Size</Label>
                  <Input 
                    id="tickSize" 
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={contractDetails.tickSize || 0.01}
                    onChange={(e) => handleContractDetailsChange('tickSize', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tickValue">Tick Value</Label>
                  <Input 
                    id="tickValue" 
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={contractDetails.tickValue || 0.01}
                    onChange={(e) => handleContractDetailsChange('tickValue', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Expiration Date</Label>
                  <Input 
                    id="expirationDate" 
                    type="date"
                    value={contractDetails.expirationDate?.split('T')[0] || ''}
                    onChange={(e) => handleContractDetailsChange('expirationDate', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="initialMargin">Initial Margin</Label>
                  <Input 
                    id="initialMargin" 
                    type="number"
                    min="0"
                    value={contractDetails.initialMargin || ''}
                    onChange={(e) => handleContractDetailsChange('initialMargin', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMargin">Maintenance Margin</Label>
                  <Input 
                    id="maintenanceMargin" 
                    type="number"
                    min="0"
                    value={contractDetails.maintenanceMargin || ''}
                    onChange={(e) => handleContractDetailsChange('maintenanceMargin', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/30">
                <h3 className="text-sm font-medium mb-2">Futures Contract Information</h3>
                <p className="text-sm text-muted-foreground">
                  Select from common contracts or enter custom contract specifications to better track and analyze your futures trades.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="notes">Trade Notes</Label>
                <Textarea 
                  id="notes" 
                  value={trade.notes || ''} 
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Enter your observations, strategy details, or lessons learned..."
                  className="min-h-32"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Trade Images</Label>
                <ImageUpload 
                  images={images} 
                  onImageUpload={handleImageUpload}
                  onImageRemove={handleRemoveImage}
                />
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" type="button" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Trade" : "Save Trade"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
