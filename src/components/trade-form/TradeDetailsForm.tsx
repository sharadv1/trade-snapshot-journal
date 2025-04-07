
import React from 'react';
import { Trade, TRADE_TYPES, TradeType } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SymbolSelector } from '@/components/SymbolSelector';
import { FuturesContractDetails } from '@/components/FuturesContractDetails';
import { Button } from '@/components/ui/button';

// Define props interface
interface TradeDetailsFormProps {
  trade: Partial<Trade>;
  onTradeChange: (field: keyof Trade, value: any) => void;
  onTradeTypeChange: (type: TradeType) => void;
  onContractDetailsChange: (details: any) => void;
  contractDetails: Record<string, any>;
  pointValue?: number;
  maxRisk?: number | undefined;
  disableEdits?: boolean;
}

export const TradeDetailsForm: React.FC<TradeDetailsFormProps> = ({
  trade,
  onTradeChange,
  onTradeTypeChange,
  onContractDetailsChange,
  contractDetails,
  pointValue,
  maxRisk,
  disableEdits = false,
}) => {
  // Determine which types to show in the selector based on available symbols
  const handleSymbolChange = (value: string) => {
    onTradeChange('symbol', value);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="tradeType">Trade Type</Label>
        <div className="flex flex-wrap gap-2">
          {TRADE_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant={trade.type === type ? 'default' : 'outline'}
              onClick={() => onTradeTypeChange(type)}
              className="text-sm py-1 px-3 h-auto"
              disabled={disableEdits}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="symbol">Symbol</Label>
        <SymbolSelector
          value={trade.symbol || ''}
          onChange={handleSymbolChange}
          tradeType={trade.type as TradeType}
          onTypeChange={onTradeTypeChange}
        />
      </div>

      {trade.type === 'futures' && (
        <FuturesContractDetails
          symbol={trade.symbol || ''}
          onChange={onContractDetailsChange}
          value={contractDetails}
          pointValue={pointValue}
        />
      )}

      <div className="space-y-2">
        <Label htmlFor="direction">Direction</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={trade.direction === 'long' ? 'default' : 'outline'}
            onClick={() => onTradeChange('direction', 'long')}
            className="flex-1"
            disabled={disableEdits}
          >
            Long
          </Button>
          <Button
            type="button"
            variant={trade.direction === 'short' ? 'default' : 'outline'}
            onClick={() => onTradeChange('direction', 'short')}
            className="flex-1"
            disabled={disableEdits}
          >
            Short
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="entryDate">Entry Date</Label>
        <Input
          id="entryDate"
          type="datetime-local"
          value={trade.entryDate || ''}
          onChange={(e) => onTradeChange('entryDate', e.target.value)}
          disabled={disableEdits}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="entryPrice">Entry Price</Label>
        <Input
          id="entryPrice"
          type="number"
          step="any"
          placeholder="Entry price"
          value={trade.entryPrice || ''}
          onChange={(e) => onTradeChange('entryPrice', parseFloat(e.target.value) || '')}
          disabled={disableEdits}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          placeholder="Quantity"
          value={trade.quantity || ''}
          onChange={(e) => onTradeChange('quantity', parseInt(e.target.value) || '')}
          disabled={disableEdits}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="strategy">Strategy</Label>
        <Input
          id="strategy"
          placeholder="Strategy used"
          value={trade.strategy || ''}
          onChange={(e) => onTradeChange('strategy', e.target.value)}
          disabled={disableEdits}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Setup Notes</Label>
        <Textarea
          id="notes"
          placeholder="Notes about the trade setup"
          value={trade.notes || ''}
          onChange={(e) => onTradeChange('notes', e.target.value)}
          rows={3}
          disabled={disableEdits}
        />
      </div>
    </div>
  );
};
