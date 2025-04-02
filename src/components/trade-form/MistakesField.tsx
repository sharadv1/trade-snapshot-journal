
import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const DEFAULT_MISTAKES = [
  "Missed the entry",
  "Position sizing too large",
  "Position sizing too small",
  "Moving stop loss",
  "Premature exit",
  "Chasing the price",
  "Ignored the plan",
  "FOMO trade",
  "Revenge trading",
  "Averaging down",
  "Trading distracted",
  "No defined stop loss",
  "Trading news",
  "Overtrading",
  "Trading against the trend"
];

interface MistakesFieldProps {
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}

export function MistakesField({ value = [], onChange }: MistakesFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [customMistakes, setCustomMistakes] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState("");

  // Ensure value is always an array
  const safeValue = React.useMemo(() => Array.isArray(value) ? value : [], [value]);
  
  // Combine default mistakes with any custom ones
  const allMistakes = React.useMemo(() => {
    return [...DEFAULT_MISTAKES, ...customMistakes];
  }, [customMistakes]);

  const handleSelect = React.useCallback(
    (selectedMistake: string) => {
      setInputValue("");
      
      if (!selectedMistake) return;
      
      onChange(
        safeValue.includes(selectedMistake)
          ? safeValue.filter((item) => item !== selectedMistake)
          : [...safeValue, selectedMistake]
      );
    },
    [safeValue, onChange]
  );

  const handleRemove = React.useCallback(
    (mistake: string) => {
      onChange(safeValue.filter((item) => item !== mistake));
    },
    [safeValue, onChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && inputValue && inputValue.trim()) {
        e.preventDefault();
        
        // Only add if it doesn't already exist in either list
        if (!safeValue.includes(inputValue) && !allMistakes.includes(inputValue)) {
          setCustomMistakes((prev) => [...prev, inputValue]);
          onChange([...safeValue, inputValue]);
        } else if (!safeValue.includes(inputValue)) {
          // If it exists in the list of mistakes but not in selected values, just select it
          onChange([...safeValue, inputValue]);
        }
        
        setInputValue("");
      }
    },
    [inputValue, safeValue, allMistakes, onChange]
  );

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {safeValue.length > 0 
              ? `${safeValue.length} mistake${safeValue.length > 1 ? 's' : ''} selected` 
              : "Select mistakes"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Search mistakes or add new"
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={handleKeyDown}
            />
            <CommandEmpty>
              {inputValue ? (
                <div className="p-2 text-sm">
                  Press Enter to add "{inputValue}"
                </div>
              ) : (
                "No mistakes found."
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {allMistakes.map((mistake) => (
                <CommandItem
                  key={mistake}
                  value={mistake}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      safeValue.includes(mistake) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {mistake}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {safeValue.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {safeValue.map((mistake) => (
            <Badge key={mistake} variant="secondary" className="text-sm">
              {mistake}
              <X
                className="ml-2 h-3 w-3 cursor-pointer"
                onClick={() => handleRemove(mistake)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
