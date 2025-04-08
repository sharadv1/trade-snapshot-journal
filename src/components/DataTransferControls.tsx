
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { exportTradesToFile, importTradesFromFile, getLastImportSummary, getLastExportSummary } from '@/utils/dataTransfer';
import { Download, Upload } from 'lucide-react';
import { toast } from '@/utils/toast';
import { DataImportSummary } from './DataImportSummary';
import { DataExportSummary } from './DataExportSummary';

interface DataTransferControlsProps {
  onImportComplete?: () => void;
}

export const DataTransferControls = ({ onImportComplete }: DataTransferControlsProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [showImportSummary, setShowImportSummary] = useState(false);
  const [showExportSummary, setShowExportSummary] = useState(false);
  const [importSummaryData, setImportSummaryData] = useState(getLastImportSummary());
  const [exportSummaryData, setExportSummaryData] = useState(getLastExportSummary());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handleImportComplete = (event: CustomEvent) => {
      if (event.detail?.summaryData) {
        setImportSummaryData(event.detail.summaryData);
        setShowImportSummary(true);
      }
    };
    
    const handleExportComplete = (event: CustomEvent) => {
      if (event.detail?.summaryData) {
        setExportSummaryData(event.detail.summaryData);
        setShowExportSummary(true);
      }
    };
    
    document.addEventListener('import-complete', handleImportComplete as EventListener);
    document.addEventListener('export-complete', handleExportComplete as EventListener);
    
    return () => {
      document.removeEventListener('import-complete', handleImportComplete as EventListener);
      document.removeEventListener('export-complete', handleExportComplete as EventListener);
    };
  }, []);
  
  const handleExport = async () => {
    await exportTradesToFile();
  };
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      await importTradesFromFile(file);
      if (onImportComplete) {
        onImportComplete();
      }
      
      // Force refresh UI components
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error during import:', error);
      toast.error('Import failed. Please check the file format.');
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="flex items-center gap-1"
          title="Export trades, ideas, strategies and symbols"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          disabled={isImporting}
          className="flex items-center gap-1"
          title="Import trades, ideas, strategies and symbols"
        >
          <Upload className="h-4 w-4" />
          <span>{isImporting ? 'Importing...' : 'Import'}</span>
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.csv"
          className="hidden"
        />
      </div>
      
      <DataImportSummary 
        isOpen={showImportSummary} 
        onClose={() => setShowImportSummary(false)} 
        summaryData={importSummaryData}
      />

      <DataExportSummary
        isOpen={showExportSummary}
        onClose={() => setShowExportSummary(false)}
        summaryData={exportSummaryData}
      />
    </>
  );
};
