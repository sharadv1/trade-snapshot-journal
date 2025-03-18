import { useState, useEffect } from 'react';
import { Strategy } from '@/types';
import { 
  getStrategies, 
  addStrategy, 
  updateStrategy, 
  deleteStrategy, 
  isStrategyInUse 
} from '@/utils/strategyStorage';
import { toast } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, CheckSquare } from 'lucide-react';

export default function StrategyManagement() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [newStrategy, setNewStrategy] = useState<Partial<Strategy>>({
    name: '',
    description: '',
    color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
  });

  // Load strategies on mount
  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = () => {
    try {
      const loadedStrategies = getStrategies();
      setStrategies(loadedStrategies);
      setSelectedStrategies([]);
    } catch (error) {
      console.error('Failed to load strategies:', error);
      toast.error('Failed to load strategies');
    }
  };

  const handleAddStrategy = () => {
    try {
      if (!newStrategy.name) {
        toast.error('Strategy name is required');
        return;
      }

      const addedStrategy = addStrategy({
        name: newStrategy.name,
        description: newStrategy.description || '',
        color: newStrategy.color || '#000000',
      });

      if (addedStrategy) {
        toast.success('Strategy added successfully');
        setDialogOpen(false);
        setNewStrategy({
          name: '',
          description: '',
          color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        });
        loadStrategies();
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to add strategy');
    }
  };

  const handleUpdateStrategy = () => {
    try {
      if (!editingStrategy || !editingStrategy.name) {
        toast.error('Strategy name is required');
        return;
      }

      // Check if the name has changed from the original
      const originalStrategy = strategies.find(s => s.id === editingStrategy.id);
      const nameChanged = originalStrategy && originalStrategy.name !== editingStrategy.name;

      const updatedStrategy = updateStrategy(editingStrategy);
      
      if (updatedStrategy) {
        if (nameChanged) {
          toast.success('Strategy updated and trade references updated');
        } else {
          toast.success('Strategy updated successfully');
        }
        
        setDialogOpen(false);
        setEditingStrategy(null);
        loadStrategies();
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to update strategy');
    }
  };

  const handleDeleteStrategy = (strategyId: string) => {
    try {
      deleteStrategy(strategyId);
      toast.success('Strategy deleted successfully');
      loadStrategies();
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete strategy');
    }
  };

  const handleBulkDelete = () => {
    if (selectedStrategies.length === 0) {
      toast.error('No strategies selected');
      return;
    }

    // Check if any selected strategies are in use
    const nonDeletableStrategies: string[] = [];

    selectedStrategies.forEach(id => {
      const strategy = strategies.find(s => s.id === id);
      if (!strategy) return;
      
      if (isStrategyInUse(id)) {
        nonDeletableStrategies.push(strategy.name);
      }
    });

    if (nonDeletableStrategies.length > 0) {
      toast.error(`Cannot delete strategies in use: ${nonDeletableStrategies.join(', ')}`);
      return;
    }

    // Delete all selected strategies
    let deleteCount = 0;
    selectedStrategies.forEach(id => {
      try {
        const result = deleteStrategy(id);
        if (result) deleteCount++;
      } catch (error) {
        console.error(`Failed to delete strategy ${id}:`, error);
      }
    });

    if (deleteCount > 0) {
      toast.success(`Successfully deleted ${deleteCount} strategies`);
      loadStrategies();
    } else {
      toast.error('No strategies were deleted');
    }

    setBulkDeleteDialogOpen(false);
  };

  const toggleStrategySelection = (strategyId: string) => {
    setSelectedStrategies(prev => {
      if (prev.includes(strategyId)) {
        return prev.filter(id => id !== strategyId);
      } else {
        return [...prev, strategyId];
      }
    });
  };

  const toggleAllStrategies = () => {
    if (selectedStrategies.length === strategies.length) {
      // If all strategies are selected, deselect all
      setSelectedStrategies([]);
    } else {
      // Otherwise, select all strategies
      setSelectedStrategies(strategies.map(s => s.id));
    }
  };

  const openAddDialog = () => {
    setEditingStrategy(null);
    setNewStrategy({
      name: '',
      description: '',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    });
    setDialogOpen(true);
  };

  const openEditDialog = (strategy: Strategy) => {
    setEditingStrategy({ ...strategy });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingStrategy(null);
    setNewStrategy({
      name: '',
      description: '',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    });
  };

  const allStrategiesSelected = selectedStrategies.length === strategies.length && strategies.length > 0;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Strategy Management
          </h1>
          <p className="text-muted-foreground">
            Add, edit, and delete your trading strategies
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {selectedStrategies.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Selected ({selectedStrategies.length})
            </Button>
          )}
          <Button onClick={openAddDialog}>
            <Plus className="mr-1 h-4 w-4" />
            Add Strategy
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trading Strategies</CardTitle>
          <CardDescription>
            Manage the strategies you use in your trading journal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '50px' }}>
                  <div className="flex items-center">
                    <Checkbox 
                      checked={allStrategiesSelected} 
                      onCheckedChange={toggleAllStrategies}
                      disabled={strategies.length === 0}
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: '50px' }}>Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead style={{ width: '100px' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {strategies.map((strategy) => (
                <TableRow key={strategy.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedStrategies.includes(strategy.id)}
                      onCheckedChange={() => toggleStrategySelection(strategy.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: strategy.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{strategy.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {strategy.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditDialog(strategy)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the strategy "{strategy.name}"?
                              {isStrategyInUse(strategy.id) && (
                                <p className="mt-2 text-destructive">
                                  This strategy is currently in use by existing trades and cannot be deleted.
                                </p>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={isStrategyInUse(strategy.id)}
                              onClick={() => handleDeleteStrategy(strategy.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {strategies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No strategies found. Add a strategy to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Strategy Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStrategy ? 'Edit Strategy' : 'Add Strategy'}
            </DialogTitle>
            <DialogDescription>
              {editingStrategy 
                ? 'Update the details of your trading strategy'
                : 'Enter the details of your new trading strategy'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="strategy-name">Strategy Name</Label>
              <Input
                id="strategy-name"
                placeholder="Enter strategy name"
                value={editingStrategy ? editingStrategy.name : newStrategy.name}
                onChange={(e) => {
                  if (editingStrategy) {
                    setEditingStrategy({...editingStrategy, name: e.target.value});
                  } else {
                    setNewStrategy({...newStrategy, name: e.target.value});
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="strategy-description">Description (Optional)</Label>
              <Textarea
                id="strategy-description"
                placeholder="Describe your strategy"
                value={editingStrategy ? editingStrategy.description || '' : newStrategy.description || ''}
                onChange={(e) => {
                  if (editingStrategy) {
                    setEditingStrategy({...editingStrategy, description: e.target.value});
                  } else {
                    setNewStrategy({...newStrategy, description: e.target.value});
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="strategy-color">Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="strategy-color"
                  type="color"
                  className="w-12 h-10 p-1"
                  value={editingStrategy ? editingStrategy.color : newStrategy.color}
                  onChange={(e) => {
                    if (editingStrategy) {
                      setEditingStrategy({...editingStrategy, color: e.target.value});
                    } else {
                      setNewStrategy({...newStrategy, color: e.target.value});
                    }
                  }}
                />
                <Input
                  type="text"
                  value={editingStrategy ? editingStrategy.color : newStrategy.color}
                  onChange={(e) => {
                    if (editingStrategy) {
                      setEditingStrategy({...editingStrategy, color: e.target.value});
                    } else {
                      setNewStrategy({...newStrategy, color: e.target.value});
                    }
                  }}
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button type="button" onClick={editingStrategy ? handleUpdateStrategy : handleAddStrategy}>
              {editingStrategy ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Delete Strategies</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStrategies.length} selected strategies?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
