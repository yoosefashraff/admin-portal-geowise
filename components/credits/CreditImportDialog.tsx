'use client';

import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { importApprovedUserCredits } from '@/lib/actions/approvedUserCredits.actions';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

interface CreditImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditImportDialog({ open, onOpenChange }: CreditImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; errors?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setUploadResult(null);
      return;
    }

    // Validate file type
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx') && !selectedFile.type.includes('csv') && !selectedFile.type.includes('spreadsheet')) {
      toast.error('Please select a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await importApprovedUserCredits(formData);

      if (response.Status === 201) {
        const result = response.data || { success: 0 };
        setUploadResult(result);
        
        if (result.errors && result.errors.length > 0) {
          toast.warning(`Import completed with ${result.errors.length} error(s). ${result.success} record(s) imported successfully.`);
        } else {
          toast.success(`Successfully imported ${result.success} credit record(s)`);
        }
      } else {
        toast.error(response.Message || 'Import failed');
        setUploadResult(null);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import credits. Please check the file format and try again.');
      setUploadResult(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Approved User Credits
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to bulk import approved user credits.
          </DialogDescription>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mt-2">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0" />
              <div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
              id="credit-import-file"
            />
            <label
              htmlFor="credit-import-file"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
              </div>
              <div className="text-xs text-gray-500">CSV or Excel files only</div>
            </label>
          </div>

          {/* Selected File */}
          {file && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
              <button
                onClick={() => handleFileSelect(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className={`p-4 rounded-lg border ${
              uploadResult.errors && uploadResult.errors.length > 0
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start gap-2">
                {uploadResult.errors && uploadResult.errors.length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={`font-medium ${
                    uploadResult.errors && uploadResult.errors.length > 0
                      ? 'text-yellow-900'
                      : 'text-green-900'
                  }`}>
                    Import {uploadResult.errors && uploadResult.errors.length > 0 ? 'completed with errors' : 'completed successfully'}
                  </div>
                  <div className={`text-sm mt-1 ${
                    uploadResult.errors && uploadResult.errors.length > 0
                      ? 'text-yellow-700'
                      : 'text-green-700'
                  }`}>
                    {uploadResult.success} record(s) imported successfully
                  </div>
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-2 text-sm text-yellow-700">
                      <div className="font-medium mb-1">Errors ({uploadResult.errors.length}):</div>
                      <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                        {uploadResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index} className="text-xs">{error}</li>
                        ))}
                        {uploadResult.errors.length > 10 && (
                          <li className="text-xs italic">... and {uploadResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* File Format Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-2">Expected File Format:</div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• CSV or Excel file with columns: UserId, ServiceId, ApprovedCredits, StartDate, EndDate, RecurringPeriod, IsActive</div>
              <div>• Optional columns: UsedCredits, RemainingCredits</div>
              <div>• Dates should be in format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            {uploadResult ? 'Close' : 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
