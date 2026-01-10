'use client';

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Upload, Download, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import ServicesRequestsTable from '@/components/service-requests/ServicesRequestsTable'
import LogsTable from '@/components/service-requests/LogsTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { ServiceRequest } from '@/lib/types/serviceRequest.types'
import type { DispatchLog } from '@/lib/types/dispatchLog.types'
import { fetchServiceRequests, fetchDispatchLogs } from '@/lib/actions/serviceRequests.actions'
import { listApprovedUserCredits } from '@/lib/actions/approvedUserCredits.actions'
import { useAuthStore } from '@/lib/store/authStore'
import { toast } from 'sonner'
import { ServiceRequestsSkeleton } from '@/components/skeleton/ServiceRequestsSkeleton'
import { CSVImportDialog } from '@/components/service-requests/CSVImportDialog'

export default function ServiceRequestsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'services' | 'logs'>('services')
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [logs, setLogs] = useState<DispatchLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [dispatchTypeFilter, setDispatchTypeFilter] = useState<'All' | 'Manual' | 'Auto'>('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const itemsPerPage = 10

  // Fetch service requests from API
  useEffect(() => {
    const loadServiceRequests = async () => {
      if (!user) return
      
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetchServiceRequests(
          undefined,
          undefined,
          false,
          user.UserID
        )
        
        if (response.Status !== 201) {
          // Check if it's an authentication error
          if (response.Status === 401 || response.Status === 403) {
            toast.error('Authentication failed. Please log in again.')
            router.push('/login')
            return
          }
          throw new Error(response.Message || 'Failed to fetch service requests')
        }

        // Fetch user credits to merge with service requests
        let creditsMap = new Map<number, { approved: number; used: number; remaining: number; creditId?: number }>()
        try {
          const creditsResponse = await listApprovedUserCredits({ IsActive: true })
          if (creditsResponse.Status === 201 && creditsResponse.data && Array.isArray(creditsResponse.data)) {
            creditsResponse.data.forEach((credit) => {
              if (credit.UserId && credit.ServiceId) {
                // Use UserId as key to map credits to bookings
                creditsMap.set(credit.UserId, {
                  approved: credit.ApprovedCredits,
                  used: credit.UsedCredits || 0,
                  remaining: credit.RemainingCredits || 0,
                  creditId: credit.Id,
                })
              }
            })
          }
        } catch (creditsError) {
          // Only log if it's not a JSON parsing error (which is expected if API returns HTML)
          if (creditsError instanceof SyntaxError && creditsError.message?.includes('JSON')) {
            console.warn('API returned HTML instead of JSON (may need authentication or correct endpoint):', creditsError.message)
          } else {
            console.warn('Failed to fetch credits, continuing without credit data:', creditsError)
          }
        }

        // Map API bookings to ServiceRequest format
        const bookings = response.Object || []
        const mappedRequests: ServiceRequest[] = bookings.map((booking: any, index: number) => {
          const userId = booking.userId || (typeof booking.id === 'number' ? booking.id : undefined)
          const creditInfo = userId && creditsMap.has(userId) 
            ? creditsMap.get(userId)! 
            : { approved: 0, used: 0, remaining: 0 }

          return {
            id: String(booking.id || index),
            name: booking.customerName || 'Unknown Customer',
            phone: booking.customerPhone || '',
            service: booking.serviceName || 'Unknown Service',
            address: booking.address || '',
            credits: {
              approved: creditInfo.approved,
              used: creditInfo.used,
              remaining: creditInfo.remaining,
            },
            preferredStaff: booking.preferredStaff || [],
            preferredDays: booking.preferredDays || [],
            status: (booking.status === 'Approved' || booking.status === 'Confirmed') 
              ? 'Approved' 
              : booking.status === 'Pending' 
              ? 'Pending' 
              : 'Draft',
            userId: userId,
            serviceId: booking.serviceId,
            approvedUserCreditId: creditInfo.creditId,
          }
        })

        setRequests(mappedRequests)
      } catch (err) {
        console.error('Failed to load service requests:', err)
        setError(err instanceof Error ? err.message : 'Failed to load service requests')
        toast.error('Failed to load service requests')
      } finally {
        setIsLoading(false)
      }
    }

    loadServiceRequests()
  }, [user])

  // Fetch dispatch logs from API
  useEffect(() => {
    const loadDispatchLogs = async () => {
      if (!user) return
      
      setIsLoadingLogs(true)
      setLogsError(null)
      try {
        const response = await fetchDispatchLogs(30, false, user.UserID)
        
        if (response.Status !== 201) {
          // Check if it's an authentication error
          if (response.Status === 401 || response.Status === 403) {
            toast.error('Authentication failed. Please log in again.')
            router.push('/login')
            return
          }
          throw new Error(response.Message || 'Failed to fetch dispatch logs')
        }

        const bookings = response.Object || []
        const mappedLogs: DispatchLog[] = bookings
          .filter((booking: any) => {
            return booking.status && (
              booking.status === 'Dispatched' ||
              booking.status === 'In Progress' ||
              booking.status === 'Completed' ||
              booking.status === 'Failed' ||
              booking.status === 'Confirmed'
            )
          })
          .map((booking: any, index: number) => {
            const dispatchType: 'Auto' | 'Manual' = booking.dispatchType || 
              (booking.status === 'Confirmed' ? 'Auto' : 'Manual')
            
            let dispatchStatus: 'Dispatched' | 'In Progress' | 'Failed' | 'Completed' = 'Dispatched'
            if (booking.status === 'Completed' || booking.status === 'Confirmed') {
              dispatchStatus = 'Completed'
            } else if (booking.status === 'In Progress') {
              dispatchStatus = 'In Progress'
            } else if (booking.status === 'Failed') {
              dispatchStatus = 'Failed'
            }

            let dateTime = ''
            if (booking.dateTime) {
              dateTime = booking.dateTime
            } else if (booking.createdAt) {
              const date = new Date(booking.createdAt)
              dateTime = date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            } else {
              dateTime = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            }

            return {
              id: String(booking.id || index),
              serviceName: booking.serviceName || 'Unknown Service',
              customerName: booking.customerName || 'Unknown Customer',
              dispatchType,
              dispatchStatus,
              dateTime,
              assignedProvider: booking.assignedProvider || booking.providerName,
              failureReason: dispatchStatus === 'Failed' ? (booking.failureReason || 'Unknown error') : undefined,
              reportId: booking.reportId,
            }
          })
          .sort((a: DispatchLog, b: DispatchLog) => {
            return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
          })

        setLogs(mappedLogs)
      } catch (err) {
        console.error('Failed to load dispatch logs:', err)
        setLogsError(err instanceof Error ? err.message : 'Failed to load dispatch logs')
        toast.error('Failed to load dispatch logs')
      } finally {
        setIsLoadingLogs(false)
      }
    }

    loadDispatchLogs()
  }, [user])

  // Filter requests based on search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests
    const query = searchQuery.toLowerCase()
    return requests.filter(
      (req) =>
        req.name.toLowerCase().includes(query) ||
        req.service.toLowerCase().includes(query) ||
        req.phone.includes(query) ||
        req.address.toLowerCase().includes(query)
    )
  }, [requests, searchQuery])

  // Paginate requests
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredRequests.slice(start, end)
  }, [filteredRequests, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)

  // Handle selection
  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const approvedIds = filteredRequests
        .filter((r) => r.status === 'Approved')
        .map((r) => r.id)
      setSelectedIds(new Set(approvedIds))
    } else {
      setSelectedIds(new Set())
    }
  }

  // Handle Run Auto Dispatch
  const handleRunAutoDispatch = () => {
    const selectedServices = requests.filter((r) => selectedIds.has(r.id) && r.status === 'Approved')
    if (selectedServices.length === 0) return

    // Navigate to progress page with selected service IDs
    router.push('/scheduler/auto-dispatch/progress', {
      // @ts-ignore - Next.js router state
      state: { serviceIds: selectedServices.map((s) => s.id) },
    })
  }

  // Get selected approved services count
  const selectedApprovedCount = useMemo(() => {
    return requests.filter((r) => selectedIds.has(r.id) && r.status === 'Approved').length
  }, [requests, selectedIds])

  // Handle edit action
  const handleEdit = (id: string) => {
    // TODO: Implement edit functionality
    console.log('Edit service:', id)
    toast.info('Edit functionality coming soon')
  }

  // Handle delete action
  const handleDelete = (id: string) => {
    // TODO: Implement delete functionality with confirmation
    if (window.confirm('Are you sure you want to delete this service request?')) {
      setRequests((prev) => prev.filter((req) => req.id !== id))
      toast.success('Service request deleted')
    }
  }

  // Handle CSV import
  const handleCSVImport = (importedRequests: ServiceRequest[]) => {
    // Add imported requests to the existing requests
    setRequests((prev) => [...importedRequests, ...prev])
    toast.success(`Successfully imported ${importedRequests.length} service request${importedRequests.length !== 1 ? 's' : ''}`)
  }

  // Handle CSV export
  const handleCSVExport = () => {
    // Export currently filtered requests (what's visible in the table)
    const dataToExport = filteredRequests

    if (dataToExport.length === 0) {
      toast.error('No service requests to export')
      return
    }

    // Create CSV headers
    const headers = [
      'Name',
      'Phone',
      'Service',
      'Address',
      'Approved Credits',
      'Used Credits',
      'Remaining Credits',
      'Status',
      'Preferred Staff',
      'Preferred Days',
    ]

    // Create CSV rows
    const csvRows = [
      headers,
      ...dataToExport.map((request) => [
        request.name || '',
        request.phone || '',
        request.service || '',
        request.address || '',
        String(request.credits.approved || 0),
        String(request.credits.used || 0),
        String(request.credits.remaining || 0),
        request.status || 'Draft',
        (request.preferredStaff || []).join(', '),
        (request.preferredDays || []).join(', '),
      ]),
    ]

    // Convert to CSV format with proper escaping
    const csvContent = csvRows
      .map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma, newline, or quote
            const cellStr = String(cell).replace(/"/g, '""')
            if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
              return `"${cellStr}"`
            }
            return cellStr
          })
          .join(',')
      )
      .join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `service-requests-${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${dataToExport.length} service request${dataToExport.length !== 1 ? 's' : ''} to CSV`)
  }

  return (
    <div className='max-w-7xl mx-auto py-8 px-6'>
      {/* Header with Button aligned */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-medium text-gray-900 mb-1">Service Requests</h1>
          <p className="text-gray-500">Manage and dispatch service requests for your customers.</p>
        </div>
        <Button
          onClick={() => {
            router.push('/scheduler/service-requests/new')
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Service Request
        </Button>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for service requests"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleCSVExport}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'services'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Services Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'logs'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Logs ({logs.length})
          </button>
        </div>
      </div>

      {/* Bulk Action Bar - Only show when services are selected */}
      {activeTab === 'services' && selectedApprovedCount > 0 && (
        <div className="mb-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-gray-900">
                {selectedApprovedCount} service{selectedApprovedCount !== 1 ? 's' : ''} selected
              </div>
              <div className="text-xs text-gray-600">
                These services are candidates for the next Auto Dispatch run
              </div>
            </div>
            <Button
              onClick={handleRunAutoDispatch}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg transition-colors shadow-sm hover:opacity-90"
            >
              Run Auto Dispatch
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && activeTab === 'services' && <ServiceRequestsSkeleton />}

      {/* Error State */}
      {!isLoading && error && activeTab === 'services' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">Error Loading Data</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-sm text-red-700 hover:text-red-900"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {!isLoading && activeTab === 'services' ? (
        <ServicesRequestsTable
          requests={paginatedRequests}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : !isLoading ? (
        <>
          {/* Logs Loading State */}
          {isLoadingLogs && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                <p className="text-sm text-gray-600">Loading dispatch logs...</p>
              </div>
            </div>
          )}

          {/* Logs Error State */}
          {!isLoadingLogs && logsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Error Loading Logs</h3>
                  <p className="text-sm text-red-700">{logsError}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-sm text-red-700 hover:text-red-900"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Logs Table */}
          {!isLoadingLogs && (
            <LogsTable
              logs={logs}
              dispatchTypeFilter={dispatchTypeFilter}
              statusFilter={statusFilter}
              onDispatchTypeFilterChange={setDispatchTypeFilter}
              onStatusFilterChange={setStatusFilter}
            />
          )}
        </>
      ) : null}

      {/* Pagination - Only show for Services Requests tab */}
      {activeTab === 'services' && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm font-medium rounded ${
                  currentPage === page
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                } transition-colors`}
              >
                {page}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleCSVImport}
      />
    </div>
  )
}
