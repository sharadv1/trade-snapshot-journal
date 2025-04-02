
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Trade, FuturesContractDetails, TradeIdea } from '@/types';
import { SymbolSelector } from '@/components/SymbolSelector';
import { FuturesContractSelector } from '@/components/FuturesContractSelector';
import { FuturesContractDetails as FuturesDetails } from '@/components/FuturesContractDetails';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { getIdeas } from '@/utils/ideaStorage';

interface TradeDetailsFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
  handleTypeChange: (type: 'stock' | 'futures' | 'forex' | 'crypto' | 'options') => void;
  contractDetails: Partial<FuturesContractDetails>;
  pointValue: number;
  isEditing?: boolean;
}

export function TradeDetailsForm({
  trade,
  handleChange,
  handleTypeChange,
  contractDetails,
  pointValue,
  isEditing = false
}: TradeDetailsFormProps) {
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  
  useEffect(() => {
    // Load valid and taken ideas
    const allIdeas = getIdeas() || [];
    const availableIdeas = allIdeas.filter(idea => 
      idea.status === 'still valid' || 
      (idea.status === 'taken' && idea.id === trade.ideaId)
    );
    setIdeas(availableIdeas);
  }, [trade.ideaId]);
  
  // Ensure we always have an array of ideas, even if empty
  const safeIdeas = ideas || [];
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Trade Type</Label>
        <RadioGroup
          value={trade.type}
          onValueChange={(value) => handleTypeChange(value as 'stock' | 'futures' | 'forex' | 'crypto' | 'options')}
          className="flex space-x-2"
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="stock" id="stock" />
            <Label htmlFor="stock" className="cursor-pointer">Stock</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="futures" id="futures" />
            <Label htmlFor="futures" className="cursor-pointer">Futures</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="options" id="options" />
            <Label htmlFor="options" className="cursor-pointer">Options</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="symbol">Symbol <span className="text-destructive">*</span></Label>
        {trade.type === 'futures' ? (
          <FuturesContractSelector 
            value={trade.symbol || ''} 
            onChange={(value) => handleChange('symbol', value)} 
          />
        ) : (
          <SymbolSelector 
            value={trade.symbol || ''}
            onChange={(value) => handleChange('symbol', value)}
          />
        )}
      </div>

      {trade.type === 'futures' && trade.symbol && (
        <FuturesDetails
          symbol={trade.symbol}
          contractDetails={contractDetails}
          pointValue={pointValue}
        />
      )}
      
      <div className="space-y-2">
        <Label htmlFor="ideaId">Trade Idea</Label>
        <Select 
          value={trade.ideaId || 'none'}
          onValueChange={(value) => handleChange('ideaId', value === 'none' ? '' : value)}
        >
          <SelectTrigger id="ideaId">
            <SelectValue placeholder="Select a trade idea (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {safeIdeas.length > 0 ? (
              safeIdeas.map(idea => (
                <SelectItem key={idea.id || `idea-${crypto.randomUUID()}`} value={idea.id || ''}>
                  {idea.symbol} - {idea.description?.slice(0, 30)}
                  {idea.description && idea.description.length > 30 ? '...' : ''}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-available" disabled>No available ideas</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Direction</Label>
        <RadioGroup
          value={trade.direction}
          onValueChange={(value) => handleChange('direction', value as 'long' | 'short')}
          className="flex space-x-2"
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="long" id="long" />
            <Label htmlFor="long" className="cursor-pointer">Long</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="short" id="short" />
            <Label htmlFor="short" className="cursor-pointer">Short</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade">Trade Grade</Label>
        <Select 
          value={trade.grade || 'no-grade'}
          onValueChange={(value) => handleChange('grade', value === 'no-grade' ? undefined : value)}
        >
          <SelectTrigger id="grade">
            <SelectValue placeholder="Select a grade (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-grade">None</SelectItem>
            <SelectItem value="A">A - Excellent</SelectItem>
            <SelectItem value="B">B - Good</SelectItem>
            <SelectItem value="C">C - Average</SelectItem>
            <SelectItem value="D">D - Poor</SelectItem>
            <SelectItem value="F">F - Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entryDate">Entry Date & Time</Label>
          <Input 
            id="entryDate" 
            type="datetime-local"
            value={trade.entryDate || ''}
            onChange={(e) => handleChange('entryDate', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="entryPrice">Entry Price <span className="text-destructive">*</span></Label>
          <Input 
            id="entryPrice" 
            type="number"
            min="0"
            step="0.01"
            value={trade.entryPrice || ''}
            onChange={(e) => handleChange('entryPrice', parseFloat(e.target.value))}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity <span className="text-destructive">*</span></Label>
          <Input 
            id="quantity" 
            type="number"
            min="1"
            step="1"
            value={trade.quantity || ''}
            onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fees">Fees & Commissions</Label>
          <Input 
            id="fees" 
            type="number"
            min="0"
            step="0.01"
            value={trade.fees || ''}
            onChange={(e) => handleChange('fees', parseFloat(e.target.value))}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pspTime">PSP Time (HH:MM)</Label>
          <Input 
            id="pspTime" 
            type="time"
            value={trade.pspTime || ''}
            onChange={(e) => handleChange('pspTime', e.target.value)}
            placeholder="Enter PSP time (e.g., 09:30)"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="timeframe">Timeframe</Label>
          <Select
            value={trade.timeframe || 'none'}
            onValueChange={(value) => handleChange('timeframe', value === 'none' ? undefined : value)}
          >
            <SelectTrigger id="timeframe" className="w-full">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="m5">5 Minutes (M5)</SelectItem>
              <SelectItem value="m15">15 Minutes (M15)</SelectItem>
              <SelectItem value="h1">1 Hour (H1)</SelectItem>
              <SelectItem value="h4">4 Hours (H4)</SelectItem>
              <SelectItem value="d1">Daily (D1)</SelectItem>
              <SelectItem value="w1">Weekly (W1)</SelectItem>
              <SelectItem value="m1">Monthly (M1)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
