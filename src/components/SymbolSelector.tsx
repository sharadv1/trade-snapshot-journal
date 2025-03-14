
import { useState, useRef, useEffect } from 'react';
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

// Common stock symbols and futures contracts
const PRESET_SYMBOLS = [
  // Common stocks
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD',
  // Common futures (using the ones from the futures contracts data)
  'MES', 'MNQ', 'MYM', 'MGC', 'SIL', 'M6E', 'M6B',
];

interface SymbolSelectorProps {
  value: string;
  onChange: (value: string) => void;
  tradeType?: 'equity' | 'futures' | 'option';
}

export function SymbolSelector({ value, onChange, tradeType = 'equity' }: SymbolSelectorProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [symbols, setSymbols] = useState<string[]>(() => {
    // Get custom symbols from localStorage or use defaults
    const savedSymbols = localStorage.getItem('customSymbols');
    const customSymbols = savedSymbols ? JSON.parse(savedSymbols) : [];
    return [...PRESET_SYMBOLS, ...customSymbols];
  });

  // Filter symbols based on trade type
  const filteredSymbols = tradeType === 'futures' 
    ? symbols.filter(s => ['MES', 'MNQ', 'MYM', 'MGC', 'SIL', 'M6E', 'M6B'].includes(s))
    : symbols;

  const saveSymbol = (symbol: string) => {
    if (!symbol || symbols.includes(symbol)) return;
    
    const newSymbols = [...symbols, symbol];
    setSymbols(newSymbols);
    
    // Save to localStorage
    const customSymbols = newSymbols.filter(s => !PRESET_SYMBOLS.includes(s));
    localStorage.setItem('customSymbols', JSON.stringify(customSymbols));
  };

  const handleSelect = (currentValue: string) => {
    onChange(currentValue);
    setOpen(false);
  };

  const handleCreateOption = () => {
    if (inputValue && !symbols.includes(inputValue)) {
      saveSymbol(inputValue);
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
              {filteredSymbols.map((symbol) => (
                <CommandItem
                  key={symbol}
                  value={symbol}
                  onSelect={(currentValue) => handleSelect(currentValue)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === symbol ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {symbol}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
