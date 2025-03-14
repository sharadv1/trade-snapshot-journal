
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trade } from '@/types';

interface RiskParametersFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
  COMMON_STRATEGIES: string[];
}

export function RiskParametersForm({ trade, handleChange, COMMON_STRATEGIES }: RiskParametersFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stopLoss">Stop Loss Price</Label>
          <Input 
            id="stopLoss" 
            type="number" 
            min="0" 
            step="0.01"
            value={trade.stopLoss || ''}
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
            value={trade.takeProfit || ''}
            onChange={(e) => handleChange('takeProfit', parseFloat(e.target.value))}
          />
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="strategy">Strategy</Label>
          <Select 
            value={trade.strategy || ''} 
            onValueChange={(value) => handleChange('strategy', value)}
          >
            <SelectTrigger id="strategy">
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_STRATEGIES.map((strategy) => (
                <SelectItem key={strategy} value={strategy}>
                  {strategy}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          {trade.strategy === 'custom' && (
            <Input 
              className="mt-2"
              placeholder="Enter custom strategy name"
              value={trade.customStrategy || ''}
              onChange={(e) => handleChange('customStrategy', e.target.value)}
            />
          )}
        </div>
      </div>
      
      <div className="border rounded-md p-4 bg-muted/30">
        <h3 className="text-sm font-medium mb-2">Risk Management</h3>
        <p className="text-sm text-muted-foreground">
          Setting a stop loss and take profit helps you maintain discipline and automatically calculates your risk-to-reward ratio.
        </p>
      </div>
    </div>
  );
}
