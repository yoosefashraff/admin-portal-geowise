'use client';

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Upload, Download, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import ServicesRequestsTable from '@/components/service-requests/ServicesRequestsTable'
import LogsTable from '@/components/service-requests/LogsTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ServiceRequest } from '@/lib/types/serviceRequest.types'
import type { DispatchLog } from '@/lib/types/dispatchLog.types'
import { fetchServiceRequests, fetchDispatchLogs, fetchImportedServiceRequests } from '@/lib/actions/serviceRequests.actions'
import { listApprovedUserCredits, generateBookings } from '@/lib/actions/approvedUserCredits.actions'
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
  const [isRunningAutoDispatch, setIsRunningAutoDispatch] = useState(false)
  const itemsPerPage = 10
  
  // Sorting and filtering for service requests
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'service' | 'status' | 'credits'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [serviceStatusFilter, setServiceStatusFilter] = useState<'All' | 'Approved' | 'Pending' | 'Draft' | 'Rejected'>('All')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('All')

  // Fetch service requests from API
    const loadServiceRequests = async () => {
      if (!user) return
      
      setIsLoading(true)
      setError(null)
      try {
        // Fetch a wider date range to include imported records that may have future booking dates
        // Imported records might have booking dates set to future dates, so we need to fetch beyond today
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 7) // 7 days ago
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 90) // 90 days in the future
        
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]
        
        console.log('📅 Fetching service requests with date range:', {
          startDate: startDateStr,
          endDate: endDateStr,
          reason: 'Including imported records that may have future booking dates'
        })
        
        const response = await fetchServiceRequests(
          startDateStr,
          endDateStr,
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

      // Also fetch imported service requests (before they're converted to bookings)
      // Note: Imported records might be converted to bookings immediately, so they may appear in the regular callouts
      let importedRequests: any[] = []
      try {
        console.log('Attempting to fetch imported service requests from API...')
        const importedResponse = await fetchImportedServiceRequests()
        if (importedResponse.Status === 201 && importedResponse.data && Array.isArray(importedResponse.data)) {
          importedRequests = importedResponse.data
          console.log(`✅ Found ${importedRequests.length} imported service requests from dedicated endpoint`)
          if (importedRequests.length > 0) {
            console.log('Sample imported request:', importedRequests[0])
            console.log('All imported request fields:', Object.keys(importedRequests[0]))
          }
        } else {
          console.log('⚠️ No imported service requests found in dedicated endpoint. They may be converted to bookings and appear in regular callouts.')
          console.log('Import response details:', {
            Status: importedResponse.Status,
            hasData: !!importedResponse.data,
            dataType: typeof importedResponse.data,
            dataIsArray: Array.isArray(importedResponse.data),
            dataLength: Array.isArray(importedResponse.data) ? importedResponse.data.length : 'N/A'
          })
        }
      } catch (importedError) {
        console.warn('Could not fetch imported service requests from dedicated endpoint:', importedError)
        console.log('ℹ️ Imported records may have been converted to bookings and will appear in regular service requests list')
      }

      // Map API response to ServiceRequest format
      // API returns Barber[] with Callouts[] nested inside
      const barbers = response.Object || []
      
      // Extract all callouts from all barbers and flatten into a single array
      const allCallouts: any[] = []
      barbers.forEach((barber: any) => {
        if (barber.Callouts && Array.isArray(barber.Callouts)) {
          barber.Callouts.forEach((callout: any) => {
            // Add barber info to each callout for reference
            allCallouts.push({
              ...callout,
              ProviderId: barber.UserID,
              ProviderName: barber.FullName || barber.UserName,
            })
          })
        }
      })
      
      // Add imported requests to the list (they might be in a different format)
      if (importedRequests.length > 0) {
        importedRequests.forEach((imported: any) => {
          // Map imported request to callout format if needed
          allCallouts.push({
            ...imported,
            Id: imported.Id || imported.id || `imported-${Date.now()}-${Math.random()}`,
            Customer: imported.Name || imported.name || imported.Customer,
            ServiceName: imported.Service || imported.service || imported.ServiceName,
            Address: imported.Address || imported.address || '',
            PhoneNumber: imported.Phone || imported.phone || imported.PhoneNumber || '',
            Status: imported.Status || imported.status || 'Pending',
            IsImported: true, // Flag to identify imported requests
            CreatedAt: imported.CreatedAt || imported.createdAt || imported.DateCreated || imported.dateCreated || new Date().toISOString(), // Use current date if not provided
          })
        })
      }
      
      // Log first callout to debug field names
      if (allCallouts.length > 0) {
        console.log('Sample callout from API:', allCallouts[0])
        console.log('Available callout fields:', Object.keys(allCallouts[0]))
      }
      
      const mappedRequests: ServiceRequest[] = allCallouts.map((callout: any, index: number) => {
        // Map Callout fields to ServiceRequest format
        // Callout has: Id, BookingDate, TimeSlot, Customer, ServiceName, Address, BlockHourId
        const calloutId = callout.Id || callout.id || callout.ID || `callout-${index}`
        const customerName = callout.Customer || callout.customer || callout.CustomerName || callout.customerName || ''
        const serviceName = callout.ServiceName || callout.serviceName || callout.Service || callout.service || ''
        const address = callout.Address || callout.address || ''
        const bookingDate = callout.BookingDate || callout.bookingDate || ''
        const timeSlot = callout.TimeSlot || callout.timeSlot || ''
        
        // Get creation date for sorting (newest first)
        // Try multiple date fields: CreatedAt, createdAt, BookingDate, bookingDate, or use current date
        const createdAt = callout.CreatedAt || callout.createdAt || callout.BookingDate || callout.bookingDate || 
          callout.DateCreated || callout.dateCreated || new Date().toISOString()
        
        // Try to get phone number from callout (might not be in Callout, might need separate lookup)
        const phone = callout.PhoneNumber || callout.phoneNumber || callout.Phone || callout.phone || callout.CustomerPhone || callout.customerPhone || ''
        
        // Provider info from barber
        const providerId = callout.ProviderId
        const providerName = callout.ProviderName
        
        // For credits, we might need to use ProviderId or calloutId
        // Since credits are mapped by UserId, and callouts might not have direct userId,
        // we'll use ProviderId as a fallback
        const userId = callout.UserId || callout.userId || callout.UserID || providerId
          const creditInfo = userId && creditsMap.has(userId) 
            ? creditsMap.get(userId)! 
            : { approved: 0, used: 0, remaining: 0 }

        // Determine status - Callouts are typically "Approved" or "Confirmed" when they appear
        // If there's a status field, use it; otherwise default to "Approved" for callouts
        const statusStr = String(callout.Status || callout.status || 'Approved').trim()
        let normalizedStatus: 'Approved' | 'Pending' | 'Draft' | 'Rejected' = 'Approved'
        if (statusStr) {
          const statusLower = statusStr.toLowerCase()
          if (statusLower === 'approved' || statusLower === 'confirmed') {
            normalizedStatus = 'Approved'
          } else if (statusLower === 'pending') {
            normalizedStatus = 'Pending'
          } else if (statusLower === 'rejected' || statusLower === 'cancelled') {
            normalizedStatus = 'Rejected'
          } else {
            normalizedStatus = 'Draft'
          }
        }

          return {
          id: String(calloutId),
          name: customerName || 'Unknown Customer',
          phone: phone || '',
          service: serviceName || 'Unknown Service',
          address: address || '',
            credits: {
              approved: creditInfo.approved,
              used: creditInfo.used,
              remaining: creditInfo.remaining,
            },
          preferredStaff: providerName ? [providerName] : (callout.PreferredStaff || callout.preferredStaff || []),
          preferredDays: callout.PreferredDays || callout.preferredDays || [],
          status: normalizedStatus,
            userId: userId,
          serviceId: callout.ServiceId || callout.serviceId || undefined,
            approvedUserCreditId: creditInfo.creditId,
          createdAt: createdAt, // For sorting (newest first)
          }
        })

      // Merge with pending requests from sessionStorage (newly created)
      const pendingRequests = sessionStorage.getItem('pendingServiceRequests');
      let allRequests = mappedRequests;
      
      if (pendingRequests) {
        try {
          const pending = JSON.parse(pendingRequests);
          if (Array.isArray(pending) && pending.length > 0) {
            // Ensure pending requests have createdAt for sorting (newest first)
            const pendingWithDates = pending.map((req: ServiceRequest) => ({
              ...req,
              createdAt: req.createdAt || new Date().toISOString(), // Use current date if not set
            }));
            // Merge pending requests with API data (pending first, then API data)
            allRequests = [...pendingWithDates, ...mappedRequests];
            // Clear sessionStorage after merging
            sessionStorage.removeItem('pendingServiceRequests');
            toast.success(`${pending.length} new service request${pending.length !== 1 ? 's' : ''} added`);
          }
        } catch (error) {
          console.error('Error parsing pending service requests:', error);
          sessionStorage.removeItem('pendingServiceRequests');
        }
      }

      // Log requests for debugging
      console.log('📊 Loaded service requests:', {
        total: allRequests.length,
        fromBookings: allCallouts.length - importedRequests.length,
        fromImported: importedRequests.length,
        sampleRequest: allRequests.length > 0 ? allRequests[0] : null,
        requestNames: allRequests.map(r => r.name).slice(0, 10),
        requestIds: allRequests.map(r => r.id).slice(0, 10),
        requestStatuses: allRequests.map(r => r.status),
        sortedByDate: 'newest first'
      })
      
      // Check if imported requests might be in the regular callouts
      if (importedRequests.length === 0 && allCallouts.length > 0) {
        console.log('ℹ️ No imported requests found in dedicated endpoint. Checking if they appear in regular callouts...')
        console.log(`Found ${allCallouts.length} total callouts from regular API`)
      }

      // Set requests (empty array if no data)
      setRequests(allRequests)
      
      // If we have imported requests but they're not showing, log a warning
      if (importedRequests.length > 0 && allRequests.length === 0) {
        console.warn('⚠️ Imported requests were fetched but not mapped correctly. Check field mapping.')
      } else if (importedRequests.length === 0) {
        console.log('ℹ️ No imported service requests found in dedicated endpoint.')
        console.log('💡 IMPORTANT: Imported records are likely converted to bookings immediately.')
        console.log(`   Check the regular service requests list - you should see ${allRequests.length} total requests.`)
        console.log('   The imported records should appear as bookings/callouts in the regular list.')
      } else {
        console.log(`✅ Found ${importedRequests.length} imported requests that will be added to the list.`)
      }
      } catch (err) {
        console.error('Failed to load service requests:', err)
        setError(err instanceof Error ? err.message : 'Failed to load service requests')
      setRequests([]) // Set to empty array on error
      } finally {
        setIsLoading(false)
      }
    }

  // Fetch service requests on mount and when user changes
  useEffect(() => {
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

        // Set logs (empty array if no data)
        setLogs(mappedLogs)
      } catch (err) {
        console.error('Failed to load dispatch logs:', err)
        setLogsError(err instanceof Error ? err.message : 'Failed to load dispatch logs')
        setLogs([]) // Set to empty array on error
      } finally {
        setIsLoadingLogs(false)
      }
    }

    loadDispatchLogs()
  }, [user])

  // Get unique service types for filter dropdown
  const uniqueServices = useMemo(() => {
    const services = new Set(requests.map(r => r.service).filter(Boolean))
    return Array.from(services).sort()
  }, [requests])

  // Filter requests based on search query, status, and service type
  const filteredRequests = useMemo(() => {
    let filtered = requests

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (req) =>
          req.name.toLowerCase().includes(query) ||
          req.service.toLowerCase().includes(query) ||
          req.phone.includes(query) ||
          req.address.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (serviceStatusFilter !== 'All') {
      filtered = filtered.filter((req) => req.status === serviceStatusFilter)
    }

    // Filter by service type
    if (serviceTypeFilter !== 'All') {
      filtered = filtered.filter((req) => req.service === serviceTypeFilter)
    }

    // Sort based on selected sort option
    filtered = filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          comparison = dateB - dateA // Default: newest first
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'service':
          comparison = a.service.localeCompare(b.service)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'credits':
          comparison = (a.credits.remaining || 0) - (b.credits.remaining || 0)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [requests, searchQuery, serviceStatusFilter, serviceTypeFilter, sortBy, sortOrder])

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

  // Handle Run Auto Dispatch - calls real API
  const handleRunAutoDispatch = async () => {
    const selectedServices = requests.filter((r) => selectedIds.has(r.id) && r.status === 'Approved')
    if (selectedServices.length === 0) {
      toast.error('Please select at least one approved service request')
      return
    }

    setIsRunningAutoDispatch(true)
    try {
      // Get credit IDs from selected service requests
      const creditIds: number[] = []
      selectedServices.forEach((service) => {
        if (service.approvedUserCreditId) {
          creditIds.push(service.approvedUserCreditId)
        }
      })

      // If no credit IDs found from service requests, use ALL available credits with remaining balance
      // The backend will match them to imported records automatically
      if (creditIds.length === 0) {
        console.log('No credit IDs found in selected services, fetching all available credits...')
        
        // Fetch all active credits with remaining balance
        const creditsResponse = await listApprovedUserCredits({ IsActive: true })
        if (creditsResponse.Status === 201 && creditsResponse.data && Array.isArray(creditsResponse.data)) {
          const creditsData = creditsResponse.data
          // First, try to match by userId/serviceId for selected services
          selectedServices.forEach((service) => {
            const matchingCredit = creditsData.find(
              (credit) => 
                credit.UserId === service.userId && 
                credit.ServiceId === service.serviceId &&
                (credit.RemainingCredits || 0) > 0
            )
            if (matchingCredit?.Id) {
              creditIds.push(matchingCredit.Id)
            }
          })
          
          // If still no matches, use ALL credits with remaining balance
          if (creditIds.length === 0) {
            console.log('No matching credits found, using all credits with remaining balance')
            const allCreditsWithRemaining = creditsData.filter(
              (credit) => credit.Id && (credit.RemainingCredits || 0) > 0
            )
            creditIds.push(...allCreditsWithRemaining.map(c => c.Id!))
          }
        }
      }

      if (creditIds.length === 0) {
        toast.error('No credits with remaining balance found. Please create credits in the Credits page first.')
        console.error('Auto Dispatch failed: No credits found', {
          selectedServices: selectedServices.map(s => ({
            id: s.id,
            name: s.name,
            userId: s.userId,
            serviceId: s.serviceId,
            approvedUserCreditId: s.approvedUserCreditId
          }))
        })
        setIsRunningAutoDispatch(false)
        return
      }

      // Remove duplicates
      const uniqueCreditIds = [...new Set(creditIds)]

      console.log('Running Auto Dispatch with credit IDs:', uniqueCreditIds)
      console.log('Selected services:', selectedServices.map(s => ({ id: s.id, name: s.name, creditId: s.approvedUserCreditId })))

      // Call the real API with timeout handling
      console.log('Calling generateBookings API...')
      const startTime = Date.now()
      const response = await generateBookings(uniqueCreditIds)
      const duration = Date.now() - startTime
      console.log(`GenerateBookings API call completed in ${duration}ms`, response)

      // Store selected service requests and API response for progress page
      sessionStorage.setItem('autoDispatchServiceIds', JSON.stringify(selectedServices.map((s) => s.id)))
      sessionStorage.setItem('autoDispatchResponse', JSON.stringify(response))
      sessionStorage.setItem('autoDispatchServices', JSON.stringify(selectedServices))

      if (response.Status === 201) {
        const successCount = response.data?.bookingsCreated || response.data?.success || 0
        toast.success(`Auto Dispatch started. ${successCount} booking${successCount !== 1 ? 's' : ''} will be created.`)
        
        // Navigate to progress page
        router.push('/scheduler/auto-dispatch/progress')
      } else {
        const errorMessage = response.Message || 'Failed to start Auto Dispatch'
        toast.error(errorMessage)
        if (response.data?.ErrorLogs && response.data.ErrorLogs.length > 0) {
          console.error('Error logs:', response.data.ErrorLogs)
        }
      }
    } catch (error) {
      console.error('Failed to run Auto Dispatch:', error)
      toast.error('Failed to run Auto Dispatch. Please try again.')
    } finally {
      setIsRunningAutoDispatch(false)
    }
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

  // Handle CSV import - always reload from API to get stored records
  const handleCSVImport = async (importedData?: any[]) => {
    console.log('handleCSVImport called', {
      hasImportedData: !!importedData,
      importedDataLength: importedData?.length || 0
    })
    
    // Always reload from API after successful import
    // The backend stores imported records, so we should fetch them from the API
    console.log('Reloading service requests from API after import...')
    await loadServiceRequests()
    
    // Show success message with helpful note
    if (importedData && Array.isArray(importedData) && importedData.length > 0) {
      toast.success(`Successfully imported ${importedData.length} service request${importedData.length !== 1 ? 's' : ''}. Refreshing list...`, {
        description: 'Imported records may appear in the service requests list. If not visible, they may have been converted to bookings.',
        duration: 5000
      })
    } else {
      toast.success('Import completed. Refreshing list...', {
        description: 'Check the service requests list for imported records. They may appear as bookings.',
        duration: 5000
      })
    }
    
    // Log current request count for debugging
    setTimeout(() => {
      console.log('📊 Service requests after import:', {
        totalRequests: requests.length,
        requestIds: requests.map(r => r.id).slice(0, 10),
        requestNames: requests.map(r => r.name).slice(0, 10)
      })
    }, 1000)
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
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Service Request
        </Button>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
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
              disabled={isRunningAutoDispatch}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg transition-colors shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunningAutoDispatch ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                'Run Auto Dispatch'
              )}
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

      {/* Sorting and Filtering Controls - Only show for services tab */}
      {!isLoading && activeTab === 'services' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={serviceStatusFilter}
                onChange={(e) => {
                  setServiceStatusFilter(e.target.value as any)
                  setCurrentPage(1) // Reset to first page when filter changes
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Draft">Draft</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Service Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Service:</label>
              <select
                value={serviceTypeFilter}
                onChange={(e) => {
                  setServiceTypeFilter(e.target.value)
                  setCurrentPage(1) // Reset to first page when filter changes
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[150px]"
              >
                <option value="All">All Services</option>
                {uniqueServices.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any)
                  setCurrentPage(1) // Reset to first page when sort changes
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="date">Date (Newest First)</option>
                <option value="name">Name</option>
                <option value="service">Service</option>
                <option value="status">Status</option>
                <option value="credits">Remaining Credits</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Order:</label>
              <button
                onClick={() => {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  setCurrentPage(1) // Reset to first page when sort order changes
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center gap-2"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>

            {/* Results count */}
            <div className="ml-auto text-sm text-gray-600">
              Showing {paginatedRequests.length} of {filteredRequests.length} service request{filteredRequests.length !== 1 ? 's' : ''}
            </div>
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
