import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMON_FUTURES_CONTRACTS } from '@/types';
import { getAllSymbols, addCustomSymbol, SymbolDetails, getSymbolMeaning } from '@/utils/symbolStorage';

interface SymbolSelectorProps {
  value: string;
  onChange: (value: string) => void;
  tradeType?: 'stock' | 'futures' | 'forex' | 'crypto' | 'options';
  onTypeChange?: (type: 'stock' | 'futures' | 'forex' | 'crypto' | 'options') => void;
}

export function SymbolSelector({ 
  value, 
  onChange, 
  tradeType = 'stock',
  onTypeChange
}: SymbolSelectorProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [symbols, setSymbols] = useState<SymbolDetails[]>(() => {
    // Get combined symbols (preset + custom)
    return getAllSymbols();
  });

  // Filter symbols based on trade type
  const filteredSymbols = tradeType === 'futures' 
    ? symbols.filter(s => s.type === 'futures')
    : symbols;

  // Refresh symbols when component mounts
  useEffect(() => {
    setSymbols(getAllSymbols());
  }, []);

  const handleSelect = (currentValue: string) => {
    onChange(currentValue);
    
    // Find the selected symbol to get its type
    const selectedSymbol = symbols.find(s => s.symbol === currentValue);
    
    // Auto-select type if a symbol with specific type is selected
    if (selectedSymbol && onTypeChange) {
      // Convert 'equity' to 'stock' for compatibility
      const normalizedType = selectedSymbol.type === 'equity' ? 'stock' : selectedSymbol.type;
      
      if (normalizedType === 'futures' || normalizedType === 'stock' || 
          normalizedType === 'forex' || normalizedType === 'crypto' || 
          normalizedType === 'options') {
        onTypeChange(normalizedType);
      }
    }
    
    setOpen(false);
  };

  const handleCreateOption = () => {
    if (inputValue && !symbols.some(s => s.symbol === inputValue)) {
      // Convert 'equity' to 'stock' for compatibility
      const normalizedType = tradeType === 'equity' ? 'stock' : tradeType;
      
      // Add to storage and update local state
      const newSymbols = addCustomSymbol({
        symbol: inputValue,
        type: normalizedType as SymbolDetails['type']
      });
      setSymbols(getAllSymbols());
      onChange(inputValue);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Select symbol..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search symbol..." 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center p-2">
                <p className="text-sm text-muted-foreground">No symbol found</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 flex items-center gap-1"
                  onClick={handleCreateOption}
                >
                  <Plus className="h-4 w-4" />
                  Add "{inputValue}"
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredSymbols.map((symbolData) => {
                const meaning = getSymbolMeaning(symbolData.symbol);
                return (
                  <CommandItem
                    key={symbolData.symbol}
                    value={symbolData.symbol}
                    onSelect={(currentValue) => handleSelect(currentValue)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === symbolData.symbol ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-mono font-medium">{symbolData.symbol}</span>
                    {meaning && (
                      <span className="ml-2 text-xs text-muted-foreground truncate max-w-[150px]">
                        {meaning}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
