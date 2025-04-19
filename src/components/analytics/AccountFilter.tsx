
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

interface AccountFilterProps {
  accounts: string[];
  selectedAccounts: string[];
  onChange: (accounts: string[]) => void;
}

export function AccountFilter({ accounts = [], selectedAccounts = [], onChange }: AccountFilterProps) {
  // Ensure accounts is always an array, even if undefined is passed
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  
  const toggleAccount = (account: string) => {
    if (selectedAccounts.includes(account)) {
      onChange(selectedAccounts.filter(a => a !== account));
    } else {
      onChange([...selectedAccounts, account]);
    }
  };

  const clearSelection = () => {
    onChange([]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            Account Filter
            {selectedAccounts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedAccounts.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              {safeAccounts.map((account) => (
                <CommandItem
                  key={account}
                  onSelect={() => toggleAccount(account)}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selectedAccounts.includes(account) ? "bg-primary text-primary-foreground" : "opacity-50"
                  )}>
                    {selectedAccounts.includes(account) && (
                      <Check className={cn("h-4 w-4")} />
                    )}
                  </div>
                  {account}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedAccounts.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearSelection}
          className="h-8"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
