
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Download, Upload, AlertTriangle } from 'lucide-react';
import { LessonList } from '@/components/lessons/LessonList';
import { LessonDialog } from '@/components/lessons/LessonDialog';
import { LessonFilters } from '@/components/lessons/LessonFilters';
import { Lesson } from '@/types';
import { getLessons, exportLessons, importLessons, syncLessonsWithServer } from '@/utils/lessonStorage';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/utils/toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isUsingServerSync } from '@/utils/storage/serverSync';

export default function Lessons() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isStorageNearLimit, setIsStorageNearLimit] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load data initially and set up event listeners
  useEffect(() => {
    console.log('Lessons page loaded or refreshKey changed');
    loadLessons();
    checkStorageUsage();
    
    // Try to sync with server if applicable
    syncLessonsWithServer().catch(error => {
      console.error('Failed to sync lessons with server:', error);
    });
    
    // Set up event listeners to refresh data
    const handleStorageChange = () => {
      console.log('Storage change detected in Lessons page');
      loadLessons();
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Lessons page visible again, refreshing data');
        loadLessons();
        checkStorageUsage();
      }
    };
    
    const handleLessonsUpdated = () => {
      console.log('Lessons updated event detected');
      loadLessons();
    };
    
    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('lessons-updated', handleLessonsUpdated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('lessons-updated', handleLessonsUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshKey]);

  // Monitor URL changes to reload data
  useEffect(() => {
    const handleRouteChange = () => {
      console.log('Route changed to Lessons page');
      setRefreshKey(prev => prev + 1);
    };
    
    // This will catch route changes within the app
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const loadLessons = async () => {
    setIsLoading(true);
    console.log('Loading lessons data from storage');
    try {
      const loadedLessons = await getLessons();
      console.log(`Loaded ${loadedLessons.length} lessons from storage`);
      setLessons(loadedLessons);
    } catch (error) {
      console.error('Error loading lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const checkStorageUsage = () => {
    try {
      if (isUsingServerSync()) {
        setIsStorageNearLimit(false);
        return;
      }
      
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) total += value.length;
        }
      }
      
      const estimatedLimit = 5 * 1024 * 1024;
      const usagePercentage = (total / estimatedLimit) * 100;
      
      setIsStorageNearLimit(usagePercentage > 70);
      
      console.log(`Estimated localStorage usage: ${usagePercentage.toFixed(1)}%`);
    } catch (e) {
      console.error('Error checking storage usage:', e);
    }
  };

  const handleOpenDialog = () => {
    setEditingLesson(null);
    setIsDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLesson(null);
    loadLessons();
    checkStorageUsage();
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleExport = async () => {
    try {
      const data = await exportLessons();
      setExportData(data);
      setIsExportDialogOpen(true);
    } catch (error) {
      console.error('Error exporting lessons:', error);
      toast.error('Failed to export lessons');
    }
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportData)
      .then(() => {
        toast.success('Lessons data copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard');
      });
  };

  const handleDownloadExport = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lessons-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Lessons downloaded successfully');
  };

  const handleImport = async () => {
    try {
      if (!importData.trim()) {
        toast.error('Please enter valid JSON data');
        return;
      }
      
      const success = await importLessons(importData);
      if (success) {
        toast.success('Lessons imported successfully');
        setIsImportDialogOpen(false);
        loadLessons();
        checkStorageUsage();
      }
    } catch (e) {
      console.error('Import error:', e);
      toast.error('Failed to import. Please check the data format.');
    }
  };

  const filteredLessons = selectedTypes.length > 0
    ? lessons.filter(lesson => 
        lesson.types && lesson.types.some(type => selectedTypes.includes(type))
      )
    : lessons;

  const allTypes = [...new Set(lessons.flatMap(lesson => lesson.types || []))];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto mb-6">
        <div className="relative w-full">
          <div className="flex items-center mb-4">
            <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
            <div className="ml-[300px] flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToggleFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </div>
          </div>
        </div>

        {isStorageNearLimit && (
          <div className="w-full mb-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Storage Warning</AlertTitle>
              <AlertDescription>
                You're approaching storage limits. Consider enabling server sync or exporting your data.
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex justify-end gap-2 mb-4 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="max-w-6xl mx-auto mb-6">
          <LessonFilters 
            allTypes={allTypes}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Loading lessons...</p>
          </div>
        ) : (
          <LessonList 
            lessons={filteredLessons} 
            onEdit={handleEditLesson} 
            onUpdate={loadLessons} 
          />
        )}
      </div>

      <LessonDialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        lesson={editingLesson}
      />

      <Dialog 
        open={isExportDialogOpen} 
        onOpenChange={setIsExportDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Lessons</DialogTitle>
            <DialogDescription>
              Your lessons data in JSON format. Copy this or download the file for backup.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Textarea 
              value={exportData} 
              readOnly 
              className="h-[200px] font-mono text-xs"
            />
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCopyExport}>
              Copy to Clipboard
            </Button>
            <Button onClick={handleDownloadExport}>
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isImportDialogOpen} 
        onOpenChange={setIsImportDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Lessons</DialogTitle>
            <DialogDescription>
              Paste your previously exported JSON data to import lessons.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Textarea 
              value={importData} 
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your JSON data here..."
              className="h-[200px] font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
