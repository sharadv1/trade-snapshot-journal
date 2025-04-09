
import React from 'react';
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle } from 'lucide-react';

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
  // Handle copying current stopLoss to initialStopLoss
  const handleInitializeStop = () => {
    if (trade.stopLoss) {
      handleChange('initialStopLoss', trade.stopLoss);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-4">Risk/Reward Parameters</h3>
        <Separator className="mb-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stopLoss">Current Stop Loss</Label>
          <Input
            id="stopLoss"
            type="text"
            inputMode="decimal"
            step="any"
            placeholder="Stop loss price"
            value={trade.stopLoss || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || value === '.' || value === '0.' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                const parsedValue = value ? parseFloat(value) : '';
                handleChange('stopLoss', parsedValue);
              }
            }}
            disabled={disableEdits}
          />
          <p className="text-xs text-muted-foreground">Current stop level (adjustable)</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="initialStopLoss">Initial Stop Loss</Label>
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
            step="any"
            placeholder="Initial stop loss price"
            value={trade.initialStopLoss || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || value === '.' || value === '0.' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                const parsedValue = value ? parseFloat(value) : '';
                handleChange('initialStopLoss', parsedValue);
              }
            }}
            disabled={disableEdits}
          />
          <p className="text-xs text-muted-foreground">Original stop (for R calculation)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="takeProfit">Take Profit</Label>
          <Input
            id="takeProfit"
            type="text"
            inputMode="decimal"
            step="any"
            placeholder="Take profit price"
            value={trade.takeProfit || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || value === '.' || value === '0.' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                const parsedValue = value ? parseFloat(value) : '';
                handleChange('takeProfit', parsedValue);
              }
            }}
            disabled={disableEdits}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="riskRewardRatio">Risk/Reward Ratio</Label>
          <Input
            id="riskRewardRatio"
            type="text"
            placeholder="Risk/reward ratio"
            value={trade.riskRewardRatio || ''}
            readOnly
            disabled
            className="bg-muted"
          />
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
            step="any"
            placeholder={trade.direction === 'long' ? 'Highest price during trade' : 'Lowest price during trade'}
            value={trade.maxFavorablePrice || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || value === '.' || value === '0.' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                const parsedValue = value ? parseFloat(value) : '';
                handleChange('maxFavorablePrice', parsedValue);
              }
            }}
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
            step="any"
            placeholder={trade.direction === 'long' ? 'Lowest price during trade' : 'Highest price during trade'}
            value={trade.maxAdversePrice || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || value === '.' || value === '0.' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                const parsedValue = value ? parseFloat(value) : '';
                handleChange('maxAdversePrice', parsedValue);
              }
            }}
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
