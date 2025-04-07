
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trade } from '@/types';
import { TrendingDown, TrendingUp, Ratio, Target } from 'lucide-react';
import { AccountField } from './AccountField';

interface RiskParametersFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
}

export function RiskParametersForm({ trade, handleChange }: RiskParametersFormProps) {
  const [riskRewardRatio, setRiskRewardRatio] = useState<number | null>(null);

  // Calculate risk-reward ratio when stopLoss or takeProfit changes
  useEffect(() => {
    if (trade.stopLoss && trade.takeProfit && trade.entryPrice) {
      const riskPerUnit = Math.abs(trade.entryPrice - trade.stopLoss);
      const rewardPerUnit = Math.abs(trade.takeProfit - trade.entryPrice);
      
      if (riskPerUnit > 0) {
        const ratio = rewardPerUnit / riskPerUnit;
        setRiskRewardRatio(ratio);
      } else {
        setRiskRewardRatio(null);
      }
    } else {
      setRiskRewardRatio(null);
    }
  }, [trade.stopLoss, trade.takeProfit, trade.entryPrice]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stopLoss" className="flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Stop Loss Price
          </Label>
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
          <Label htmlFor="takeProfit" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Take Profit Price
          </Label>
          <Input 
            id="takeProfit" 
            type="number" 
            min="0" 
            step="0.01"
            value={trade.takeProfit || ''}
            onChange={(e) => handleChange('takeProfit', parseFloat(e.target.value))}
          />
        </div>
        
        {riskRewardRatio !== null && (
          <div className="col-span-2 bg-muted/30 p-3 rounded-md flex items-center">
            <Ratio className="h-5 w-5 mr-2 text-primary" />
            <div>
              <span className="font-medium">Risk-Reward Ratio: </span>
              <span className="font-mono">{riskRewardRatio.toFixed(2)}:1</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="account">Account</Label>
        <AccountField 
          value={trade.account}
          onChange={(value) => handleChange('account', value)}
        />
      </div>

      <div className="border rounded-md p-4 bg-muted/30">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <Target className="h-4 w-4 mr-2" />
          Risk Management
        </h3>
        <p className="text-sm text-muted-foreground">
          Setting a stop loss and take profit helps you maintain discipline and automatically calculates your risk-to-reward ratio.
        </p>
      </div>
    </div>
  );
}
