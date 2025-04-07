
import React from 'react';
import { Trade, TRADE_TYPES, TradeType } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SymbolSelector } from '@/components/SymbolSelector';
import { FuturesContractDetails } from '@/components/FuturesContractDetails';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  const timeframeOptions = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '30m', label: '30 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: 'D', label: 'Daily' },
    { value: 'W', label: 'Weekly' },
    { value: 'M', label: 'Monthly' },
  ];

  const ssmtOptions = [
    { value: 'Q1', label: 'Q1' },
    { value: 'Q2', label: 'Q2' },
    { value: 'Q3', label: 'Q3' },
    { value: 'Q4', label: 'Q4' },
  ];

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
          contractDetails={contractDetails}
          value={pointValue}
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

      {/* Risk Management Section */}
      <div className="space-y-2 border-t pt-4">
        <Label className="text-base font-semibold">Risk Management</Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stopLoss">Stop Loss</Label>
            <Input
              id="stopLoss"
              type="number"
              step="any"
              placeholder="Stop loss price"
              value={trade.stopLoss || ''}
              onChange={(e) => onTradeChange('stopLoss', parseFloat(e.target.value) || '')}
              disabled={disableEdits}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="takeProfit">Take Profit</Label>
            <Input
              id="takeProfit"
              type="number"
              step="any"
              placeholder="Take profit price"
              value={trade.takeProfit || ''}
              onChange={(e) => onTradeChange('takeProfit', parseFloat(e.target.value) || '')}
              disabled={disableEdits}
            />
          </div>
        </div>
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

      {/* Timeframe and Analysis Section */}
      <div className="space-y-2 border-t pt-4">
        <Label className="text-base font-semibold">Trade Analysis</Label>
        
        <div className="space-y-2">
          <Label htmlFor="timeframe">Timeframe</Label>
          <Select 
            value={trade.timeframe || ''} 
            onValueChange={(value) => onTradeChange('timeframe', value)}
            disabled={disableEdits}
          >
            <SelectTrigger id="timeframe">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              {timeframeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pspTime">PSP Time</Label>
          <Input
            id="pspTime"
            placeholder="PSP time"
            value={trade.pspTime || ''}
            onChange={(e) => onTradeChange('pspTime', e.target.value)}
            disabled={disableEdits}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ssmtQuarters">SSMT Quarters</Label>
          <Select 
            value={trade.ssmtQuarters || ''} 
            onValueChange={(value) => onTradeChange('ssmtQuarters', value)}
            disabled={disableEdits}
          >
            <SelectTrigger id="ssmtQuarters">
              <SelectValue placeholder="Select SSMT quarter" />
            </SelectTrigger>
            <SelectContent>
              {ssmtOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade">Trade Grade</Label>
          <Select 
            value={trade.grade || ''} 
            onValueChange={(value) => onTradeChange('grade', value)}
            disabled={disableEdits}
          >
            <SelectTrigger id="grade">
              <SelectValue placeholder="Grade this trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A - Excellent</SelectItem>
              <SelectItem value="B">B - Good</SelectItem>
              <SelectItem value="C">C - Average</SelectItem>
              <SelectItem value="D">D - Below Average</SelectItem>
              <SelectItem value="F">F - Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
