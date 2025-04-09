
import React, { useEffect, useState } from 'react';
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, Info, Calculator } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RiskParametersFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
  disableEdits?: boolean;
}

export const RiskParametersForm: React.FC<RiskParametersFormProps> = ({
  trade,
  handleChange,
  disableEdits = false,
}) => {
  const [calculatedRR, setCalculatedRR] = useState<string>('');
  const [lastCalculatedValues, setLastCalculatedValues] = useState({
    entryPrice: undefined as number | undefined,
    initialStopLoss: undefined as number | undefined,
    takeProfit: undefined as number | undefined,
    direction: undefined as string | undefined
  });

  // Handle copying current stopLoss to initialStopLoss
  const handleInitializeStop = () => {
    if (trade.stopLoss) {
      handleChange('initialStopLoss', trade.stopLoss);
    }
  };

  // Handle numeric inputs with decimal points
  const handleNumericInput = (field: keyof Trade, value: string) => {
    if (value === '') {
      handleChange(field, undefined);
      return;
    }
    
    // Allow decimal input including intermediate states
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      // Handle special cases like "." or "0."
      if (value === '.' || value === '0.' || value.endsWith('.')) {
        handleChange(field, value);
      } else {
        const numValue = parseFloat(value);
        handleChange(field, isNaN(numValue) ? undefined : numValue);
      }
    }
  };

  // Calculate risk/reward ratio when stop loss and take profit change
  useEffect(() => {
    // Skip calculation if the values are the same as last time to prevent console spam
    const currentValues = {
      entryPrice: typeof trade.entryPrice === 'number' ? trade.entryPrice : undefined,
      initialStopLoss: typeof trade.initialStopLoss === 'number' ? trade.initialStopLoss : undefined,
      takeProfit: typeof trade.takeProfit === 'number' ? trade.takeProfit : undefined,
      direction: trade.direction
    };
    
    const valuesEqual = 
      currentValues.entryPrice === lastCalculatedValues.entryPrice &&
      currentValues.initialStopLoss === lastCalculatedValues.initialStopLoss &&
      currentValues.takeProfit === lastCalculatedValues.takeProfit &&
      currentValues.direction === lastCalculatedValues.direction;
      
    if (valuesEqual) {
      return; // Skip calculation if values haven't changed
    }

    // Only proceed if all values are actual numbers
    if (
      typeof trade.initialStopLoss !== 'number' || 
      typeof trade.takeProfit !== 'number' || 
      typeof trade.entryPrice !== 'number'
    ) {
      setCalculatedRR('');
      return;
    }

    const entryPrice = trade.entryPrice;
    const initialStopLoss = trade.initialStopLoss;
    const takeProfit = trade.takeProfit;
    
    // Ensure all values are valid numbers and not intermediate states (like "." or "0.")
    if (isNaN(entryPrice) || isNaN(initialStopLoss) || isNaN(takeProfit) || 
        initialStopLoss === entryPrice) {
      setCalculatedRR('');
      return;
    }
    
    // Save the values we're calculating with to prevent recalculation of the same values
    setLastCalculatedValues(currentValues);
    
    const isLong = trade.direction !== 'short';
    let risk, reward, ratio;
    
    // Calculate based on direction
    if (isLong) {
      // Long position: risk is entry - stop, reward is target - entry
      risk = entryPrice - initialStopLoss;
      reward = takeProfit - entryPrice;
    } else {
      // Short position: risk is stop - entry, reward is entry - target
      risk = initialStopLoss - entryPrice;
      reward = entryPrice - takeProfit;
    }
    
    if (risk > 0 && reward > 0) {
      ratio = reward / risk;
      setCalculatedRR(`${ratio.toFixed(2)}:1`);
      
      // Only update the trade object if the ratio has actually changed
      const newRatio = parseFloat(ratio.toFixed(2));
      if (trade.riskRewardRatio !== newRatio) {
        handleChange('riskRewardRatio', newRatio);
      }
    } else {
      setCalculatedRR('Invalid');
      // Clear the risk reward ratio if it's invalid
      if (trade.riskRewardRatio) {
        handleChange('riskRewardRatio', undefined);
      }
    }
  }, [
    typeof trade.entryPrice === 'number' ? trade.entryPrice : null,
    typeof trade.initialStopLoss === 'number' ? trade.initialStopLoss : null,
    typeof trade.takeProfit === 'number' ? trade.takeProfit : null,
    trade.direction
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-4">Risk/Reward Parameters</h3>
        <Separator className="mb-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Label htmlFor="initialStopLoss">Initial Stop Loss</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1.5 inline-flex items-center">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>This is your initial stop loss at trade entry. It's used to calculate your R-multiple and risk/reward ratio.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {!trade.initialStopLoss && trade.stopLoss && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleInitializeStop}
                type="button"
                className="h-7 text-xs"
              >
                <ArrowUpCircle className="mr-1 h-3 w-3" />
                Copy Current
              </Button>
            )}
          </div>
          <Input
            id="initialStopLoss"
            type="text"
            inputMode="decimal"
            placeholder="Initial stop loss price"
            value={trade.initialStopLoss || ''}
            onChange={(e) => handleNumericInput('initialStopLoss', e.target.value)}
            disabled={disableEdits}
            className="border-primary/50"
          />
          <p className="text-xs font-medium text-primary">Used for R calculation and risk/reward ratio</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stopLoss">Current Stop Loss</Label>
          <Input
            id="stopLoss"
            type="text"
            inputMode="decimal"
            placeholder="Stop loss price"
            value={trade.stopLoss || ''}
            onChange={(e) => handleNumericInput('stopLoss', e.target.value)}
            disabled={disableEdits}
          />
          <p className="text-xs text-muted-foreground">Current stop level (adjustable)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="takeProfit">Take Profit</Label>
          <Input
            id="takeProfit"
            type="text"
            inputMode="decimal"
            placeholder="Take profit price"
            value={trade.takeProfit || ''}
            onChange={(e) => handleNumericInput('takeProfit', e.target.value)}
            disabled={disableEdits}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="riskRewardRatio">Risk/Reward Ratio</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1.5 inline-flex items-center">
                    <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>Calculated using your initial stop loss and take profit target.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="riskRewardRatio"
            type="text"
            placeholder="Risk/reward ratio"
            value={calculatedRR || (trade.riskRewardRatio ? `${trade.riskRewardRatio}:1` : '')}
            readOnly
            disabled
            className={`bg-muted ${calculatedRR ? 'text-foreground font-medium' : ''}`}
          />
          <p className="text-xs text-muted-foreground">Based on initial stop loss and take profit</p>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-4">Price Excursion Tracking</h3>
        <Separator className="mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          Track how far price moved in your favor and against you during the trade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxFavorablePrice">
            {trade.direction === 'long' ? 'Highest Price' : 'Lowest Price'} Reached
          </Label>
          <Input
            id="maxFavorablePrice"
            type="text"
            inputMode="decimal"
            placeholder={trade.direction === 'long' ? 'Highest price during trade' : 'Lowest price during trade'}
            value={trade.maxFavorablePrice || ''}
            onChange={(e) => handleNumericInput('maxFavorablePrice', e.target.value)}
            disabled={disableEdits}
          />
          <p className="text-xs text-muted-foreground">
            Best price the market reached during your trade
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAdversePrice">
            {trade.direction === 'long' ? 'Lowest Price' : 'Highest Price'} Reached
          </Label>
          <Input
            id="maxAdversePrice"
            type="text"
            inputMode="decimal"
            placeholder={trade.direction === 'long' ? 'Lowest price during trade' : 'Highest price during trade'}
            value={trade.maxAdversePrice || ''}
            onChange={(e) => handleNumericInput('maxAdversePrice', e.target.value)}
            disabled={disableEdits}
          />
          <p className="text-xs text-muted-foreground">
            Worst price the market reached during your trade
          </p>
        </div>
      </div>
    </div>
  );
};
