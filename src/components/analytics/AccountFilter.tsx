
import React, { useState, useEffect } from 'react';
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

export function AccountFilter({ 
  accounts = [], 
  selectedAccounts = [], 
  onChange 
}: AccountFilterProps) {
  const [open, setOpen] = useState(false);
  const [safeAccounts, setSafeAccounts] = useState<string[]>([]);
  const [safeSelectedAccounts, setSafeSelectedAccounts] = useState<string[]>([]);
  
  // Initialize and validate local state whenever props change
  useEffect(() => {
    // Ensure accounts is an array
    setSafeAccounts(Array.isArray(accounts) ? [...accounts] : []);
    // Ensure selectedAccounts is an array
    setSafeSelectedAccounts(Array.isArray(selectedAccounts) ? [...selectedAccounts] : []);
  }, [accounts, selectedAccounts]);

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

  // If no accounts are available, show a disabled button
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return (
      <Button variant="outline" size="sm" className="h-8" disabled>
        No accounts available
      </Button>
    );
  }

  // Special rendering to avoid undefined children in Command component
  const renderCommandContent = () => {
    // Only render CommandGroup with items if there are accounts
    if (safeAccounts.length === 0) {
      return (
        <div className="p-2 text-center text-sm text-muted-foreground">
          No accounts available
        </div>
      );
    }

    return (
      <CommandGroup>
        {safeAccounts.map((account) => (
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
        ))}
      </CommandGroup>
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Popover open={open} onOpenChange={setOpen}>
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
          <Command>
            <CommandEmpty>No accounts found.</CommandEmpty>
            {renderCommandContent()}
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
