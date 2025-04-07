
import React from 'react';
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SymbolSelector } from '@/components/SymbolSelector';
import { FuturesContractDetails } from '@/components/FuturesContractDetails';
import { Button } from '@/components/ui/button';
import { TRADE_TYPES } from '@/types';

// Define props interface
interface TradeDetailsFormProps {
  trade: Partial<Trade>;
  onTradeChange: (field: keyof Trade, value: any) => void;
  onTradeTypeChange: (type: Trade['type']) => void;
  onContractDetailsChange: (details: any) => void;
  contractDetails: Record<string, any>;
}

export const TradeDetailsForm: React.FC<TradeDetailsFormProps> = ({
  trade,
  onTradeChange,
  onTradeTypeChange,
  onContractDetailsChange,
  contractDetails,
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
          tradeType={trade.type}
          onTypeChange={onTradeTypeChange}
        />
      </div>

      {trade.type === 'futures' && (
        <FuturesContractDetails
          symbol={trade.symbol || ''}
          onChange={onContractDetailsChange}
          value={contractDetails}
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
          >
            Long
          </Button>
          <Button
            type="button"
            variant={trade.direction === 'short' ? 'default' : 'outline'}
            onClick={() => onTradeChange('direction', 'short')}
            className="flex-1"
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
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Entry Price</Label>
        <Input
          id="price"
          type="number"
          step="any"
          placeholder="Entry price"
          value={trade.price || ''}
          onChange={(e) => onTradeChange('price', parseFloat(e.target.value) || '')}
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
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="strategy">Strategy</Label>
        <Input
          id="strategy"
          placeholder="Strategy used"
          value={trade.strategy || ''}
          onChange={(e) => onTradeChange('strategy', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="setupNotes">Setup Notes</Label>
        <Textarea
          id="setupNotes"
          placeholder="Notes about the trade setup"
          value={trade.setupNotes || ''}
          onChange={(e) => onTradeChange('setupNotes', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};
