import React from 'react';
import { Trade, FuturesContractDetails } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SymbolSelector } from '@/components/SymbolSelector';
import { FuturesContractSelector } from '@/components/FuturesContractSelector';
import { FuturesContractDetails as FuturesContractDetailsComponent } from '@/components/FuturesContractDetails';
import { MistakesField } from './MistakesField';

interface TradeDetailsFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
  handleTypeChange: (type: Trade['type']) => void;
  contractDetails: Partial<FuturesContractDetails>;
  pointValue: number | undefined;
}

export function TradeDetailsForm({
  trade,
  handleChange,
  handleTypeChange,
  contractDetails,
  pointValue
}: TradeDetailsFormProps) {
  return (
    <div className="space-y-4">
      {/* Trade Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="type">Trade Type</Label>
        <Select
          value={trade.type}
          onValueChange={(value: Trade['type']) => handleTypeChange(value)}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Select Trade Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stock">Stock</SelectItem>
            <SelectItem value="option">Option</SelectItem>
            <SelectItem value="futures">Futures</SelectItem>
            <SelectItem value="crypto">Cryptocurrency</SelectItem>
            <SelectItem value="forex">Forex</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Symbol Selection */}
      <div className="space-y-2">
        <Label htmlFor="symbol">Symbol</Label>
        {trade.type === 'futures' ? (
          <FuturesContractSelector
            value={trade.symbol}
            onChange={(symbol) => handleChange('symbol', symbol)}
          />
        ) : (
          <SymbolSelector
            value={trade.symbol}
            onChange={(symbol) => handleChange('symbol', symbol)}
            type={trade.type}
          />
        )}
      </div>

      {/* Contract Details for Futures */}
      {trade.type === 'futures' && trade.symbol && (
        <FuturesContractDetailsComponent
          contractDetails={contractDetails}
          onChange={(details) => handleChange('contractDetails', details)}
          symbol={trade.symbol}
        />
      )}

      {/* Trade Direction */}
      <div className="space-y-2">
        <Label htmlFor="direction">Direction</Label>
        <Select
          value={trade.direction}
          onValueChange={(value: 'long' | 'short') => handleChange('direction', value)}
        >
          <SelectTrigger id="direction">
            <SelectValue placeholder="Select Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="long">Long</SelectItem>
            <SelectItem value="short">Short</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trading Strategy */}
      <div className="space-y-2">
        <Label htmlFor="strategy">Strategy</Label>
        <Select
          value={trade.strategy || 'default-strategy'}
          onValueChange={(value) => handleChange('strategy', value)}
        >
          <SelectTrigger id="strategy">
            <SelectValue placeholder="Select Strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default-strategy">Default Strategy</SelectItem>
            <SelectItem value="breakout">Breakout</SelectItem>
            <SelectItem value="reversal">Reversal</SelectItem>
            <SelectItem value="trend-following">Trend Following</SelectItem>
            <SelectItem value="scalping">Scalping</SelectItem>
            <SelectItem value="swing">Swing</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Entry Date/Time */}
      <div className="space-y-2">
        <Label htmlFor="entryDate">Entry Date & Time</Label>
        <Input
          type="datetime-local"
          id="entryDate"
          value={trade.entryDate ? trade.entryDate.slice(0, 16) : ''}
          onChange={(e) => handleChange('entryDate', e.target.value)}
        />
      </div>

      {/* Entry Price */}
      <div className="space-y-2">
        <Label htmlFor="entryPrice">
          Entry Price {trade.type === 'futures' && pointValue ? `($${pointValue.toFixed(2)} per point)` : ''}
        </Label>
        <Input
          type="number"
          id="entryPrice"
          placeholder="0.00"
          step="0.01"
          value={trade.entryPrice || ''}
          onChange={(e) => handleChange('entryPrice', parseFloat(e.target.value) || 0)}
        />
      </div>
      
      {/* Quantity */}
      <div className="space-y-2">
        <Label htmlFor="quantity">
          Quantity {trade.type === 'futures' ? '(# of Contracts)' : '(# of Shares)'}
        </Label>
        <Input
          type="number"
          id="quantity"
          placeholder="0"
          value={trade.quantity || ''}
          onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
        />
      </div>
      
      {/* Fees */}
      <div className="space-y-2">
        <Label htmlFor="fees">Fees</Label>
        <Input
          type="number"
          id="fees"
          placeholder="0.00"
          step="0.01"
          value={trade.fees || ''}
          onChange={(e) => handleChange('fees', parseFloat(e.target.value) || 0)}
        />
      </div>
      
      {/* Timeframe */}
      <div className="space-y-2">
        <Label htmlFor="timeframe">Timeframe</Label>
        <Select
          value={trade.timeframe || ''}
          onValueChange={(value) => handleChange('timeframe', value)}
        >
          <SelectTrigger id="timeframe">
            <SelectValue placeholder="Select Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">1 Minute</SelectItem>
            <SelectItem value="5m">5 Minutes</SelectItem>
            <SelectItem value="15m">15 Minutes</SelectItem>
            <SelectItem value="30m">30 Minutes</SelectItem>
            <SelectItem value="1h">1 Hour</SelectItem>
            <SelectItem value="4h">4 Hours</SelectItem>
            <SelectItem value="1d">Daily</SelectItem>
            <SelectItem value="1w">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Mistakes Field - Added here */}
      <div className="space-y-2">
        <Label htmlFor="mistakes">Mistakes Made</Label>
        <MistakesField 
          value={trade.mistakes} 
          onChange={(mistakes) => handleChange('mistakes', mistakes)} 
        />
      </div>
    </div>
  );
}
