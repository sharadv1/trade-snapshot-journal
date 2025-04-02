
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
  const [mistakes, setMistakes] = React.useState<string[]>(DEFAULT_MISTAKES);
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = React.useCallback(
    (mistake: string) => {
      setInputValue("");
      if (value.includes(mistake)) {
        onChange(value.filter((item) => item !== mistake));
      } else {
        onChange([...value, mistake]);
      }
    },
    [value, onChange]
  );

  const handleRemove = React.useCallback(
    (mistake: string) => {
      onChange(value.filter((item) => item !== mistake));
    },
    [value, onChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        e.key === "Enter" &&
        inputValue &&
        !mistakes.includes(inputValue) &&
        !value.includes(inputValue)
      ) {
        e.preventDefault();
        setMistakes((prev) => [...prev, inputValue]);
        onChange([...value, inputValue]);
        setInputValue("");
      }
    },
    [inputValue, mistakes, value, onChange]
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
            Select mistakes
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command onKeyDown={handleKeyDown}>
            <CommandInput
              placeholder="Search mistakes or add new"
              value={inputValue}
              onValueChange={setInputValue}
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
              {mistakes.map((mistake) => (
                <CommandItem
                  key={mistake}
                  value={mistake}
                  onSelect={() => handleSelect(mistake)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(mistake) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {mistake}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((mistake) => (
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
