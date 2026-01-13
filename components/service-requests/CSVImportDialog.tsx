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
import * as XLSX from 'xlsx';
import type { ServiceRequest } from '@/lib/types/serviceRequest.types';
import { importServiceRequests } from '@/lib/actions/serviceRequests.actions';
import { toast } from 'sonner';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (importedData?: any[]) => void; // Callback with optional imported data
}

export function CSVImportDialog({ open, onOpenChange, onImport }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedData, setParsedData] = useState<any[]>([]);

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setParsedData([]);
      return;
    }

    // Validate file type - backend expects Excel files (.xlsx, .xls)
    const validExtensions = ['.xlsx', '.xls'];
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    
    const hasValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    const hasValidType = validTypes.some(type => selectedFile.type.includes(type));
    
    if (!hasValidExtension && !hasValidType) {
      toast.error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed');
      return;
    }

    // Parse Excel file client-side to show preview and pass data to parent
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setParsedData(jsonData);
      setFile(selectedFile);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast.error('Failed to parse Excel file. Please check the file format.');
      setFile(null);
      setParsedData([]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      // Create FormData with Excel file
      const formData = new FormData();
      formData.append('file', file);

      // Call backend import endpoint
      const response = await importServiceRequests(formData);

      if (response.Status === 201) {
        const successCount = response.data?.success || 0;
        
        // Log the full response to see what the backend returns
        console.log('✅ Import successful! Full response:', JSON.stringify(response, null, 2))
        console.log('Import response data structure:', {
          success: response.data?.success,
          errors: response.data?.errors,
          dataKeys: response.data ? Object.keys(response.data) : [],
          fullData: response.data,
          hasRecords: !!response.data?.records,
          recordsLength: Array.isArray(response.data?.records) ? response.data.records.length : 'N/A',
          hasDataArray: Array.isArray(response.data),
          dataArrayLength: Array.isArray(response.data) ? response.data.length : 'N/A'
        })
        
        // Check if the response contains the imported records
        const importedRecords = response.data?.records || (Array.isArray(response.data) ? response.data : []);
        if (Array.isArray(importedRecords) && importedRecords.length > 0) {
          console.log(`📦 Import response contains ${importedRecords.length} imported records:`, importedRecords);
        }
        
        // Show errors if any
        if (response.data?.errors && response.data.errors.length > 0) {
          toast.warning(`${response.data.errors.length} error${response.data.errors.length !== 1 ? 's' : ''} occurred during import`);
          console.warn('Import errors:', response.data.errors);
        }
        
        // Pass parsed data for logging, but parent will reload from API
        // This ensures we get the actual stored records from the database
        // Note: If records don't appear, they may have been converted to bookings and will appear in regular service requests
        onImport(parsedData.length > 0 ? parsedData : undefined);
        handleClose();
      } else {
        toast.error(response.Message || 'Import failed. Please check the file format and try again.');
      }
    } catch (error) {
      console.error('Failed to import service requests:', error);
      toast.error('Failed to import service requests. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Service Requests from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx or .xls) to import service requests. The file should include columns for Name, Phone, Service, and Address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
              id="excel-file-input"
            />
            <label
              htmlFor="excel-file-input"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <FileText className="w-12 h-12 text-gray-400" />
              <div className="text-sm font-medium text-gray-700">
                {file ? file.name : 'Click to select Excel file'}
              </div>
              <div className="text-xs text-gray-500">
                Excel files (.xlsx, .xls) only
              </div>
            </label>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-gray-600">Processing Excel file...</div>
            </div>
          )}

          {/* File Selected Confirmation */}
          {file && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  File selected: {file.name}
                </div>
                <div className="text-xs text-gray-600">
                  File size: {(file.size / 1024).toFixed(2)} KB
                  {parsedData.length > 0 && ` • ${parsedData.length} row${parsedData.length !== 1 ? 's' : ''} found`}
                </div>
              </div>
              
              {/* Preview of parsed data */}
              {parsedData.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-blue-900 mb-2">
                    Preview ({Math.min(parsedData.length, 5)} of {parsedData.length} rows):
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-blue-100">
                        <tr>
                          {Object.keys(parsedData[0] || {}).slice(0, 5).map((key) => (
                            <th key={key} className="px-2 py-1 text-left font-medium text-blue-900">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-200">
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).slice(0, 5).map((value: any, colIdx) => (
                              <td key={colIdx} className="px-2 py-1 text-blue-800">
                                {String(value || '').substring(0, 30)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Excel Format Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-blue-900 mb-2">Expected Excel Format:</div>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>Required columns: <strong>Name</strong>, <strong>Phone</strong>, <strong>Service</strong>, <strong>Address</strong></div>
                  <div>Optional columns: <strong>Approved Credits</strong>, <strong>Used Credits</strong>, <strong>Remaining Credits</strong>, <strong>Status</strong>, <strong>Preferred Staff</strong>, <strong>Preferred Days</strong></div>
                  <div className="mt-2 text-blue-700">
                    The backend will parse the Excel file and validate the data. Results will be shown after import.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isProcessing}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            {isProcessing ? 'Importing...' : 'Import Excel File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
