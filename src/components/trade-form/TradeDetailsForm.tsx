
import React from 'react';
import { Trade, TRADE_TYPES, TradeType } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SymbolSelector } from '@/components/SymbolSelector';
import { FuturesContractDetails } from '@/components/FuturesContractDetails';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStrategies } from '@/utils/strategyStorage';

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

  // Handle numeric inputs with decimal points
  const handleNumericInput = (field: keyof Trade, value: string) => {
    if (value === '') {
      onTradeChange(field, undefined);
      return;
    }
    
    // Allow decimal input including intermediate states
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      // Handle special cases like "." or "0."
      if (value === '.' || value === '0.' || value.endsWith('.')) {
        onTradeChange(field, value);
      } else {
        const numValue = parseFloat(value);
        onTradeChange(field, isNaN(numValue) ? undefined : numValue);
      }
    }
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

  const strategies = getStrategies();

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
          type="text"
          inputMode="decimal"
          placeholder="Entry price"
          value={trade.entryPrice || ''}
          onChange={(e) => handleNumericInput('entryPrice', e.target.value)}
          disabled={disableEdits}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="text"
          inputMode="decimal"
          placeholder="Quantity"
          value={trade.quantity || ''}
          onChange={(e) => handleNumericInput('quantity', e.target.value)}
          disabled={disableEdits}
        />
        <p className="text-xs text-muted-foreground">Supports small values (e.g. 0.000033432)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="strategy">Strategy</Label>
        <Select 
          value={trade.strategy || ''}
          onValueChange={(value) => onTradeChange('strategy', value)}
          disabled={disableEdits}
        >
          <SelectTrigger id="strategy">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {strategies && strategies.length > 0 ? (
              strategies.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="default">Default Strategy</SelectItem>
            )}
          </SelectContent>
        </Select>
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
            <SelectContent className="bg-background">
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
            <SelectContent className="bg-background">
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
            <SelectContent className="bg-background">
              <SelectItem value="A">A - Excellent</SelectItem>
              <SelectItem value="B">B - Good</SelectItem>
              <SelectItem value="C">C - Average</SelectItem>
              <SelectItem value="D">D - Below Average</SelectItem>
              <SelectItem value="F">F - Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
