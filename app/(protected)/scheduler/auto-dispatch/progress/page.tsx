'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import type { DispatchProgress, DispatchProgressItem, DispatchProgressStatus } from '@/lib/types/dispatchLog.types';
import type { ServiceRequest } from '@/lib/types/serviceRequest.types';

export default function AutoDispatchProgressPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<DispatchProgress | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);


  // Load real API results from sessionStorage
  useEffect(() => {
    // Prevent re-initialization if already initialized
    if (isInitialized) return;

    // Get service requests and API response from sessionStorage
    const serviceIdsJson = sessionStorage.getItem('autoDispatchServiceIds');
    const servicesJson = sessionStorage.getItem('autoDispatchServices');
    const responseJson = sessionStorage.getItem('autoDispatchResponse');
    
    if (!serviceIdsJson || !servicesJson) {
      router.push('/scheduler/service-requests');
      return;
    }

    try {
      const serviceIds: string[] = JSON.parse(serviceIdsJson);
      const services: ServiceRequest[] = JSON.parse(servicesJson);
      const apiResponse = responseJson ? JSON.parse(responseJson) : null;
      
      setIsInitialized(true);

      // Create progress items from real service requests
      const initialItems: DispatchProgressItem[] = services.map((service) => {
        // Determine status based on API response
        // If API was successful, mark as completed; otherwise check for errors
        let status: DispatchProgressStatus = 'Processing';
        
        if (apiResponse) {
          if (apiResponse.Status === 201) {
            // Success - mark as completed
            status = 'Completed';
          } else {
            // Failed - mark as failed
            status = 'Failed';
          }
        }

        return {
          serviceId: service.id,
          serviceName: service.service,
          customerName: service.name,
          status,
          assignedProvider: status === 'Completed' ? 'Provider Assigned' : undefined,
          completedAt: status === 'Completed' ? new Date().toISOString() : undefined,
          failureReason: status === 'Failed' ? (apiResponse?.Message || 'Auto Dispatch failed') : undefined,
        };
      });

      const initialProgress: DispatchProgress = {
        id: `progress-${Date.now()}`,
        startedAt: new Date().toISOString(),
        items: initialItems,
        isComplete: apiResponse ? true : false, // Mark complete if we have API response
      };

      setProgress(initialProgress);

      // If API response shows errors, update items accordingly
      if (apiResponse && apiResponse.data?.ErrorLogs && Array.isArray(apiResponse.data.ErrorLogs)) {
        // Update failed items with error details
        const errorLogs = apiResponse.data.ErrorLogs;
        setProgress((prev) => {
          if (!prev) return null;
          const updatedItems = prev.items.map((item, index) => {
            if (errorLogs[index]) {
              return {
                ...item,
                status: 'Failed' as DispatchProgressStatus,
                failureReason: errorLogs[index],
              };
            }
            return item;
          });
          return {
            ...prev,
            items: updatedItems,
          };
        });
      }
    } catch (error) {
      console.error('Failed to parse dispatch data:', error);
      router.push('/scheduler/service-requests');
    }
  }, [router, isInitialized]);

  const getStatusIcon = (status: DispatchProgressStatus) => {
    switch (status) {
      case 'Processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'Completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'Failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: DispatchProgressStatus) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'Processing':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case 'Completed':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'Failed':
        return `${baseClasses} bg-red-100 text-red-700`;
    }
  };

  if (!progress) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
        </div>
      </div>
    );
  }

  const processingCount = progress.items.filter((i) => i.status === 'Processing').length;
  const completedCount = progress.items.filter((i) => i.status === 'Completed').length;
  const failedCount = progress.items.filter((i) => i.status === 'Failed').length;
  const isComplete = progress.isComplete;

  // Download full report as CSV
  const handleDownloadReport = () => {
    if (!progress) return;

    const csvRows = [
      ['Service Name', 'Customer Name', 'Status', 'Assigned Provider', 'Completed At', 'Failure Reason'],
      ...progress.items.map((item) => [
        item.serviceName,
        item.customerName,
        item.status,
        item.assignedProvider || '—',
        item.completedAt ? new Date(item.completedAt).toLocaleString() : '—',
        item.failureReason || '—',
      ]),
    ];

    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auto-dispatch-report-${progress.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download failed services only as CSV
  const handleDownloadFailed = () => {
    if (!progress) return;

    const failedItems = progress.items.filter((item) => item.status === 'Failed');
    if (failedItems.length === 0) {
      alert('No failed services to download.');
      return;
    }

    const csvRows = [
      ['Service Name', 'Customer Name', 'Failure Reason'],
      ...failedItems.map((item) => [
        item.serviceName,
        item.customerName,
        item.failureReason || 'Unknown error',
      ]),
    ];

    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auto-dispatch-failed-${progress.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/scheduler/service-requests')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Service Requests
        </button>
        <DashboardHeader
          title={isComplete ? 'Auto Dispatch – Result Summary' : 'Auto Dispatch – In Progress'}
          description={
            isComplete
              ? `Dispatch completed. ${completedCount} completed, ${failedCount} failed.`
              : `Processing ${progress.items.length} service${progress.items.length !== 1 ? 's' : ''}...`
          }
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-[0px_4px_24px_-2px_rgba(16,24,40,0.01),_0px_2px_24px_-2px_rgba(16,24,40,0.06)]">
          <div className="text-sm text-gray-600 mb-1">Total Selected</div>
          <div className="text-2xl font-bold text-gray-900">{progress.items.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4 bg-green-50 shadow-[0px_4px_24px_-2px_rgba(16,24,40,0.01),_0px_2px_24px_-2px_rgba(16,24,40,0.06)]">
          <div className="text-sm text-green-700 mb-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Completed
          </div>
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4 bg-red-50 shadow-[0px_4px_24px_-2px_rgba(16,24,40,0.01),_0px_2px_24px_-2px_rgba(16,24,40,0.06)]">
          <div className="text-sm text-red-700 mb-1 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Failed
          </div>
          <div className="text-2xl font-bold text-red-600">{failedCount}</div>
        </div>
      </div>

      {/* Result Summary Actions - Only show when complete */}
      {isComplete && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-[0px_4px_24px_-2px_rgba(16,24,40,0.01),_0px_2px_24px_-2px_rgba(16,24,40,0.06)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Download Reports</h3>
              <p className="text-xs text-gray-600">
                Export the dispatch results for your records or further analysis.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Full Report (CSV)
              </button>
              {failedCount > 0 && (
                <button
                  onClick={handleDownloadFailed}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Failed Only (CSV)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-[0px_4px_24px_-2px_rgba(16,24,40,0.01),_0px_2px_24px_-2px_rgba(16,24,40,0.06)] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Services</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {progress.items.map((item) => (
            <div key={item.serviceId} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="font-medium text-gray-900">{item.serviceName}</div>
                      <div className="text-sm text-gray-500">{item.customerName}</div>
                    </div>
                  </div>
                  {item.status === 'Failed' && item.failureReason && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm font-medium text-red-900 mb-1">Failure Reason:</div>
                      <div className="text-sm text-red-700">{item.failureReason}</div>
                    </div>
                  )}
                  {item.status === 'Completed' && item.assignedProvider && (
                    <div className="mt-2 text-sm text-gray-600">
                      Assigned to: <span className="font-medium">{item.assignedProvider}</span>
                    </div>
                  )}
                </div>
                <div>
                  <span className={getStatusBadge(item.status)}>{item.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Back to Service Requests CTA - Only show when complete */}
      {isComplete && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => router.push('/scheduler/service-requests')}
            className="px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Service Requests
          </button>
        </div>
      )}
    </div>
  );
}
