
import React, { useState, useEffect } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getAccounts, saveAccounts } from '@/utils/accountStorage';
import { Skeleton } from '@/components/ui/skeleton';

interface AccountFieldProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export function AccountField({ value, onChange }: AccountFieldProps) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [newAccount, setNewAccount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize accounts with an empty array to prevent undefined errors
  useEffect(() => {
    try {
      const loadedAccounts = getAccounts();
      // Ensure accounts is always an array
      setAccounts(Array.isArray(loadedAccounts) ? loadedAccounts : []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      // Fall back to empty array if there's an error
      setAccounts([]);
    } finally {
      // Set loading to false when done, regardless of success or failure
      setIsLoading(false);
    }
  }, []);

  const handleAddAccount = () => {
    if (newAccount.trim() && !accounts.includes(newAccount.trim())) {
      const updatedAccounts = [...accounts, newAccount.trim()];
      setAccounts(updatedAccounts);
      saveAccounts(updatedAccounts);
      setNewAccount('');
      setIsAdding(false);
    }
  };

  const handleDeleteAccount = (accountToDelete: string) => {
    const updatedAccounts = accounts.filter(account => account !== accountToDelete);
    setAccounts(updatedAccounts);
    saveAccounts(updatedAccounts);
    
    // If the deleted account was selected, clear the selection
    if (value === accountToDelete) {
      onChange('');
    }
  };

  // Don't render command components until accounts are loaded
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? value : "Select account..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search account..." />
          <CommandEmpty>
            {isAdding ? (
              <div className="flex items-center p-2">
                <Input
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className="flex-1"
                  placeholder="Account name"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddAccount}
                  className="ml-2"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost" 
                  onClick={() => setIsAdding(false)}
                  className="ml-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="py-2 px-1 text-center text-sm">
                <p>No accounts found</p>
                <Button 
                  variant="ghost"
                  className="mt-2 w-full" 
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Account
                </Button>
              </div>
            )}
          </CommandEmpty>
          <CommandGroup>
            {accounts.map((account) => (
              <CommandItem
                key={account}
                value={account}
                onSelect={() => {
                  onChange(account);
                  setOpen(false);
                }}
                className="group flex items-center justify-between"
              >
                {account}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAccount(account);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </CommandItem>
            ))}
          </CommandGroup>
          {!isAdding && accounts.length > 0 && (
            <div className="p-1 border-t">
              <Button 
                variant="ghost"
                className="w-full" 
                onClick={() => setIsAdding(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
