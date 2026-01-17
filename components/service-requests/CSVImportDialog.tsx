'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, FileText, Loader2, Info, FileCheck } from 'lucide-react';
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
import { importServiceRequests, validateImportData, processCustomers } from '@/lib/actions/serviceRequests.actions';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/authStore';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (importedData?: any[]) => void; // Callback with optional imported data
}

export function CSVImportDialog({ open, onOpenChange, onImport }: CSVImportDialogProps) {
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [parsedData, setParsedData] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [serviceValidation, setServiceValidation] = useState<{ serviceName: string; exists: boolean; serviceId?: number }[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessingCustomers, setIsProcessingCustomers] = useState(false);
  const [customerProcessingResult, setCustomerProcessingResult] = useState<{ created: number; existing: number; errors: string[] } | null>(null);
  
  // Maximum file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const validateAndParseFile = useCallback(async (selectedFile: File) => {
    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      const errorMsg = `File size (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB`;
      setParseError(errorMsg);
      toast.error(errorMsg);
      return false;
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
      const errorMsg = 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed';
      setParseError(errorMsg);
      toast.error(errorMsg);
      return false;
    }

    // Parse Excel file client-side to show preview
    setIsParsing(true);
    setParseError(null);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Excel file contains no sheets');
      }
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      if (!worksheet) {
        throw new Error('Could not read worksheet data');
      }
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error('Excel file contains no data rows');
      }
      
      setParsedData(jsonData);
      setFile(selectedFile);
      setParseError(null);
      return true;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to parse Excel file. Please check the file format.';
      console.error('Error parsing Excel file:', error);
      setParseError(errorMsg);
      toast.error(errorMsg);
      setFile(null);
      setParsedData([]);
      return false;
    } finally {
      setIsParsing(false);
    }
  }, [MAX_FILE_SIZE]);

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setParsedData([]);
      setParseError(null);
      return;
    }

    await validateAndParseFile(selectedFile);
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleImport = async () => {
    if (!file || !parsedData.length) return;
    
    if (!user?.UserID) {
      toast.error('User authentication required. Please log out and log back in.');
      return;
    }

    setIsProcessing(true);
    setIsValidating(true);
    setValidationErrors([]);
    setValidationWarnings([]);
    setServiceValidation([]);
    setCustomerProcessingResult(null);

    try {
      // Step 1: Validate services exist
      console.log('🔍 Step 1: Validating services...');
      toast.loading('Validating services...', { id: 'import-validation' });
      
      // Convert parsedData to plain objects to avoid React Server Action serialization errors
      const plainData = parsedData.map(row => {
        const plainRow: any = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          // Only include primitive values (string, number, boolean, null, undefined)
          if (value === null || value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            plainRow[key] = value;
          } else {
            // Convert other types to string
            plainRow[key] = String(value);
          }
        });
        return plainRow;
      });
      
      const validation = await validateImportData(plainData, user.UserID);
      
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      setServiceValidation(validation.serviceValidation);
      setIsValidating(false);

      if (!validation.isValid) {
        toast.error(`Validation failed: ${validation.errors.length} error(s) found`, { id: 'import-validation' });
        console.error('❌ Validation errors:', validation.errors);
        setIsProcessing(false);
        return;
      }

      if (validation.warnings.length > 0) {
        toast.warning(`${validation.warnings.length} warning(s) found`, { id: 'import-validation' });
      } else {
        toast.success('All services validated successfully', { id: 'import-validation' });
      }

      // Step 2: Process customers (create if needed)
      // NOTE: Frontend customer creation is optional - backend import endpoint handles customer creation
      // We try to create customers here for better UX, but if it fails, we proceed anyway
      console.log('👥 Step 2: Processing customers (optional - backend will also create customers)...');
      setIsProcessingCustomers(true);
      toast.loading('Preparing customers...', { id: 'import-customers' });

      // Use the same plainData to avoid serialization errors
      // IMPORTANT: forceCreateNew=true ensures we create NEW customers with imported names,
      // instead of matching to existing customers by phone number
      // However, if this fails, we'll let the backend handle customer creation
      const customerResult = await processCustomers(plainData, user.UserID, true); // forceCreateNew = true
      setCustomerProcessingResult(customerResult);
      setIsProcessingCustomers(false);

      // Don't block import if customer creation fails - backend will handle it
      if (!customerResult.success) {
        console.warn('⚠️ Frontend customer creation failed, but proceeding with import - backend will create customers:', customerResult.errors);
        toast.warning(
          `Frontend customer creation failed (${customerResult.errors.length} error(s)). Backend will create customers during import.`,
          { id: 'import-customers', duration: 5000 }
        );
        // Continue with import - backend will handle customer creation
      } else {
        toast.success(
          `Customers prepared: ${customerResult.created} created, ${customerResult.existing} existing`,
          { id: 'import-customers' }
        );
      }

      // Step 3: Import service requests
      console.log('📤 Step 3: Importing service requests...');
      toast.loading('Importing service requests...', { id: 'import-requests' });

      // Create FormData with Excel file
      const formData = new FormData();
      formData.append('file', file);

      // Call backend import endpoint with companyAdminId
      const response = await importServiceRequests(formData, user.UserID);

      if (response.Status === 201) {
        const successCount = response.data?.SuccessCount ?? response.data?.success ?? response.data?.count ?? 0;
        
        // Log the full response to see what the backend returns
        console.log('✅ Import successful! Full response:', JSON.stringify(response, null, 2));
        console.log('📊 Import response details:', {
          Status: response.Status,
          Message: response.Message,
          data: response.data,
          hasObject: !!response.Object,
          objectType: typeof response.Object,
          objectIsArray: Array.isArray(response.Object),
          objectLength: Array.isArray(response.Object) ? response.Object.length : 'N/A',
        });
        
        // Check if backend created bookings instead of service requests
        const responseData = response.data || response.Object || {};
        const hasBookings = Array.isArray(responseData) && responseData.length > 0 && responseData[0]?.BookingDate;
        const hasServiceRequests = Array.isArray(responseData) && responseData.length > 0 && !responseData[0]?.BookingDate;
        
        console.log('🔍 Checking import result type:', {
          hasBookings,
          hasServiceRequests,
          dataSample: Array.isArray(responseData) ? responseData[0] : responseData,
          warning: hasBookings ? '⚠️ Backend created BOOKINGS instead of service requests - they may not appear in service requests list' : '✅ Backend created service requests',
        });
        
        // Show success message with summary
        const customerSummary = response.data?.customerProcessing;
        const existingCustomers = customerSummary?.existing || 0;
        const createdCustomers = customerSummary?.created || 0;
        
        let message = `Import completed successfully! ${successCount} record(s) imported.`;
        if (existingCustomers > 0) {
          message += `\n⚠️ ${existingCustomers} customer(s) matched to existing records - names may differ from import file.`;
        }
        if (createdCustomers > 0) {
          message += `\n✅ ${createdCustomers} new customer(s) created.`;
        }
        
        toast.success(
          message,
          { id: 'import-requests', duration: 7000 }
        );
        
        // Show detailed warning if customers were matched
        if (existingCustomers > 0) {
          setTimeout(() => {
            toast.warning(
              `Customer Name Matching: ${existingCustomers} imported customer(s) were matched to existing customers by phone number.`,
              {
                description: 'The imported customer names may differ from your Excel file. Search by phone number, service, or coordinates to find them.',
                duration: 10000
              }
            );
          }, 2000);
        }
        
        // Show customer processing summary if available
        if (customerResult.created > 0 || customerResult.existing > 0) {
          toast.info(
            `Customers: ${customerResult.created} created, ${customerResult.existing} existing`,
            { duration: 4000 }
          );
        }
        
        // Warn if backend created bookings instead of service requests
        if (hasBookings) {
          toast.warning(
            '⚠️ Imported records were converted to bookings immediately. They may appear in the calendar instead of the service requests list. The backend is ignoring the "keepAsPending" parameter.',
            { duration: 8000 }
          );
          console.warn('⚠️ BACKEND BEHAVIOR: Imported records are being converted to bookings immediately despite keepAsPending=true parameter.');
        } else if (successCount > 0) {
          toast.info(
            '✅ Service requests created. They should appear in the service requests list. If they don\'t appear, the backend may be using a different endpoint to store them.',
            { duration: 6000 }
          );
        }
        
        // Show errors if any
        if (response.data?.ErrorLogs && response.data.ErrorLogs.length > 0) {
          const errorCount = response.data.ErrorLogs.length;
          const errorMessages = response.data.ErrorLogs.slice(0, 3).join('; ');
          toast.error(
            `Import failed: ${errorCount} error(s). ${errorMessages}${errorCount > 3 ? '...' : ''}`,
            { duration: 10000 }
          );
          console.error('Import errors:', response.data.ErrorLogs);
        } else if (response.data?.errors && response.data.errors.length > 0) {
          toast.warning(`${response.data.errors.length} error(s) occurred during import`);
          console.warn('Import errors:', response.data.errors);
        }
        
        // Show specific error if import failed
        if (successCount === 0 && (response.data?.ErrorCount ?? 0) > 0) {
          toast.error(
            `Import failed: ${response.data?.ErrorCount ?? 0} error(s). Check console for details.`,
            { duration: 8000 }
          );
        }
        
        // Don't pass parsedData to avoid React Server Action serialization errors
        // Parent will reload from API anyway
        onImport(undefined);
        handleClose();
      } else {
        toast.error(response.Message || 'Import failed. Please check the file format and try again.', { id: 'import-requests' });
      }
    } catch (error: any) {
      console.error('Failed to import service requests:', error);
      toast.error(`Failed to import: ${error.message || 'Unknown error'}`, { id: 'import-requests' });
    } finally {
      setIsProcessing(false);
      setIsValidating(false);
      setIsProcessingCustomers(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setValidationWarnings([]);
    setServiceValidation([]);
    setCustomerProcessingResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-2xl w-[calc(100vw-2rem)] sm:w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col !p-0 !gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Upload className="w-5 h-5 text-gray-700" />
              Import Service Requests from Excel
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              Upload an Excel file to import service requests. Records will be saved as pending service requests and can be dispatched later.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* File Selection with Drag and Drop */}
          <div
            ref={dropZoneRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all
              ${dragActive 
                ? 'border-primary-500 bg-primary-50' 
                : file 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }
              ${isParsing ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
              id="excel-file-input"
              disabled={isParsing}
            />
            <label
              htmlFor="excel-file-input"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                  <div className="text-sm font-medium text-gray-700">Parsing file...</div>
                </>
              ) : file ? (
                <>
                  <FileCheck className="w-10 h-10 text-green-600" />
                  <div className="text-sm font-semibold text-gray-900">{file.name}</div>
                  <div className="text-xs text-gray-600">
                    Click to select a different file
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-gray-100 p-4">
                    <Upload className="w-8 h-8 text-gray-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-gray-900">
                      Click to upload or drag and drop
                    </div>
                    <div className="text-xs text-gray-500">
                      Excel files (.xlsx, .xls) up to 10MB
                    </div>
                  </div>
                </>
              )}
            </label>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-900">File Error</div>
                <div className="text-xs text-red-700 mt-1">{parseError}</div>
              </div>
            </div>
          )}

          {/* File Selected Confirmation */}
          {file && !isParsing && (
            <div className="space-y-4">
              {/* File Info Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {file.name}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
                        <span>Size: {(file.size / 1024).toFixed(2)} KB</span>
                        {parsedData.length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            {parsedData.length} row{parsedData.length !== 1 ? 's' : ''} found
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {file && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setParsedData([]);
                        setParseError(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Preview of parsed data */}
              {parsedData.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-900">
                          Preview ({Math.min(parsedData.length, 5)} of {parsedData.length} rows)
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {Object.keys(parsedData[0] || {}).length} columns
                      </span>
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    <table className="w-full text-[10px] border-collapse">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          {Object.keys(parsedData[0] || {}).slice(0, 4).map((key) => (
                            <th key={key} className="px-2 py-1.5 text-left font-semibold text-gray-700 border-b border-gray-200 truncate max-w-[120px]">
                              {key}
                            </th>
                          ))}
                          {Object.keys(parsedData[0] || {}).length > 4 && (
                            <th className="px-2 py-1.5 text-left font-semibold text-gray-500 border-b border-gray-200 text-[10px]">
                              +{Object.keys(parsedData[0] || {}).length - 4}
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            {Object.values(row).slice(0, 4).map((value: any, colIdx) => (
                              <td key={colIdx} className="px-2 py-1.5 text-gray-700">
                                <span className="truncate block max-w-[120px]" title={String(value || '')}>
                                  {String(value || '').substring(0, 30)}
                                  {String(value || '').length > 30 ? '...' : ''}
                                </span>
                              </td>
                            ))}
                            {Object.keys(parsedData[0] || {}).length > 4 && (
                              <td className="px-2 py-1.5 text-gray-400 text-[10px]">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Excel Format Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-blue-900 mb-2">Expected Excel Format</div>
                    <div className="text-xs text-blue-800 space-y-2">
                      <div>
                        <span className="font-medium">Required columns (Step 1):</span>
                        <div className="ml-2 mt-1 space-y-0.5 text-xs">
                          <div>• <span className="font-semibold">Name</span> - Customer name</div>
                          <div>• <span className="font-semibold">MobileNumber</span> or <span className="font-semibold">Mobile_Number</span> - Phone number (backend expects MobileNumber, NOT "Phone")</div>
                          <div>• <span className="font-semibold">Country Code</span> - ISO country code (e.g., "US", "SA", "GB")</div>
                          <div>• <span className="font-semibold">Address</span> or <span className="font-semibold">Location</span> - Full address as plain text (NOT JSON)</div>
                          <div>• <span className="font-semibold">ApprovedService</span> or <span className="font-semibold">Approved Service</span> - Service name as plain text (backend expects ApprovedService, NOT "Service", must exist in Services page)</div>
                          <div>• <span className="font-semibold">Recurring Period</span> - Format: "30 days", "1 month", "2 weeks" (NOT separate value/unit fields)</div>
                          <div>• <span className="font-semibold">Expiry Date</span> - Date in format: YYYY-MM-DD</div>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Optional columns (Step 2 & 3):</span>
                        <div className="ml-2 mt-1 space-y-0.5 text-xs">
                          <div>• <span className="font-semibold">ApprovedCount</span> or <span className="font-semibold">Approved_Count</span> - Number of approved credits (backend requires this, must be &gt; 0, NOT "Approved Credits")</div>
                          <div>• <span className="font-semibold">Used_Count</span> - Number of used credits (NOT "Used Credits")</div>
                          <div>• <span className="font-semibold">Remaining_Count</span> - Number of remaining credits (NOT "Remaining Credits")</div>
                          <div>• <span className="font-semibold">Notes</span> - Additional notes</div>
                          <div>• <span className="font-semibold">Start Time</span> - Format: HH:MM (e.g., "09:00")</div>
                          <div>• <span className="font-semibold">End Time</span> - Format: HH:MM (e.g., "17:00")</div>
                          <div>• <span className="font-semibold">Preferred Staff</span> - Comma-separated provider IDs (e.g., "123,456")</div>
                          <div>• <span className="font-semibold">Preferred Days</span> - Comma-separated days (e.g., "Monday,Wednesday,Friday")</div>
                          <div>• <span className="font-semibold">Lat</span> - Latitude (optional, for location)</div>
                          <div>• <span className="font-semibold">Lng</span> - Longitude (optional, for location)</div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200 text-blue-700 space-y-1">
                        <div>
                          <strong>Import Workflow:</strong>
                        </div>
                        <div className="ml-2 space-y-0.5 text-[11px]">
                          <div>1. Validates all services exist in Services page</div>
                          <div>2. Creates new customers if they don't exist (by phone + country code)</div>
                          <div>3. Creates service requests with all provided information</div>
                          <div>4. Service requests are saved as pending (not converted to bookings)</div>
                        </div>
                        <div className="mt-2">
                          <strong>Note:</strong> Imported records will be saved as pending service requests. Use "Run Auto Dispatch" to convert them to bookings.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <div className="text-sm font-medium text-gray-700">Importing service requests...</div>
              <div className="text-xs text-gray-500">This may take a few moments</div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex-shrink-0 border-t border-gray-200 bg-gray-50">
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                !file ||
                isProcessing ||
                isParsing ||
                !!parseError ||
                validationErrors.length > 0 ||
                !user?.UserID
              }
              className="bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isValidating
                    ? 'Validating...'
                    : isProcessingCustomers
                    ? 'Processing customers...'
                    : 'Importing...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {parsedData.length > 0 ? `${parsedData.length} ` : ''}Service Request{parsedData.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
