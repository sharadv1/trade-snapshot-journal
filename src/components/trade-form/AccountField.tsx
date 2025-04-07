
import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAccounts, saveAccounts } from '@/utils/accountStorage';
import { toast } from '@/utils/toast';

interface AccountFieldProps {
  value?: string;
  onChange: (value: string) => void;
}

export function AccountField({ value, onChange }: AccountFieldProps) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    // Load accounts safely
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    try {
      const loadedAccountNames = getAccounts() || [];
      setAccounts(loadedAccountNames);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    }
  };

  const handleAddAccount = () => {
    setDialogOpen(true);
    setEditMode(false);
    setAccountName('');
  };

  const handleEditAccount = (account: string) => {
    setDialogOpen(true);
    setEditMode(true);
    setAccountName(account);
    setSelectedAccount(account);
  };

  const handleDeleteAccount = (account: string) => {
    try {
      const updatedAccounts = accounts.filter(a => a !== account);
      saveAccounts(updatedAccounts);
      setAccounts(updatedAccounts);
      
      // If the deleted account is the currently selected one, reset the selection
      if (value === account) {
        onChange('');
      }
      
      toast.success(`Account "${account}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const handleSaveAccount = () => {
    if (!accountName.trim()) {
      toast.error('Account name cannot be empty');
      return;
    }

    try {
      let updatedAccounts: string[];
      
      if (editMode && selectedAccount) {
        // Handle edit - replace the old name with the new one
        updatedAccounts = accounts.map(a => a === selectedAccount ? accountName : a);
        
        // If the edited account is the currently selected one, update the selection
        if (value === selectedAccount) {
          onChange(accountName);
        }
        
        toast.success(`Account renamed to "${accountName}"`);
      } else {
        // Handle add - check for duplicates
        if (accounts.includes(accountName)) {
          toast.error(`Account "${accountName}" already exists`);
          return;
        }
        
        updatedAccounts = [...accounts, accountName];
        toast.success(`Account "${accountName}" added successfully`);
      }
      
      saveAccounts(updatedAccounts);
      setAccounts(updatedAccounts);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error('Failed to save account');
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value && accounts.includes(value) 
              ? value
              : "Select account"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search accounts..." />
            <CommandList>
              <CommandEmpty>No account found.</CommandEmpty>
              <CommandGroup heading="Select an account">
                {accounts.length > 0 ? (
                  accounts.map((account) => (
                    <CommandItem
                      key={account}
                      value={account}
                      onSelect={(currentValue) => {
                        onChange(currentValue === value ? '' : currentValue);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === account ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {account}
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAccount(account);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAccount(account);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </CommandItem>
                  ))
                ) : (
                  <CommandItem disabled className="text-muted-foreground">
                    No accounts available
                  </CommandItem>
                )}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    handleAddAccount();
                  }}
                  className="text-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add new account
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Account' : 'Add New Account'}</DialogTitle>
            <DialogDescription>
              {editMode 
                ? 'Change the name of this account.' 
                : 'Enter a name for your new trading account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., Demo Account, Live Trading"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSaveAccount}
            >
              {editMode ? 'Save Changes' : 'Add Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
