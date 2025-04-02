
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TradeForm } from '@/components/TradeForm';
import { ExitTradeForm } from '@/components/ExitTradeForm';
import { Trade } from '@/types';
import { getTradeById } from '@/utils/storage/tradeOperations';
import { toast } from '@/utils/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartialExitsList } from '@/components/PartialExitsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TradeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('edit');
  
  const loadTradeData = () => {
    if (!id) {
      console.error('No trade ID provided in URL');
      toast.error('No trade ID found');
      navigate('/');
      return;
    }
    
    console.log('Loading trade data for ID:', id);
    const tradeData = getTradeById(id);
    if (tradeData) {
      setTrade(tradeData);
    } else {
      console.error('Trade not found with ID:', id);
      toast.error('Trade not found');
      navigate('/');
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadTradeData();
  }, [id, navigate]);
  
  const handleTradeUpdate = () => {
    loadTradeData();
  };
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p>Loading trade details...</p>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="py-8 text-center">
        <p>Trade not found</p>
      </div>
    );
  }

  const totalExitedQuantity = (trade.partialExits || []).reduce(
    (total, exit) => total + exit.quantity, 
    0
  );
  
  const remainingQuantity = trade.quantity - totalExitedQuantity;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Manage Trade: {trade.symbol}I'll implement these changes to reorganize the trade form components and add the SSMT Quarters dropdown.

<lov-code>
To implement these changes, I'll need to:
1. Move risk parameters from RiskParametersForm into TradeDetailsForm
2. Reorganize the input fields as requested
3. Add a new SSMT Quarters dropdown

First, let's update the TradeDetailsForm.tsx file:

<lov-write file_path="src/components/trade-form/TradeDetailsForm.tsx">
import React from 'react';
import { Trade, FuturesContractDetails } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SymbolSelector } from '@/components/SymbolSelector';
import { FuturesContractSelector } from '@/components/FuturesContractSelector';
import { FuturesContractDetails as FuturesContractDetailsComponent } from '@/components/FuturesContractDetails';
import { MistakesField } from './MistakesField';
import { TrendingDown, TrendingUp, Ratio, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Strategy } from '@/types';
import { getStrategies } from '@/utils/strategyStorage';

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
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number | null>(null);

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
            tradeType={trade.type as 'stock' | 'futures' | 'forex' | 'crypto' | 'options'}
          />
        )}
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
      
      {/* Stop Loss - Moved from RiskParametersForm */}
      <div className="space-y-2">
        <Label htmlFor="stopLoss" className="flex items-center gap-1">
          <TrendingDown className="h-4 w-4 text-loss" />
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
      
      {/* Take Profit - Moved from RiskParametersForm */}
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
      
      {riskRewardRatio !== null && (
        <div className="bg-muted/30 p-3 rounded-md flex items-center">
          <Ratio className="h-5 w-5 mr-2 text-primary" />
          <div>
            <span className="font-medium">Risk-Reward Ratio: </span>
            <span className="font-mono">{riskRewardRatio.toFixed(2)}:1</span>
          </div>
        </div>
      )}
      
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
      
      <div className="border rounded-md p-4 bg-muted/30 mt-4">
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
