import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { generateUUID } from '@/utils/generateUUID';
import { toast } from '@/utils/toast';
import { deleteStrategy, getStrategies, saveStrategies } from '@/utils/strategyStorage';
import { Strategy } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getRandomColor } from '@/utils/colors';
import { Edit, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { SketchPicker } from 'react-color';
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
} from "@/components/ui/alert-dialog"

const StrategyManagement: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategyName, setStrategyName] = useState('');
  const [strategyDescription, setStrategyDescription] = useState('');
  const [strategyColor, setStrategyColor] = useState(getRandomColor());
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    const loadedStrategies = await getStrategies();
    setStrategies(loadedStrategies);
  };

  const handleAddStrategy = async () => {
    if (!strategyName) {
      toast.error('Strategy name is required');
      return;
    }

    const newStrategy: Strategy = {
      id: generateUUID(),
      name: strategyName,
      description: strategyDescription,
      color: strategyColor,
      createdAt: new Date()
    };

    const updatedStrategies = [...strategies, newStrategy];
    await saveStrategies(updatedStrategies);
    setStrategies(updatedStrategies);
    setStrategyName('');
    setStrategyDescription('');
    setStrategyColor(getRandomColor());
    toast.success('Strategy added successfully');
  };

  const handleEditStrategy = (strategy: Strategy) => {
    setIsEditing(true);
    setSelectedStrategy(strategy);
    setStrategyName(strategy.name);
    setStrategyDescription(strategy.description || '');
    setStrategyColor(strategy.color || getRandomColor());
  };

  const handleUpdateStrategy = async () => {
    if (!selectedStrategy) return;

    const updatedStrategies = strategies.map(strategy =>
      strategy.id === selectedStrategy.id
        ? { ...strategy, name: strategyName, description: strategyDescription, color: strategyColor }
        : strategy
    );

    await saveStrategies(updatedStrategies);
    setStrategies(updatedStrategies);
    setStrategyName('');
    setStrategyDescription('');
    setStrategyColor(getRandomColor());
    setSelectedStrategy(null);
    setIsEditing(false);
    toast.success('Strategy updated successfully');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedStrategy(null);
    setStrategyName('');
    setStrategyDescription('');
    setStrategyColor(getRandomColor());
  };

  const handleDeleteStrategy = async (id: string) => {
    const updatedStrategies = strategies.filter(strategy => strategy.id !== id);
    await saveStrategies(updatedStrategies);
    setStrategies(updatedStrategies);
    toast.success('Strategy deleted successfully');
  };

  const handleCreateCustomStrategy = async () => {
    const num = Math.floor(Math.random() * 100);
    
    const newStrategy: Strategy = {
      id: generateUUID(),
      name: `Custom Strategy ${num}`,
      description: 'Your custom trading strategy',
      color: getRandomColor(),
      createdAt: new Date()
    };

    const updatedStrategies = [...strategies, newStrategy];
    await saveStrategies(updatedStrategies);
    setStrategies(updatedStrategies);
    toast.success('Added new custom strategy');
  };

  const handleColorChange = (color: any) => {
    setStrategyColor(color.hex);
    if (selectedStrategy) {
      setSelectedStrategy({
        ...selectedStrategy,
        name: strategyName,
        description: strategyDescription,
        color: strategyColor,
        createdAt: selectedStrategy.createdAt || new Date()
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Strategy Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border">
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Strategy' : 'Add New Strategy'}</CardTitle>
            <CardDescription>Manage your trading strategies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="strategyName">Strategy Name</Label>
              <Input
                id="strategyName"
                placeholder="e.g. Trend Following"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="strategyDescription">Description</Label>
              <Input
                id="strategyDescription"
                placeholder="e.g. Trading with the trend"
                value={strategyDescription}
                onChange={(e) => setStrategyDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center space-x-3">
                <Badge style={{ backgroundColor: strategyColor, color: 'white' }}>
                  {strategyColor}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setShowColorPicker(!showColorPicker)}>
                  Pick Color
                </Button>
              </div>
              {showColorPicker && (
                <SketchPicker
                  color={strategyColor}
                  onChange={handleColorChange}
                />
              )}
            </div>
          </CardContent>
          <div className="p-6 flex justify-end items-center space-x-2">
            {isEditing && (
              <Button variant="ghost" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
            <Button onClick={isEditing ? handleUpdateStrategy : handleAddStrategy}>
              {isEditing ? 'Update Strategy' : 'Add Strategy'}
            </Button>
          </div>
        </Card>

        <Card className="border">
          <CardHeader>
            <CardTitle>Current Strategies</CardTitle>
            <CardDescription>View and manage existing strategies</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {strategies.length === 0 ? (
                  <p className="text-muted-foreground">No strategies added yet.</p>
                ) : (
                  strategies.map((strategy) => (
                    <div key={strategy.id} className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/50">
                      <div className="flex items-center space-x-3">
                        <Badge style={{ backgroundColor: strategy.color, color: 'white' }}>
                          {strategy.name}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{strategy.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditStrategy(strategy)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this strategy? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStrategy(strategy.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <div className="p-6 flex justify-end">
            <Button variant="outline" onClick={handleCreateCustomStrategy}>
              Add Custom Strategy
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StrategyManagement;
