
import * as React from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Remove the default mistakes array
const DEFAULT_MISTAKES: string[] = [];

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

  // Filter available mistakes based on input value
  const filteredMistakes = React.useMemo(() => {
    if (!inputValue.trim()) return allMistakes;
    
    return allMistakes.filter(mistake => 
      mistake.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [allMistakes, inputValue]);

  const handleToggleMistake = React.useCallback(
    (mistake: string) => {
      if (safeValue.includes(mistake)) {
        onChange(safeValue.filter((item) => item !== mistake));
      } else {
        onChange([...safeValue, mistake]);
      }
    },
    [safeValue, onChange]
  );

  const handleRemove = React.useCallback(
    (mistake: string) => {
      onChange(safeValue.filter((item) => item !== mistake));
      
      // Also remove from custom mistakes if it exists there
      if (customMistakes.includes(mistake)) {
        setCustomMistakes(prev => prev.filter(item => item !== mistake));
      }
    },
    [safeValue, onChange, customMistakes]
  );

  const handleAddCustom = React.useCallback(() => {
    if (!inputValue.trim()) return;

    // Only add if it doesn't already exist
    if (!allMistakes.includes(inputValue)) {
      setCustomMistakes(prev => [...prev, inputValue]);
    }
    
    // Always select the new/existing mistake
    if (!safeValue.includes(inputValue)) {
      onChange([...safeValue, inputValue]);
    }
    
    setInputValue("");
  }, [inputValue, safeValue, allMistakes, onChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddCustom();
      }
    },
    [handleAddCustom]
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
              : "Add mistakes"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-4" align="start">
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder="Enter new mistake"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button 
              type="button" 
              size="sm" 
              onClick={handleAddCustom}
              disabled={!inputValue.trim()}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {allMistakes.length > 0 ? (
            <ScrollArea className="h-[200px] max-h-[50vh]">
              <div className="space-y-1">
                {filteredMistakes.map((mistake) => (
                  <div
                    key={mistake}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer",
                      safeValue.includes(mistake) 
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <div 
                      className="flex-1 flex items-center"
                      onClick={() => handleToggleMistake(mistake)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          safeValue.includes(mistake) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {mistake}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                      onClick={() => handleRemove(mistake)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No mistakes added yet
            </div>
          )}
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
