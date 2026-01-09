import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Download, FileSpreadsheet } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import type { DispatchProgress, DispatchProgressItem, DispatchProgressStatus } from '../types/dispatchLog'
import type { ServiceRequest } from '../types/serviceRequest'
import { updateApprovedUserCredit } from '../services/approvedUserCreditsService'
import { fetchServiceRequests } from '../services/serviceRequestsService'

export default function AutoDispatchProgress() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [progress, setProgress] = useState<DispatchProgress | null>(null)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])

  // Get service IDs from navigation state
  const serviceIds = (location.state as { serviceIds?: string[] })?.serviceIds || []

  // Fetch service requests from API
  useEffect(() => {
    const loadServiceRequests = async () => {
      try {
        const bookings = await fetchServiceRequests()
        // Map API bookings to ServiceRequest format (same mapping as ServiceRequests page)
        const mappedRequests: ServiceRequest[] = bookings.map((booking, index) => ({
          id: String(booking.id || index),
          name: booking.customerName || 'Unknown Customer',
          phone: booking.customerPhone || '',
          service: booking.serviceName || 'Unknown Service',
          address: booking.address || '',
          credits: {
            approved: 0,
            used: 0,
            remaining: 0,
          },
          preferredStaff: booking.preferredStaff || [],
          preferredDays: booking.preferredDays || [],
          status: (booking.status === 'Approved' || booking.status === 'Confirmed') 
            ? 'Approved' 
            : booking.status === 'Pending' 
            ? 'Pending' 
            : 'Draft',
          userId: booking.userId,
          serviceId: booking.serviceId,
          approvedUserCreditId: booking.approvedUserCreditId,
        }))
        setServiceRequests(mappedRequests)
      } catch (error) {
        console.error('Failed to load service requests:', error)
        // On error, use empty array - will show error in UI
        setServiceRequests([])
      }
    }

    loadServiceRequests()
  }, [])

  // Initialize progress
  useEffect(() => {
    if (serviceIds.length === 0) {
      // No services selected, redirect back
      navigate('/service-requests')
      return
    }

    if (serviceRequests.length === 0) {
      // Still loading service requests, wait
      return
    }

    // Create initial progress state
    const selectedServices = serviceRequests.filter((s) => serviceIds.includes(s.id))
    
    if (selectedServices.length === 0) {
      // Selected services not found, redirect back
      console.warn('Selected services not found in fetched data')
      navigate('/service-requests')
      return
    }
    const initialItems: DispatchProgressItem[] = selectedServices.map((service) => ({
      serviceId: service.id,
      serviceName: service.service,
      customerName: service.name,
      status: 'Processing' as DispatchProgressStatus,
    }))

    const initialProgress: DispatchProgress = {
      id: `progress-${Date.now()}`,
      startedAt: new Date().toISOString(),
      items: initialItems,
      isComplete: false,
    }

    setProgress(initialProgress)

    // Simulate dispatch progress
    simulateDispatchProgress(initialProgress, selectedServices)
  }, [serviceIds, serviceRequests, navigate])

  // Simulate dispatch progress with delays
  const simulateDispatchProgress = (initialProgress: DispatchProgress, services: ServiceRequest[]) => {
    const items = [...initialProgress.items]
    let completedCount = 0

    // Process each item with delays
    items.forEach((item, index) => {
      setTimeout(() => {
        // Deterministic behavior: first service completes, second fails
        // First service (index 0) succeeds, second service (index 1) fails, rest succeed
        const success = index !== 1
        const service = services[index]

        if (success) {
          item.status = 'Completed'
          item.assignedProvider = 'Provider ' + (index + 1)
          item.completedAt = new Date().toISOString()

          // Update credits via API when service is successfully dispatched
          // TODO: Uncomment and configure once we have:
          // - userId, serviceId, approvedUserCreditId from service request
          // - StartDate and EndDate values
          // - Credit deduction amount (currently assuming 1 credit per service)
          if (service?.userId && service?.serviceId && service?.approvedUserCreditId) {
            updateApprovedUserCredit({
              Id: service.approvedUserCreditId,
              UserId: service.userId,
              ServiceId: service.serviceId,
              ApprovedCredits: service.credits.approved,
              UsedCredits: service.credits.used + 1, // Deduct 1 credit per service
              RemainingCredits: service.credits.remaining - 1,
              StartDate: new Date().toISOString(), // TODO: Get actual StartDate from service request
              EndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // TODO: Get actual EndDate from service request
              RecurringPeriod: 1, // TODO: Get from service request
              IsActive: true,
            }).catch((error) => {
              console.error('Failed to update credits after dispatch:', error)
              // Optionally show error to user or retry
            })
          }
        } else {
          item.status = 'Failed'
          // Failure reason for second service
          const reasons = [
            'No available providers in the service area',
            'Invalid time window specified',
            'Missing location information',
            'Service zone mismatch',
            'Provider availability conflict',
          ]
          // Use a specific reason for the second service (index 1)
          item.failureReason = reasons[index % reasons.length] || reasons[0]
        }

        completedCount++
        const isComplete = completedCount === items.length

        setProgress((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            items: [...items],
            isComplete,
          }
        })

        // Don't navigate - show result summary on same page
      }, (index + 1) * 2000) // 2 seconds per item
    })
  }

  const getStatusIcon = (status: DispatchProgressStatus) => {
    switch (status) {
      case 'Processing':
        return <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
      case 'Completed':
        return <CheckCircle2 className="w-5 h-5 text-success-600" />
      case 'Failed':
        return <XCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getStatusBadge = (status: DispatchProgressStatus) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium'
    switch (status) {
      case 'Processing':
        return `${baseClasses} bg-blue-100 text-blue-700`
      case 'Completed':
        return `${baseClasses} bg-success-100 text-success-700`
      case 'Failed':
        return `${baseClasses} bg-red-100 text-red-700`
    }
  }

  if (!progress) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  const processingCount = progress.items.filter((i) => i.status === 'Processing').length
  const completedCount = progress.items.filter((i) => i.status === 'Completed').length
  const failedCount = progress.items.filter((i) => i.status === 'Failed').length
  const isComplete = progress.isComplete

  // Download full report as CSV
  const handleDownloadReport = () => {
    if (!progress) return

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
    ]

    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `auto-dispatch-report-${progress.id}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Download failed services only as CSV
  const handleDownloadFailed = () => {
    if (!progress) return

    const failedItems = progress.items.filter((item) => item.status === 'Failed')
    if (failedItems.length === 0) {
      alert('No failed services to download.')
      return
    }

    const csvRows = [
      ['Service Name', 'Customer Name', 'Failure Reason'],
      ...failedItems.map((item) => [
        item.serviceName,
        item.customerName,
        item.failureReason || 'Unknown error',
      ]),
    ]

    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `auto-dispatch-failed-${progress.id}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/service-requests')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Services Requests
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {isComplete ? 'Auto Dispatch – Result Summary' : 'Auto Dispatch – In Progress'}
              </h1>
              <p className="text-sm text-gray-600">
                {isComplete
                  ? `Dispatch completed. ${completedCount} completed, ${failedCount} failed.`
                  : `Processing ${progress.items.length} service${progress.items.length !== 1 ? 's' : ''}...`}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Total Selected</div>
                <div className="text-2xl font-bold text-gray-900">{progress.items.length}</div>
              </div>
              <div className="bg-white rounded-lg border border-success-200 p-4 bg-success-50">
                <div className="text-sm text-success-700 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </div>
                <div className="text-2xl font-bold text-success-600">{completedCount}</div>
              </div>
              <div className="bg-white rounded-lg border border-red-200 p-4 bg-red-50">
                <div className="text-sm text-red-700 mb-1 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Failed
                </div>
                <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              </div>
            </div>

            {/* Result Summary Actions - Only show when complete */}
            {isComplete && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Download Reports</h3>
                    <p className="text-xs text-gray-600">
                      Export the dispatch results for your records or further analysis.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
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
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Services</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {progress.items.map((item) => (
                  <div key={item.serviceId} className="p-4">
                    <div className="flex items-start justify-between">
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
                            <div className="text-sm text-red-700 mb-2">{item.failureReason}</div>
                            <div className="flex items-center gap-2">
                              <button
                                className="text-xs text-red-700 hover:text-red-900 underline"
                                onClick={() => {
                                  // TODO: Implement "Fix issue" functionality
                                  alert('Fix issue functionality to be implemented')
                                }}
                              >
                                Fix issue
                              </button>
                            </div>
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

            {/* Back to Services Requests CTA - Only show when complete */}
            {isComplete && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => navigate('/service-requests')}
                  className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Back to Services Requests
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
