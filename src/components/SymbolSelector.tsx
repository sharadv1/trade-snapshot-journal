
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Command,
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

export interface SymbolSelectorProps {
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
  const [symbols, setSymbols] = useState<SymbolDetails[]>([]);
  const [availableTypes, setAvailableTypes] = useState<Set<string>>(new Set());
  
  // Load all symbols when component mounts and when tradeType changes
  useEffect(() => {
    const allSymbols = getAllSymbols();
    setSymbols(allSymbols);
    
    // Collect all available symbol types
    const types = new Set<string>();
    allSymbols.forEach(symbol => {
      if (symbol.type) {
        types.add(symbol.type);
      }
    });
    setAvailableTypes(types);
    
    // Reset input value when value changes externally
    if (value) {
      setInputValue(value);
    }
  }, [value, tradeType]);

  // Filter symbols based on trade type - ensure we always have an array even if filtering returns nothing
  const filteredSymbols = useMemo(() => {
    if (!tradeType || !symbols.length) return symbols;
    
    // If the selected type doesn't exist in available types, show all symbols
    if (!availableTypes.has(tradeType)) {
      return symbols;
    }
    
    return symbols.filter(s => s.type === tradeType) || [];
  }, [symbols, tradeType, availableTypes]);

  const handleSelect = (currentValue: string) => {
    onChange(currentValue);
    
    // Find the selected symbol to get its type
    const selectedSymbol = symbols.find(s => s.symbol === currentValue);
    
    // Auto-update trade type if onTypeChange is provided and symbol has a type
    if (selectedSymbol?.type && onTypeChange && selectedSymbol.type !== tradeType) {
      onTypeChange(selectedSymbol.type as 'stock' | 'futures' | 'forex' | 'crypto' | 'options');
    }
    
    setOpen(false);
  };

  const handleCreateOption = () => {
    if (inputValue && !symbols.some(s => s.symbol === inputValue)) {
      // Add to storage and update local state
      const newSymbols = addCustomSymbol({
        symbol: inputValue,
        type: tradeType as SymbolDetails['type']
      });
      setSymbols(getAllSymbols());
      onChange(inputValue);
      setOpen(false);
    }
  };

  const filteredSymbolsByInput = useMemo(() => {
    if (!inputValue.trim()) {
      return filteredSymbols;
    }
    
    return filteredSymbols.filter(symbol => 
      symbol.symbol.toLowerCase().includes(inputValue.toLowerCase()) ||
      (symbol.meaning && symbol.meaning.toLowerCase().includes(inputValue.toLowerCase()))
    );
  }, [filteredSymbols, inputValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            <span className="flex items-center gap-1">
              <span className="font-mono">{value}</span>
              {getSymbolMeaning(value) && (
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  ({getSymbolMeaning(value)})
                </span>
              )}
            </span>
          ) : (
            "Select symbol..."
          )}
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
              {filteredSymbolsByInput.length > 0 ? (
                filteredSymbolsByInput.map((symbolData) => {
                  const meaning = getSymbolMeaning(symbolData.symbol);
                  return (
                    <CommandItem
                      key={symbolData.symbol}
                      value={symbolData.symbol}
                      onSelect={handleSelect}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === symbolData.symbol ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="font-mono">{symbolData.symbol}</span>
                        {meaning && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            ({meaning})
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {symbolData.type}
                      </span>
                    </CommandItem>
                  );
                })
              ) : (
                <div className="py-6 text-center text-sm">
                  <p>No symbols found</p>
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
