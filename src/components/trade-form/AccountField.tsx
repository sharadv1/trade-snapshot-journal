
import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
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
import { getAccounts } from '@/utils/accountStorage';

interface AccountFieldProps {
  value?: string;
  onChange: (value: string) => void;
}

export function AccountField({ value, onChange }: AccountFieldProps) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Array<{id: string; name: string}>>([]);

  useEffect(() => {
    // Load accounts safely
    try {
      const loadedAccountNames = getAccounts();
      // Convert string array to account objects with id and name
      const accountObjects = loadedAccountNames.map(name => ({
        id: name,
        name: name
      }));
      // Ensure accounts is always an array, even if getAccounts returns undefined or null
      setAccounts(Array.isArray(accountObjects) ? accountObjects : []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    }
  }, []);

  // If no accounts are available, provide a default one
  const accountOptions = accounts.length > 0 
    ? accounts 
    : [{ id: 'default', name: 'Default Account' }];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value 
            ? accountOptions.find((account) => account.id === value)?.name || value
            : "Select account"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search accounts..." />
          <CommandEmpty>No account found.</CommandEmpty>
          <CommandGroup>
            {accountOptions.map((account) => (
              <CommandItem
                key={account.id}
                value={account.id}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? '' : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === account.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {account.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
