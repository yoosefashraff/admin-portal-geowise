import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Upload, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import ServicesRequestsTable from '../components/serviceRequests/ServicesRequestsTable'
import LogsTable from '../components/serviceRequests/LogsTable'
import type { ServiceRequest } from '../types/serviceRequest'
import type { DispatchLog } from '../types/dispatchLog'
import { getApprovedUserCreditsByUserId, listApprovedUserCredits } from '../services/approvedUserCreditsService'
import { fetchServiceRequests, fetchDispatchLogs } from '../services/serviceRequestsService'

// Mock data removed - all data now comes from real API calls

export default function ServiceRequests() {
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
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
  const itemsPerPage = 10

  // Fetch service requests from API
  useEffect(() => {
    const loadServiceRequests = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch bookings/service requests
        const bookings = await fetchServiceRequests()
        
        // Fetch user credits to merge with service requests
        // Use combined key (UserId-ServiceId) for accurate matching
        let creditsMap = new Map<string, { approved: number; used: number; remaining: number; creditId?: number }>()
        try {
          const credits = await listApprovedUserCredits({ IsActive: true })
          console.log('🔍 [Auto-Dispatch] Fetched credits:', {
            creditsCount: credits?.data?.length || 0,
            credits: credits?.data || []
          })
          
          if (credits && credits.data && Array.isArray(credits.data)) {
            credits.data.forEach((credit) => {
              if (credit.UserId && credit.ServiceId) {
                // Use combined key: UserId-ServiceId for accurate matching
                const key = `${credit.UserId}:${credit.ServiceId}`
                creditsMap.set(key, {
                  approved: credit.ApprovedCredits,
                  used: credit.UsedCredits || 0,
                  remaining: credit.RemainingCredits || 0,
                  creditId: credit.Id,
                })
                console.log(`✅ [Auto-Dispatch] Added credit to map: ${key}`, {
                  approved: credit.ApprovedCredits,
                  used: credit.UsedCredits || 0,
                  remaining: credit.RemainingCredits || 0
                })
              }
            })
          }
          
          console.log('🔍 [Auto-Dispatch] Credits map created:', {
            mapSize: creditsMap.size,
            mapKeys: Array.from(creditsMap.keys())
          })
        } catch (creditsError) {
          // Only log if it's not a JSON parsing error (which is expected if API returns HTML)
          if (creditsError instanceof SyntaxError && creditsError.message.includes('JSON')) {
            console.warn('⚠️ [Auto-Dispatch] API returned HTML instead of JSON (may need authentication or correct endpoint):', creditsError.message)
          } else {
            console.warn('⚠️ [Auto-Dispatch] Failed to fetch credits, continuing without credit data:', creditsError)
          }
        }

        // Map API bookings to ServiceRequest format
        const mappedRequests: ServiceRequest[] = bookings.map((booking, index) => {
          const userId = booking.userId || (typeof booking.id === 'number' ? booking.id : undefined)
          const serviceId = booking.serviceId
          
          // Match credits by both UserId AND ServiceId (most precise)
          let creditInfo = { approved: 0, used: 0, remaining: 0, creditId: undefined as number | undefined }
          
          if (userId && serviceId) {
            const key = `${userId}:${serviceId}`
            if (creditsMap.has(key)) {
              creditInfo = creditsMap.get(key)!
              console.log(`✅ [Auto-Dispatch] Matched credit for booking ${booking.id}: ${key}`, creditInfo)
            } else {
              // Fallback: try matching by UserId only (less precise)
              const userIdOnlyKey = Array.from(creditsMap.keys()).find(k => k.startsWith(`${userId}:`))
              if (userIdOnlyKey) {
                creditInfo = creditsMap.get(userIdOnlyKey)!
                console.log(`⚠️ [Auto-Dispatch] Matched credit by UserId only (less precise): ${userIdOnlyKey}`, creditInfo)
              } else {
                console.log(`⚠️ [Auto-Dispatch] No credit match found for booking ${booking.id}: userId=${userId}, serviceId=${serviceId}`)
              }
            }
          } else {
            console.log(`⚠️ [Auto-Dispatch] Missing userId or serviceId for booking ${booking.id}: userId=${userId}, serviceId=${serviceId}`)
          }

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
        setRequests([])
      } finally {
        setIsLoading(false)
      }
    }

    loadServiceRequests()
  }, [])

  // Fetch dispatch logs from API
  useEffect(() => {
    const loadDispatchLogs = async () => {
      setIsLoadingLogs(true)
      setLogsError(null)
      try {
        // Fetch historical bookings (last 30 days) for dispatch logs
        const bookings = await fetchDispatchLogs(30, false)
        
        // Map API bookings to DispatchLog format
        const mappedLogs: DispatchLog[] = bookings
          .filter((booking) => {
            // Only include bookings that have been dispatched (have a status)
            return booking.status && (
              booking.status === 'Dispatched' ||
              booking.status === 'In Progress' ||
              booking.status === 'Completed' ||
              booking.status === 'Failed' ||
              booking.status === 'Confirmed'
            )
          })
          .map((booking, index) => {
            // Determine dispatch type (Auto or Manual)
            // This might need to be adjusted based on actual API response
            const dispatchType: 'Auto' | 'Manual' = (booking as any).dispatchType || 
              (booking.status === 'Confirmed' ? 'Auto' : 'Manual')
            
            // Map status to DispatchStatus
            let dispatchStatus: 'Dispatched' | 'In Progress' | 'Failed' | 'Completed' = 'Dispatched'
            if (booking.status === 'Completed' || booking.status === 'Confirmed') {
              dispatchStatus = 'Completed'
            } else if (booking.status === 'In Progress') {
              dispatchStatus = 'In Progress'
            } else if (booking.status === 'Failed') {
              dispatchStatus = 'Failed'
            }

            // Format date/time
            let dateTime = ''
            if ((booking as any).dateTime) {
              dateTime = (booking as any).dateTime
            } else if ((booking as any).createdAt) {
              const date = new Date((booking as any).createdAt)
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
              assignedProvider: (booking as any).assignedProvider || (booking as any).providerName || undefined,
              failureReason: dispatchStatus === 'Failed' ? ((booking as any).failureReason || 'Unknown error') : undefined,
              reportId: (booking as any).reportId || undefined,
            }
          })
          .sort((a, b) => {
            // Sort by date/time descending (most recent first)
            return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
          })

        setLogs(mappedLogs)
      } catch (err) {
        console.error('Failed to load dispatch logs:', err)
        setLogsError(err instanceof Error ? err.message : 'Failed to load dispatch logs')
        setLogs([])
      } finally {
        setIsLoadingLogs(false)
      }
    }

    loadDispatchLogs()
  }, [])

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
    navigate('/auto-dispatch/progress', {
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
  }

  // Handle delete action
  const handleDelete = (id: string) => {
    // TODO: Implement delete functionality with confirmation
    if (window.confirm('Are you sure you want to delete this service request?')) {
      setRequests((prev) => prev.filter((req) => req.id !== id))
    }
  }

  // Test API connection
  const [isTestingApi, setIsTestingApi] = useState(false)
  const handleTestApi = async () => {
    setIsTestingApi(true)
    try {
      console.log('Testing API connection...')
      const result = await getApprovedUserCreditsByUserId()
      console.log('✅ API Connection Successful!', result)
      alert(`API Connection Successful!\n\nReceived ${Array.isArray(result) ? result.length : 'data'} credit record(s).\n\nCheck console for details.`)
    } catch (error) {
      console.error('❌ API Connection Failed!', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`API Connection Failed!\n\nError: ${errorMessage}\n\nCheck console for details.`)
    } finally {
      setIsTestingApi(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Services Requests</h1>
              <p className="text-sm text-gray-600">
                You will be able to assign service zones to each user on the next step.
              </p>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for service requests"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestApi}
                  disabled={isTestingApi}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Test API connection to ApprovedUserCredits"
                >
                  {isTestingApi ? 'Testing...' : 'Test API'}
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  Import
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
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
                  <button
                    onClick={handleRunAutoDispatch}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm hover:opacity-90"
                    style={{ backgroundColor: '#101828' }}
                  >
                    Run Auto Dispatch
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  <p className="text-sm text-gray-600">Loading service requests...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-900 mb-1">Error Loading Data</h3>
                    <p className="text-sm text-red-700">{error}</p>
                    <p className="text-xs text-red-600 mt-2">
                      Using mock data for development. Check console for details.
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-red-700 hover:text-red-900 underline"
                  >
                    Retry
                  </button>
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
                        <p className="text-xs text-red-600 mt-2">
                          Using mock data for development. Check console for details.
                        </p>
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-red-700 hover:text-red-900 underline"
                      >
                        Retry
                      </button>
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
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
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
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
