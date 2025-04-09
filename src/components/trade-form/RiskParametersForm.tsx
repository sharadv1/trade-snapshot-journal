
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trade } from '@/types';
import { TrendingDown, TrendingUp, Ratio, Target } from 'lucide-react';
import { AccountField } from './AccountField';
import { getContractPointValue } from '@/utils/calculations/contractUtils';

interface RiskParametersFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
}

export function RiskParametersForm({ trade, handleChange }: RiskParametersFormProps) {
  const [riskRewardRatio, setRiskRewardRatio] = useState<number | null>(null);
  const [riskedAmount, setRiskedAmount] = useState<number | null>(null);
  const [potentialReward, setPotentialReward] = useState<number | null>(null);
  const [pointValue, setPointValue] = useState<number>(1);

  // Get contract point value when trade type or symbol changes
  useEffect(() => {
    if (trade.type === 'futures') {
      const value = getContractPointValue(trade as Trade);
      setPointValue(value);
    } else {
      setPointValue(1);
    }
  }, [trade.type, trade.symbol, trade.contractDetails]);

  // Calculate risk-reward ratio when stopLoss or takeProfit changes
  useEffect(() => {
    if (trade.stopLoss && trade.entryPrice && trade.quantity) {
      const quantity = parseFloat(trade.quantity.toString());
      let riskPerUnit = Math.abs(parseFloat(trade.entryPrice.toString()) - parseFloat(trade.stopLoss.toString()));
      
      // Apply contract multiplier for futures
      if (trade.type === 'futures') {
        riskPerUnit = riskPerUnit * pointValue;
      }
      
      // Calculate total risk
      const totalRisk = riskPerUnit * quantity;
      setRiskedAmount(totalRisk);
      
      // Calculate reward if take profit is set
      if (trade.takeProfit) {
        let rewardPerUnit = Math.abs(parseFloat(trade.takeProfit.toString()) - parseFloat(trade.entryPrice.toString()));
        
        // Apply contract multiplier for futures
        if (trade.type === 'futures') {
          rewardPerUnit = rewardPerUnit * pointValue;
        }
        
        const totalReward = rewardPerUnit * quantity;
        setPotentialReward(totalReward);
        
        if (riskPerUnit > 0) {
          const ratio = rewardPerUnit / riskPerUnit;
          setRiskRewardRatio(ratio);
        } else {
          setRiskRewardRatio(null);
        }
      } else {
        setPotentialReward(null);
        setRiskRewardRatio(null);
      }
    } else {
      setRiskRewardRatio(null);
      setRiskedAmount(null);
      setPotentialReward(null);
    }
  }, [trade.stopLoss, trade.takeProfit, trade.entryPrice, trade.quantity, trade.type, trade.contractDetails, pointValue]);

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
            step="0.00001"
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
            step="0.00001"
            value={trade.takeProfit || ''}
            onChange={(e) => handleChange('takeProfit', parseFloat(e.target.value))}
          />
        </div>
        
        {riskedAmount !== null && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Risk Amount
            </Label>
            <div className="p-2 border rounded bg-background">
              ${riskedAmount.toFixed(2)}
              {trade.type === 'futures' && (
                <span className="text-xs text-muted-foreground ml-2">
                  using point value: ${pointValue.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
        
        {potentialReward !== null && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Potential Reward
            </Label>
            <div className="p-2 border rounded bg-background">
              ${potentialReward.toFixed(2)}
            </div>
          </div>
        )}
        
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
      
      {trade.type === 'futures' && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
          <p className="text-sm font-medium flex items-center">
            <Target className="h-4 w-4 mr-2 text-amber-600" />
            Futures Contract Risk
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This trade uses a point value of ${pointValue.toLocaleString()} per contract point.
            {trade.contractDetails?.tickValue ? 
              ` Based on contract specifications.` : 
              ` Using standard value for ${trade.symbol}.`}
          </p>
        </div>
      )}
      
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
