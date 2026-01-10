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
import { parseCSV, validateAndMapServiceRequests, readFileAsText, type CSVParseResult, type ServiceRequestCSVRow } from '@/lib/utils/csv-import';
import type { ServiceRequest } from '@/lib/types/serviceRequest.types';
import { importServiceRequests } from '@/lib/actions/serviceRequests.actions';
import { toast } from 'sonner';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void; // Changed to callback to trigger reload instead of passing data
}

export function CSVImportDialog({ open, onOpenChange, onImport }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult<ServiceRequestCSVRow> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setParseResult(null);
      return;
    }

    // Validate file type
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.type.includes('csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const content = await readFileAsText(selectedFile);
      const csvRows = parseCSV(content);
      const result = validateAndMapServiceRequests(csvRows);
      setParseResult(result);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Failed to parse CSV file. Please check the file format.');
      setFile(null);
      setParseResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.data.length === 0 || !file) return;

    setIsProcessing(true);
    try {
      // Create FormData with CSV file
      const formData = new FormData();
      formData.append('file', file);

      // Call backend import endpoint
      const response = await importServiceRequests(formData);

      if (response.Status === 201) {
        const successCount = response.data?.success || parseResult.data.length;
        toast.success(`Successfully imported ${successCount} service request${successCount !== 1 ? 's' : ''}`);
        
        // Show errors if any
        if (response.data?.errors && response.data.errors.length > 0) {
          toast.warning(`${response.data.errors.length} error${response.data.errors.length !== 1 ? 's' : ''} occurred during import`);
          console.warn('Import errors:', response.data.errors);
        }
        
        // Trigger reload of service requests
        onImport();
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
    setParseResult(null);
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
            Import Service Requests from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import service requests. The CSV should include columns for Name, Phone, Service, and Address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <FileText className="w-12 h-12 text-gray-400" />
              <div className="text-sm font-medium text-gray-700">
                {file ? file.name : 'Click to select CSV file'}
              </div>
              <div className="text-xs text-gray-500">
                CSV files only
              </div>
            </label>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-gray-600">Processing CSV file...</div>
            </div>
          )}

          {/* Parse Results */}
          {parseResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  {parseResult.data.length} row{parseResult.data.length !== 1 ? 's' : ''} parsed successfully
                </div>
                {parseResult.errors.length > 0 && (
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {parseResult.errors.length} error{parseResult.errors.length !== 1 ? 's' : ''} found
                  </div>
                )}
                {parseResult.warnings.length > 0 && (
                  <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
                    <AlertCircle className="w-4 h-4" />
                    {parseResult.warnings.length} warning{parseResult.warnings.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-red-900 mb-2">Errors:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {parseResult.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-700">
                        Row {error.row}, {error.field}: {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-yellow-900 mb-2">Warnings:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {parseResult.warnings.map((warning, index) => (
                      <div key={index} className="text-xs text-yellow-700">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parseResult.data.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
                    Preview (first 5 rows)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Phone</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Service</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parseResult.data.slice(0, 5).map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-900">{row.name}</td>
                            <td className="px-3 py-2 text-gray-600">{row.phone}</td>
                            <td className="px-3 py-2 text-gray-600">{row.service}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                row.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                row.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                row.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {row.status || 'Draft'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parseResult.data.length > 5 && (
                      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                        ... and {parseResult.data.length - 5} more row{parseResult.data.length - 5 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CSV Format Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-blue-900 mb-2">Expected CSV Format:</div>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>Required columns: <strong>Name</strong>, <strong>Phone</strong>, <strong>Service</strong>, <strong>Address</strong></div>
                  <div>Optional columns: <strong>Approved Credits</strong>, <strong>Used Credits</strong>, <strong>Remaining Credits</strong>, <strong>Status</strong>, <strong>Preferred Staff</strong> (comma-separated), <strong>Preferred Days</strong> (comma-separated)</div>
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
            disabled={!parseResult || parseResult.data.length === 0 || parseResult.errors.length > 0 || isProcessing}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            {isProcessing ? 'Importing...' : `Import ${parseResult?.data.length || 0} Request${parseResult?.data.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
