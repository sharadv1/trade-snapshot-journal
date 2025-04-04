
import React from 'react';
import { Trade, FuturesContractDetails } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SymbolSelector } from '@/components/SymbolSelector';
import { FuturesContractSelector } from '@/components/FuturesContractSelector';
import { FuturesContractDetails as FuturesContractDetailsComponent } from '@/components/FuturesContractDetails';
import { MistakesField } from './MistakesField';
import { TrendingDown, TrendingUp, Ratio, Target, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Strategy } from '@/types';
import { getStrategies } from '@/utils/strategyStorage';
import { AccountField } from './AccountField';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TradeDetailsFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
  handleTypeChange: (type: Trade['type']) => void;
  contractDetails: Partial<FuturesContractDetails>;
  pointValue: number | undefined;
  maxRisk?: number;
  disableEdits?: boolean;
}

export function TradeDetailsForm({
  trade,
  handleChange,
  handleTypeChange,
  contractDetails,
  pointValue,
  maxRisk,
  disableEdits = false
}: TradeDetailsFormProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number | null>(null);
  const [calculatedRisk, setCalculatedRisk] = useState<number | null>(null);
  const [isRiskExceeded, setIsRiskExceeded] = useState(false);

  useEffect(() => {
    // Load strategies from storage
    const loadedStrategies = getStrategies();
    setStrategies(loadedStrategies);
  }, []);

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

  // Calculate total risk amount when necessary values change
  useEffect(() => {
    if (trade.entryPrice && trade.stopLoss && trade.quantity) {
      const riskPerUnit = Math.abs(trade.entryPrice - trade.stopLoss);
      let totalRisk = riskPerUnit * trade.quantity;

      // Apply point value for futures
      if (trade.type === 'futures' && pointValue) {
        totalRisk = riskPerUnit * trade.quantity * pointValue;
      }

      setCalculatedRisk(totalRisk);
      
      // Check if risk exceeds max risk
      if (maxRisk && totalRisk > maxRisk) {
        setIsRiskExceeded(true);
      } else {
        setIsRiskExceeded(false);
      }
    } else {
      setCalculatedRisk(null);
      setIsRiskExceeded(false);
    }
  }, [trade.entryPrice, trade.stopLoss, trade.quantity, trade.type, pointValue, maxRisk]);

  return (
    <div className="space-y-4">
      {/* Account Selection - New */}
      <div className="space-y-2">
        <Label htmlFor="account">Account</Label>
        <AccountField 
          value={trade.account} 
          onChange={(value) => handleChange('account', value)} 
        />
      </div>

      {/* Trade Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="type">Trade Type</Label>
        <Select
          value={trade.type}
          onValueChange={(value) => handleTypeChange(value as Trade["type"])}
          disabled={disableEdits}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stock">Stock</SelectItem>
            <SelectItem value="option">Options</SelectItem>
            <SelectItem value="futures">Futures</SelectItem>
            <SelectItem value="forex">Forex</SelectItem>
            <SelectItem value="crypto">Crypto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Symbol and Direction Selections - Side by Side */}
      <div className="grid grid-cols-2 gap-4">
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
              tradeType={trade.type as 'stock' | 'futures' | 'forex' | 'crypto' | 'options'}
            />
          )}
        </div>
        
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
      </div>

      {/* Contract Details for Futures */}
      {trade.type === 'futures' && trade.symbol && (
        <FuturesContractDetailsComponent
          contractDetails={contractDetails}
          details={contractDetails}
          symbol={trade.symbol}
          value={pointValue}
        />
      )}

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
      
      {/* Stop Loss and Take Profit - Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Stop Loss */}
        <div className="space-y-2">
          <Label htmlFor="stopLoss" className="flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-loss" />
            Stop Loss Price <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="stopLoss" 
            type="number" 
            min="0" 
            step="0.01"
            value={trade.stopLoss || ''}
            onChange={(e) => handleChange('stopLoss', parseFloat(e.target.value))}
            required
          />
        </div>
        
        {/* Take Profit */}
        <div className="space-y-2">
          <Label htmlFor="takeProfit" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-profit" />
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
      </div>
      
      {/* Risk Warning Alert - Show when risk exceeds max risk */}
      {isRiskExceeded && maxRisk && calculatedRisk && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Risk amount (${calculatedRisk.toFixed(2)}) exceeds your max risk limit of ${maxRisk}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Risk Reward Ratio Display */}
      {riskRewardRatio !== null && (
        <div className="bg-muted/30 p-3 rounded-md flex items-center">
          <Ratio className="h-5 w-5 mr-2 text-primary" />
          <div>
            <span className="font-medium">Risk-Reward Ratio: </span>
            <span className="font-mono">{riskRewardRatio.toFixed(2)}:1</span>
            {calculatedRisk !== null && (
              <span className="ml-2 text-muted-foreground">
                (Risk: ${calculatedRisk.toFixed(2)})
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Risk Management Info - Moved here from bottom */}
      <div className="border rounded-md p-4 bg-muted/30">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <Target className="h-4 w-4 mr-2" />
          Risk Management
        </h3>
        <p className="text-sm text-muted-foreground">
          Setting a stop loss and take profit helps you maintain discipline and automatically calculates your risk-to-reward ratio.
        </p>
      </div>
      
      {/* Quantity and Fees - Side by Side */}
      <div className="grid grid-cols-2 gap-4">
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
      </div>
      
      {/* Strategy - Moved before timeframe */}
      <div className="space-y-2">
        <Label htmlFor="strategy">Strategy</Label>
        <Select 
          value={trade.strategy || 'default-strategy'}
          onValueChange={(value) => handleChange('strategy', value)}
        >
          <SelectTrigger id="strategy">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            {strategies && strategies.length > 0 ? (
              strategies.map((strategy) => {
                // Ensure strategy name is never empty and always a string
                const strategyName = strategy.name || `strategy-${strategy.id}`;
                return (
                  <SelectItem key={strategy.id} value={strategyName || `strategy-${strategy.id}`}>
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
              <SelectItem value="default-strategy">Default Strategy</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      
      {/* SSMT Quarters - New field */}
      <div className="space-y-2">
        <Label htmlFor="ssmtQuarters">SSMT Quarters</Label>
        <Select
          value={trade.ssmtQuarters || ''}
          onValueChange={(value) => handleChange('ssmtQuarters', value)}
        >
          <SelectTrigger id="ssmtQuarters">
            <SelectValue placeholder="Select SSMT Quarters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="q1/q2">Q1/Q2</SelectItem>
            <SelectItem value="q2/q3">Q2/Q3</SelectItem>
            <SelectItem value="q3/q4">Q3/Q4</SelectItem>
            <SelectItem value="q4/q5">Q4/Q5</SelectItem>
            <SelectItem value="q5/q1">Q5/Q1</SelectItem>
            <SelectItem value="q4/q1">Q4/Q1</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Timeframe - Moved after strategy */}
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
      
      {/* Mistakes Field */}
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
