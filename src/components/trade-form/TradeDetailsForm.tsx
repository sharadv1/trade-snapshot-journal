
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SymbolSelector } from '@/components/SymbolSelector';
import { Trade, FuturesContractDetails } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';

interface TradeDetailsFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
  handleTypeChange: (type: 'equity' | 'futures' | 'option') => void;
  contractDetails: Partial<FuturesContractDetails>;
  pointValue: number;
}

export function TradeDetailsForm({
  trade,
  handleChange,
  handleTypeChange,
  contractDetails,
  pointValue
}: TradeDetailsFormProps) {
  return (
    <div className="space-y-4">
      {/* Type selection first, to filter symbols */}
      <div className="space-y-2">
        <Label htmlFor="type">Type <span className="text-destructive">*</span></Label>
        <Select 
          value={trade.type as string} 
          onValueChange={(value) => handleTypeChange(value as 'equity' | 'futures' | 'option')}
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
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol <span className="text-destructive">*</span></Label>
          <SymbolSelector 
            value={trade.symbol || ''} 
            onChange={(value) => handleChange('symbol', value)}
            tradeType={trade.type as 'equity' | 'futures' | 'option'}
            onTypeChange={handleTypeChange}
          />
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
      
      {/* Show futures contract details inline when futures is selected */}
      {trade.type === 'futures' && trade.symbol && (
        <div className="mt-4 p-4 border rounded-md bg-muted/30 space-y-3">
          <h3 className="text-sm font-medium">Futures Contract Details</h3>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exchange:</span>
              <span>{contractDetails.exchange}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tick Size:</span>
              <span>{contractDetails.tickSize}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tick Value:</span>
              <span>{formatCurrency(contractDetails.tickValue || 0)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Point Value:</span>
              <span>{formatCurrency(pointValue)}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Always show exit fields, regardless of trade status */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
        <div className="space-y-2">
          <Label htmlFor="exitDate">Exit Date & Time</Label>
          <Input 
            id="exitDate" 
            type="datetime-local" 
            value={trade.exitDate || ''}
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
            value={trade.exitPrice || ''}
            onChange={(e) => handleChange('exitPrice', parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
