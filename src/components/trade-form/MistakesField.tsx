
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
  
  // Load saved custom mistakes on component mount
  React.useEffect(() => {
    const savedMistakes = localStorage.getItem('tradingJournal_customMistakes');
    if (savedMistakes) {
      try {
        setCustomMistakes(JSON.parse(savedMistakes));
      } catch (error) {
        console.error('Error parsing saved mistakes:', error);
      }
    }
  }, []);

  // Save custom mistakes whenever they change
  React.useEffect(() => {
    if (customMistakes.length > 0) {
      localStorage.setItem('tradingJournal_customMistakes', JSON.stringify(customMistakes));
    }
  }, [customMistakes]);

  // Filter available mistakes based on input value
  const filteredMistakes = React.useMemo(() => {
    if (!inputValue.trim()) return customMistakes;
    
    return customMistakes.filter(mistake => 
      mistake.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [customMistakes, inputValue]);

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
    },
    [safeValue, onChange]
  );

  const handleRemoveCustomMistake = React.useCallback(
    (mistake: string) => {
      setCustomMistakes(prev => prev.filter(item => item !== mistake));
      // Also remove from selected values if it's there
      if (safeValue.includes(mistake)) {
        onChange(safeValue.filter((item) => item !== mistake));
      }
    },
    [safeValue, onChange]
  );

  const handleAddCustom = React.useCallback(() => {
    if (!inputValue.trim()) return;

    // Only add if it doesn't already exist
    if (!customMistakes.includes(inputValue)) {
      setCustomMistakes(prev => [...prev, inputValue]);
    }
    
    // Always select the new/existing mistake
    if (!safeValue.includes(inputValue)) {
      onChange([...safeValue, inputValue]);
    }
    
    setInputValue("");
  }, [inputValue, safeValue, customMistakes, onChange]);

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
        <PopoverContent className="w-[220px] p-3" align="start">
          <div className="flex items-center space-x-2 mb-3">
            <Input
              placeholder="New mistake"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-8 text-sm"
            />
            <Button 
              type="button" 
              size="sm" 
              onClick={handleAddCustom}
              disabled={!inputValue.trim()}
              className="shrink-0 h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {customMistakes.length > 0 ? (
            <ScrollArea className="h-[180px] max-h-[40vh]">
              <div className="space-y-1">
                {filteredMistakes.map((mistake) => (
                  <div
                    key={mistake}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2 py-1 text-sm",
                      safeValue.includes(mistake) 
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <div 
                      className="flex-1 flex items-center cursor-pointer"
                      onClick={() => handleToggleMistake(mistake)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          safeValue.includes(mistake) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="text-sm truncate">{mistake}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 w-5 p-0 opacity-70 hover:opacity-100"
                      onClick={() => handleRemoveCustomMistake(mistake)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
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
