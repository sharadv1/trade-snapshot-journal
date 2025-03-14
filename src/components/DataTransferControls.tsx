
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { exportTradesToFile, importTradesFromFile } from '@/utils/dataTransfer';
import { Download, Upload } from 'lucide-react';

interface DataTransferControlsProps {
  onImportComplete?: () => void;
}

export const DataTransferControls = ({ onImportComplete }: DataTransferControlsProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleExport = () => {
    exportTradesToFile();
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
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="flex items-center gap-1"
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
      >
        <Upload className="h-4 w-4" />
        <span>{isImporting ? 'Importing...' : 'Import'}</span>
      </Button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
    </div>
  );
};
