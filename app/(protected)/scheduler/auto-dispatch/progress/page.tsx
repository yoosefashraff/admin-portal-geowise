'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import type { DispatchProgress, DispatchProgressItem, DispatchProgressStatus } from '@/lib/types/dispatchLog.types';
import type { ServiceRequest } from '@/lib/types/serviceRequest.types';
import { updateApprovedUserCredit } from '@/lib/actions/approvedUserCredits.actions';

export default function AutoDispatchProgressPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<DispatchProgress | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Simulate dispatch progress with delays
  const simulateDispatchProgress = useCallback(async (initialProgress: DispatchProgress, services: ServiceRequest[]) => {

    // Process each item with delays
    initialProgress.items.forEach((item, index) => {
      setTimeout(async () => {
        // Get the service for this item
        const service = services[index];
        
        // Mock behavior: first service (index 0) completes, second (index 1) fails, rest succeed
        const isFirst = index === 0;
        const isSecond = index === 1;
        
        let updatedItem: DispatchProgressItem;
        
        if (isFirst) {
          // First service - COMPLETE
          updatedItem = {
            ...item,
            status: 'Completed',
            assignedProvider: `Provider ${index + 1}`,
            completedAt: new Date().toISOString(),
          };
        } else if (isSecond) {
          // Second service - FAIL
          updatedItem = {
            ...item,
            status: 'Failed',
            failureReason: 'No available providers in the service area',
          };
        } else {
          // All other services - COMPLETE
          updatedItem = {
            ...item,
            status: 'Completed',
            assignedProvider: `Provider ${index + 1}`,
            completedAt: new Date().toISOString(),
          };
        }

        // Update credits when service is successfully dispatched
        if (updatedItem.status === 'Completed' && service?.userId && service?.serviceId && service?.approvedUserCreditId) {
          try {
            // Deduct 1 credit per service (or use actual credit deduction amount from service)
            const creditDeduction = 1; // TODO: Get actual credit deduction from service request
            
            await updateApprovedUserCredit({
              Id: service.approvedUserCreditId,
              UserId: service.userId,
              ServiceId: service.serviceId,
              ApprovedCredits: service.credits.approved,
              UsedCredits: (service.credits.used || 0) + creditDeduction,
              RemainingCredits: (service.credits.remaining || 0) - creditDeduction,
              StartDate: service.credits.approved ? new Date().toISOString() : new Date().toISOString(), // Use actual StartDate from credit if available
              EndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Use actual EndDate from credit if available
              RecurringPeriod: 1, // Use actual RecurringPeriod from credit if available
              IsActive: true,
            });
            console.log(`Credits updated for service ${service.id}`);
          } catch (error) {
            console.error('Failed to update credits after dispatch:', error);
            // Don't fail the dispatch if credit update fails, just log it
          }
        }

        setProgress((prev) => {
          if (!prev) return null;
          
          // Create a new items array with updated item
          const updatedItems = prev.items.map((prevItem, prevIndex) => {
            if (prevIndex === index) {
              return updatedItem;
            }
            return prevItem;
          });

          // Check if all items are done (not processing anymore)
          const allDone = updatedItems.every((i) => i.status !== 'Processing');
          const isComplete = allDone;

          return {
            ...prev,
            items: updatedItems,
            isComplete,
          };
        });
      }, (index + 1) * 2000); // 2 seconds per item
    });
  }, [router]);

  // Mock service requests data (using selected IDs from router state)
  useEffect(() => {
    // Prevent re-initialization if already initialized
    if (isInitialized) return;

    // Get service IDs from sessionStorage (passed from service requests page)
    const serviceIdsJson = sessionStorage.getItem('autoDispatchServiceIds');
    if (!serviceIdsJson) {
      router.push('/scheduler/service-requests');
      return;
    }

    try {
      const serviceIds: string[] = JSON.parse(serviceIdsJson);
      setIsInitialized(true); // Mark as initialized before removing from storage
      // Don't remove sessionStorage here - keep it so page can stay after completion

      // Create mock service requests based on selected IDs
      const mockServices: ServiceRequest[] = serviceIds.map((id, index) => ({
        id,
        name: `Customer ${index + 1}`,
        phone: `+1 (555) ${100 + index}-${1000 + index}`,
        service: `Service Type ${index + 1}`,
        address: `${100 + index} Main Street, City, State ${10000 + index}`,
        credits: {
          approved: 500 + index * 100,
          used: 100 + index * 50,
          remaining: 400 + index * 50,
        },
        preferredStaff: [`Provider ${index + 1}`],
        preferredDays: ['Monday', 'Wednesday', 'Friday'],
        status: 'Approved' as const,
        userId: 1000 + index,
        serviceId: 2000 + index,
        approvedUserCreditId: 3000 + index, // Mock credit ID for testing
      }));

      // Create initial progress state
      const initialItems: DispatchProgressItem[] = mockServices.map((service) => ({
        serviceId: service.id,
        serviceName: service.service,
        customerName: service.name,
        status: 'Processing' as DispatchProgressStatus,
      }));

      const initialProgress: DispatchProgress = {
        id: `progress-${Date.now()}`,
        startedAt: new Date().toISOString(),
        items: initialItems,
        isComplete: false,
      };

      setProgress(initialProgress);

      // Simulate dispatch progress with mock data
      simulateDispatchProgress(initialProgress, mockServices);
    } catch (error) {
      console.error('Failed to parse service IDs:', error);
      router.push('/scheduler/service-requests');
    }
  }, [router, simulateDispatchProgress, isInitialized]);

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
