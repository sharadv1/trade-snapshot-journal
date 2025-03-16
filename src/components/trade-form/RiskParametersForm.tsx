
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trade, Strategy } from '@/types';
import { getStrategies } from '@/utils/strategyStorage';

interface RiskParametersFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
}

export function RiskParametersForm({ trade, handleChange }: RiskParametersFormProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  useEffect(() => {
    // Load strategies from storage
    const loadedStrategies = getStrategies();
    console.log('Loaded strategies:', loadedStrategies);
    setStrategies(loadedStrategies);
  }, []);

  console.log('Current trade strategy:', trade.strategy);

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
            onValueChange={(value) => {
              console.log('Selecting strategy:', value);
              handleChange('strategy', value);
            }}
          >
            <SelectTrigger id="strategy">
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              {strategies.length > 0 ? (
                strategies.map((strategy) => {
                  // Ensure strategy name is never empty and always a string
                  const strategyName = strategy.name || `strategy-${strategy.id}`;
                  console.log('Rendering strategy item:', strategyName, strategy.id);
                  return (
                    <SelectItem key={strategy.id} value={strategyName}>
                      <div className="flex items-center">
                        {strategy.color && (
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: strategy.color }} 
                          />
                        )}
                        {strategyName}
                      </div>
                    </SelectItem>
                  );
                })
              ) : (
                <SelectItem value="no-strategies-available">No strategies available</SelectItem>
              )}
            </SelectContent>
          </Select>
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
