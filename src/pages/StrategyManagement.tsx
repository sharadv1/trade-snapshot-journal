import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash } from 'lucide-react';
import { toast } from '@/utils/toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Strategy } from '@/types';
import { getStrategies, addStrategy, updateStrategy, deleteStrategy, isStrategyInUse } from '@/utils/strategyStorage';

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function StrategyManagement() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    description: '',
    color: getRandomColor()
  });
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [updatedStrategy, setUpdatedStrategy] = useState<Strategy>({
    id: '',
    name: '',
    description: '',
    color: ''
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);

  useEffect(() => {
    const loadStrategies = () => {
      const loadedStrategies = getStrategies();
      setStrategies(loadedStrategies);
    };

    loadStrategies();

    // Listen for storage events to refresh the list
    const handleStorageChange = () => {
      loadStrategies();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleAddStrategy = () => {
    if (!newStrategy.name || !newStrategy.color) {
      toast.error("Strategy name and color are required");
      return;
    }
    
    const strategy: Strategy = {
      id: `strategy-${generateUUID()}`, // Add ID
      name: newStrategy.name,
      description: newStrategy.description,
      color: newStrategy.color
    };
    
    addStrategy(strategy);
    toast.success("Strategy added successfully");
    
    // Reset form
    setNewStrategy({
      name: '',
      description: '',
      color: getRandomColor()
    });
    
    setIsAdding(false);
  };

  const handleEditClick = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setUpdatedStrategy({ ...strategy });
  };

  const handleUpdateStrategy = () => {
    if (!updatedStrategy.name || !updatedStrategy.color) {
      toast.error("Strategy name and color are required");
      return;
    }

    if (updatedStrategy.id) {
      updateStrategy(updatedStrategy);
      toast.success("Strategy updated successfully");
    }

    setEditingStrategy(null);
    setUpdatedStrategy({
      id: '',
      name: '',
      description: '',
      color: ''
    });
  };

  const handleDeleteClick = (strategyId: string) => {
    setStrategyToDelete(strategyId);
    setDeleteConfirmOpen(true);
    setIsDeleteDisabled(isStrategyInUse(strategyId));
  };

  const confirmDelete = () => {
    if (strategyToDelete) {
      deleteStrategy(strategyToDelete);
      toast.success("Strategy deleted successfully");
    }
    setStrategyToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, 
            v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Strategy Management</h1>

      {/* Add Strategy Section */}
      {!isAdding ? (
        <Button onClick={() => setIsAdding(true)} className="mb-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Strategy
        </Button>
      ) : (
        <div className="mb-6 p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Add New Strategy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                type="text"
                id="name"
                value={newStrategy.name}
                onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                type="color"
                id="color"
                value={newStrategy.color}
                onChange={(e) => setNewStrategy({ ...newStrategy, color: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newStrategy.description}
                onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStrategy}>Add Strategy</Button>
          </div>
        </div>
      )}

      {/* Strategy Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>A list of your trade strategies.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {strategies.map((strategy) => (
              <TableRow key={strategy.id}>
                <TableCell className="font-medium">{strategy.name}</TableCell>
                <TableCell>{strategy.description}</TableCell>
                <TableCell>
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: strategy.color }}
                  ></div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(strategy)}
                    disabled={editingStrategy !== null}
                    className="mr-2"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteClick(strategy.id)}
                    disabled={isDeleteDisabled}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Strategy Modal */}
      {editingStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Strategy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  type="text"
                  id="edit-name"
                  value={updatedStrategy.name}
                  onChange={(e) => setUpdatedStrategy({ ...updatedStrategy, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  type="color"
                  id="edit-color"
                  value={updatedStrategy.color}
                  onChange={(e) => setUpdatedStrategy({ ...updatedStrategy, color: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={updatedStrategy.description}
                  onChange={(e) => setUpdatedStrategy({ ...updatedStrategy, description: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingStrategy(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStrategy}>Update Strategy</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this strategy. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleteDisabled} className={isDeleteDisabled ? "cursor-not-allowed" : ""}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
