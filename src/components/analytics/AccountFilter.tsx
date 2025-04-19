
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
  // Ensure accounts and selectedAccounts are always arrays
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeSelectedAccounts = Array.isArray(selectedAccounts) ? selectedAccounts : [];
  
  const toggleAccount = (account: string) => {
    if (safeSelectedAccounts.includes(account)) {
      onChange(safeSelectedAccounts.filter(a => a !== account));
    } else {
      onChange([...safeSelectedAccounts, account]);
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
            {safeSelectedAccounts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {safeSelectedAccounts.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          {/* Ensure Command always receives valid props */}
          <Command>
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              {safeAccounts.length > 0 ? (
                safeAccounts.map((account) => (
                  <CommandItem
                    key={account}
                    onSelect={() => toggleAccount(account)}
                    className="cursor-pointer"
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      safeSelectedAccounts.includes(account) ? "bg-primary text-primary-foreground" : "opacity-50"
                    )}>
                      {safeSelectedAccounts.includes(account) && (
                        <Check className={cn("h-4 w-4")} />
                      )}
                    </div>
                    {account}
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled>No accounts available</CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {safeSelectedAccounts.length > 0 && (
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
