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
        // Fetch a MUCH wider date range to include imported records that may have ANY booking dates
        // Backend converts imported records to bookings, but they might have dates anywhere
        // We need to fetch a very wide range to catch them all
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 365) // 1 year ago - catch old bookings
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 365) // 1 year in the future - catch future bookings
        
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]
        
        console.log('📅 Fetching service requests with WIDE date range:', {
          startDate: startDateStr,
          endDate: endDateStr,
          range: '1 year ago to 1 year in the future',
          reason: 'Backend converts imported records to bookings with unknown dates - need wide range to catch them all',
          warning: 'This is a workaround until backend stops auto-converting imports to bookings'
        })
        
        // Fetch with IsOnlyConfirmed=false to get ALL bookings (including unconfirmed)
        // This ensures we catch imported records that might be unconfirmed
        const response = await fetchServiceRequests(
          startDateStr,
          endDateStr,
          false, // IsOnlyConfirmed = false to get all bookings
          user.UserID
        )
        
        console.log('📥 Fetch response:', {
          Status: response.Status,
          hasObject: !!response.Object,
          objectType: Array.isArray(response.Object) ? 'array' : typeof response.Object,
          objectLength: Array.isArray(response.Object) ? response.Object.length : 'N/A',
          barbersCount: Array.isArray(response.Object) ? response.Object.length : (response.Object ? 1 : 0),
          message: response.Message
        })
        
        // Handle error responses gracefully
        if (response.Status !== 201 && response.Status !== 200) {
          // Check if it's an authentication error
          if (response.Status === 401 || response.Status === 403) {
            toast.error('Authentication failed. Please log in again.')
            router.push('/login')
            setIsLoading(false)
            return
          }
          
          // Handle timeout and connection errors
          const isTimeout = response.Message?.includes('timeout') || 
                           response.Message?.includes('ETIMEDOUT') ||
                           response.Status === 500
          
          const errorMsg = response.Message || 'Failed to load service requests'
          setError(errorMsg)
          
          if (isTimeout) {
            toast.error('Connection timeout. The dev backend may not be responding. Please check if the backend is running.')
          } else {
            toast.error(errorMsg)
          }
          
          setRequests([])
          setIsLoading(false)
          return
        }

        // Fetch user credits to merge with service requests
        // Create a map with multiple keys: UserId, and also by ServiceId+UserId combination
        let creditsMap = new Map<number, { approved: number; used: number; remaining: number; creditId?: number; serviceId?: number }>()
        let creditsByServiceUser = new Map<string, { approved: number; used: number; remaining: number; creditId?: number }>() // key: "serviceId:userId"
        try {
          const creditsResponse = await listApprovedUserCredits({ IsActive: true })
          if (creditsResponse.Status === 201 && creditsResponse.data && Array.isArray(creditsResponse.data)) {
            console.log('📊 Loaded credits:', creditsResponse.data.length, 'credits')
            creditsResponse.data.forEach((credit) => {
              if (credit.UserId && credit.ServiceId) {
                // Store by UserId (for quick lookup)
                creditsMap.set(credit.UserId, {
                  approved: credit.ApprovedCredits,
                  used: credit.UsedCredits || 0,
                  remaining: credit.RemainingCredits || 0,
                  creditId: credit.Id,
                  serviceId: credit.ServiceId,
                })
                // Also store by serviceId:userId combination for more precise matching
                const serviceUserKey = `${credit.ServiceId}:${credit.UserId}`
                creditsByServiceUser.set(serviceUserKey, {
                  approved: credit.ApprovedCredits,
                  used: credit.UsedCredits || 0,
                  remaining: credit.RemainingCredits || 0,
                  creditId: credit.Id,
                })
                console.log(`💳 Credit loaded: UserId=${credit.UserId}, ServiceId=${credit.ServiceId}, Remaining=${credit.RemainingCredits || 0}, CreditId=${credit.Id}`)
              }
            })
            console.log('📊 Credits map size:', creditsMap.size, 'entries')
            console.log('📊 Credits by service+user:', creditsByServiceUser.size, 'entries')
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
      
      // Log booking dates to see what range we're getting
      if (allCallouts.length > 0) {
        const bookingDates = allCallouts
          .map(c => c.BookingDate || c.bookingDate || c.Date || c.date)
          .filter(Boolean)
          .map(d => new Date(d))
          .sort((a, b) => a.getTime() - b.getTime())
        
        console.log('📅 Booking dates range in fetched data:', {
          totalCallouts: allCallouts.length,
          earliestBooking: bookingDates[0]?.toISOString() || 'N/A',
          latestBooking: bookingDates[bookingDates.length - 1]?.toISOString() || 'N/A',
          dateRange: bookingDates.length > 0 
            ? `${Math.floor((bookingDates[bookingDates.length - 1].getTime() - bookingDates[0].getTime()) / (1000 * 60 * 60 * 24))} days`
            : 'N/A',
          sampleDates: bookingDates.slice(0, 10).map(d => d.toISOString().split('T')[0])
        })
      }
      
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
        console.log('📋 Total callouts fetched:', allCallouts.length)
        console.log('📋 Sample callout from API:', allCallouts[0])
        console.log('📋 Available callout fields:', Object.keys(allCallouts[0]))
        
        // Check if any callouts are from imports
        // Look for imported records by checking multiple indicators:
        // 1. IsImported flag
        // 2. Excel field names (Patient_Name, Approved Service, Mobile_Number)
        // 3. Test customer names (Test Customer 1-5)
        // 4. Recent creation dates (within last hour)
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        const importedCallouts = allCallouts.filter((c: any) => {
          const hasImportFlag = c.IsImported
          const hasExcelFields = c.Patient_Name || c['Approved Service'] || c.Mobile_Number || c['Approved_Count']
          const customerName = c.Customer || c.customer || c.CustomerName || c.Patient_Name || c.Name || ''
          const isTestCustomer = /Test Customer \d+/i.test(customerName)
          const isRecent = c.CreatedAt && new Date(c.CreatedAt) > oneHourAgo
          return hasImportFlag || hasExcelFields || isTestCustomer || isRecent
        })
        
        // Also check all customer names for "Test Customer"
        const allCustomerNames = allCallouts.map((c: any) => c.Customer || c.customer || c.CustomerName || c.Patient_Name || c.Name || '').filter(Boolean)
        const testCustomerMatches = allCustomerNames.filter(name => /Test Customer/i.test(name))
        
        if (importedCallouts.length > 0 || testCustomerMatches.length > 0) {
          console.log(`✅ Found ${importedCallouts.length} potentially imported callout(s) in regular bookings`)
          console.log(`✅ Found ${testCustomerMatches.length} customer name(s) matching "Test Customer":`, testCustomerMatches.slice(0, 10))
          if (importedCallouts.length > 0) {
            console.log('📋 Sample imported callout fields:', Object.keys(importedCallouts[0]))
            console.log('📋 Sample imported callout data:', importedCallouts[0])
            console.log('📋 All imported callout customer names:', importedCallouts.map((c: any) => c.Customer || c.Patient_Name || c.name).slice(0, 10))
          }
        } else {
          console.log('⚠️ No imported callouts detected in regular bookings')
          console.log('📋 Total customer names checked:', allCustomerNames.length)
          console.log('📋 Sample customer names (first 10):', allCustomerNames.slice(0, 10))
          console.log('📋 Checking first 3 callouts for reference:', allCallouts.slice(0, 3).map((c: any) => ({
            Customer: c.Customer,
            ServiceName: c.ServiceName,
            CreatedAt: c.CreatedAt,
            BookingDate: c.BookingDate,
            fields: Object.keys(c).slice(0, 10)
          })))
        }
      }
      
      const mappedRequests: ServiceRequest[] = allCallouts.map((callout: any, index: number) => {
        // Map Callout fields to ServiceRequest format
        // Callout has: Id, BookingDate, TimeSlot, Customer, ServiceName, Address, BlockHourId
        // Imported records might have: Patient_Name, Approved Service, Mobile_Number, Location, etc.
        const calloutId = callout.Id || callout.id || callout.ID || callout.Mr_no || callout.mr_no || `callout-${index}`
        
        // Try multiple field name variations for customer name (from imports: Patient_Name)
        const customerName = callout.Customer || callout.customer || callout.CustomerName || callout.customerName || 
          callout.Patient_Name || callout.patient_name || callout.PatientName || callout.patientName || 
          callout.Name || callout.name || ''
        
        // Try multiple field name variations for service (from imports: Approved Service)
        const serviceName = callout.ServiceName || callout.serviceName || callout.Service || callout.service || 
          callout['Approved Service'] || callout['Approved_Service'] || callout.ApprovedService || 
          callout.approvedService || callout.Approved_Service || ''
        
        // Try multiple field name variations for address
        // Priority: Address field (actual address string) > Location (if not lat,lng format)
        // Imported records should have Address field with full address strings
        let address = callout.Address || callout.address || ''
        // Fallback: Use Location only if it's not in lat,lng format (doesn't contain comma or is clearly an address)
        if (!address && callout.Location) {
          const locationStr = String(callout.Location)
          // If Location doesn't look like coordinates (no comma or has text), use it as address
          if (!locationStr.includes(',') || !/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(locationStr.trim())) {
            address = locationStr
          }
        }
        // Final fallback: check location field (lowercase)
        if (!address && callout.location) {
          const locationStr = String(callout.location)
          if (!locationStr.includes(',') || !/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(locationStr.trim())) {
            address = locationStr
          }
        }
        
        const bookingDate = callout.BookingDate || callout.bookingDate || ''
        const timeSlot = callout.TimeSlot || callout.timeSlot || ''
        
        // Get creation date for sorting (newest first)
        // Try multiple date fields: CreatedAt, createdAt, BookingDate, bookingDate, Approval_Start_Date, or use current date
        const createdAt = callout.CreatedAt || callout.createdAt || callout.BookingDate || callout.bookingDate || 
          callout.DateCreated || callout.dateCreated || 
          callout.Approval_Start_Date || callout.approval_start_date || 
          new Date().toISOString()
        
        // Try multiple field name variations for phone (from imports: Mobile_Number)
        const phone = callout.PhoneNumber || callout.phoneNumber || callout.Phone || callout.phone || 
          callout.CustomerPhone || callout.customerPhone || 
          callout.Mobile_Number || callout.mobile_number || callout.MobileNumber || callout.mobileNumber ||
          callout.Mobile || callout.mobile || ''
        
        // Provider info from barber
        const providerId = callout.ProviderId
        const providerName = callout.ProviderName
        
        // For credits, we might need to use ProviderId or calloutId
        // Since credits are mapped by UserId, and callouts might not have direct userId,
        // we'll use ProviderId as a fallback
        // For imported records, credits might be in the callout itself (Approved_Count, Used_Count, Remaining_Count)
        const userId = callout.UserId || callout.userId || callout.UserID || 
          callout['ID number '] || callout.id_number || providerId
        
        // Get serviceId for more precise credit matching
        const serviceId = callout.ServiceId || callout.serviceId || undefined
        
        // Check if credits are in the callout (from imported records)
        const hasImportedCredits = callout.Approved_Count !== undefined || callout['Approved_Count'] !== undefined
        let creditInfo: { approved: number; used: number; remaining: number; creditId?: number }
        
        if (hasImportedCredits) {
          // Use credits from imported record
          creditInfo = {
            approved: callout.Approved_Count || callout['Approved_Count'] || callout.ApprovedCount || 0,
            used: callout.Used_Count || callout['Used_Count'] || callout.UsedCount || 0,
            remaining: callout.Remaining_Count || callout['Remaining_Count'] || callout.RemainingCount || 0,
            creditId: callout.ApprovedUserCreditId || callout.approvedUserCreditId || callout.CreditId || callout.creditId || undefined
          }
        } else {
          // Try to match credits: first by serviceId+userId (most precise), then by userId only
          let matchedCredit = null
          
          if (serviceId && userId) {
            const serviceUserKey = `${serviceId}:${userId}`
            if (creditsByServiceUser.has(serviceUserKey)) {
              matchedCredit = creditsByServiceUser.get(serviceUserKey)!
              console.log(`✅ Matched credit by service+user: ${serviceUserKey}, remaining=${matchedCredit.remaining}`)
            }
          }
          
          // Fallback: match by userId only (less precise, but works if serviceId doesn't match)
          if (!matchedCredit && userId && creditsMap.has(userId)) {
            matchedCredit = creditsMap.get(userId)!
            console.log(`✅ Matched credit by userId only: ${userId}, remaining=${matchedCredit.remaining}`)
          }
          
          creditInfo = matchedCredit || { approved: 0, used: 0, remaining: 0, creditId: undefined }
          
          // Log if we couldn't match credits (for debugging)
          if (!matchedCredit && userId) {
            console.log(`⚠️ No credit match found for callout:`, {
              calloutId: callout.Id,
              customer: callout.Customer,
              userId: userId,
              serviceId: serviceId,
              availableUserIds: Array.from(creditsMap.keys()),
              availableServiceUserKeys: Array.from(creditsByServiceUser.keys())
            })
          }
        }

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

          const mappedRequest = {
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
          
          // Log if this looks like an imported record
          // Check multiple indicators: original Excel fields, Test Customer names, or IsImported flag
          const isTestCustomer = /Test Customer \d+/i.test(customerName)
          const hasImportFields = callout.Patient_Name || callout['Approved Service'] || callout.Mobile_Number || callout.IsImported
          const hasImportCredits = callout.Approved_Count !== undefined || callout['Approved_Count'] !== undefined
          
          if (isTestCustomer || hasImportFields || hasImportCredits) {
            console.log('📥 Mapped imported record:', {
              detectedBy: isTestCustomer ? 'Test Customer name' : (hasImportFields ? 'Import fields' : 'Import credits'),
              originalFields: {
                Patient_Name: callout.Patient_Name,
                Customer: callout.Customer,
                'Approved Service': callout['Approved Service'],
                ServiceName: callout.ServiceName,
                Mobile_Number: callout.Mobile_Number,
                PhoneNumber: callout.PhoneNumber,
                Location: callout.Location,
                Address: callout.Address,
                Approved_Count: callout.Approved_Count,
                Used_Count: callout.Used_Count,
                Remaining_Count: callout.Remaining_Count,
                CreatedAt: callout.CreatedAt,
                BookingDate: callout.BookingDate,
              },
              mappedTo: {
                name: mappedRequest.name,
                service: mappedRequest.service,
                phone: mappedRequest.phone,
                address: mappedRequest.address,
                credits: mappedRequest.credits,
                createdAt: mappedRequest.createdAt,
              },
              allCalloutFields: Object.keys(callout).slice(0, 20) // Show first 20 fields for debugging
            })
          }
          
          return mappedRequest
        })

      // Log summary of credits vs service requests
      console.log('📊 Credits vs Service Requests Summary:', {
        totalCredits: creditsMap.size,
        totalServiceRequests: mappedRequests.length,
        creditsWithMatchingRequests: mappedRequests.filter(r => r.credits.remaining > 0).length,
        creditsWithoutMatchingRequests: creditsMap.size - mappedRequests.filter(r => r.credits.remaining > 0).length,
        message: 'If you added credits but don\'t see service requests, you may need to create a service request for that customer first.'
      })
      
      // Check for credits that don't have matching service requests
      const creditsWithoutRequests: number[] = []
      creditsMap.forEach((credit, userId) => {
        const hasMatchingRequest = mappedRequests.some(r => r.userId === userId && r.credits.remaining > 0)
        if (!hasMatchingRequest && credit.remaining > 0) {
          creditsWithoutRequests.push(userId)
        }
      })
      
      if (creditsWithoutRequests.length > 0) {
        console.warn('⚠️ Found credits without matching service requests:', {
          count: creditsWithoutRequests.length,
          userIds: creditsWithoutRequests,
          message: 'These customers have credits but no service requests. Create a service request for them to use auto-dispatch.'
        })
      }

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

      // Count imported/test customer records
      const testCustomerRecords = allRequests.filter(r => /Test Customer/i.test(r.name))
      const importedRecordsCount = testCustomerRecords.length
      
      // Log requests for debugging
      console.log('📊 Loaded service requests:', {
        total: allRequests.length,
        fromBookings: allCallouts.length - importedRequests.length,
        fromImported: importedRequests.length,
        testCustomerRecords: importedRecordsCount,
        sampleRequest: allRequests.length > 0 ? allRequests[0] : null,
        requestNames: allRequests.map(r => r.name).slice(0, 10),
        requestIds: allRequests.map(r => r.id).slice(0, 10),
        requestStatuses: allRequests.map(r => r.status),
        sortedByDate: 'newest first',
        testCustomerNames: testCustomerRecords.map(r => r.name).slice(0, 10),
        testCustomerStatuses: testCustomerRecords.map(r => r.status),
        testCustomerServices: testCustomerRecords.map(r => r.service)
      })
      
      // Show notification if imported records were found
      if (importedRecordsCount > 0) {
        console.log(`✅ Found ${importedRecordsCount} imported "Test Customer" records in the table!`)
        console.log('💡 TIP: If you don\'t see them, check:')
        console.log('   1. Status filter is set to "All" (not filtering by status)')
        console.log('   2. Service type filter is set to "All" (not filtering by service)')
        console.log('   3. Search for "Test Customer" to find them quickly')
        console.log('   4. Check pagination - they might be on page 2+')
        
        // Show a toast notification
        setTimeout(() => {
          toast.success(
            `Found ${importedRecordsCount} imported record${importedRecordsCount !== 1 ? 's' : ''} in the table!`,
            {
              description: `Search for "Test Customer" or set filters to "All" to see them.`,
              duration: 5000
            }
          )
        }, 1000)
      }
      
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
        console.warn('⚠️ BACKEND BEHAVIOR: Imported records are being converted to bookings immediately.')
        console.warn('   This is likely incorrect behavior - imported records should remain as pending service requests.')
        console.warn('   They should NOT be converted to bookings until explicitly dispatched.')
        console.log(`   Currently fetching ${allCallouts.length} total callouts from date range: ${startDateStr} to ${endDateStr}`)
        console.log(`   Mapped to ${allRequests.length} service requests in the table.`)
        console.warn('   ⚠️ ISSUE: If imported records were converted to bookings, they should appear in the table above.')
        console.warn('   If they don\'t appear, they may have booking dates outside our fetch range, or be filtered by CompanyAdminId.')
        console.log('   Backend needs to be updated to keep imported records as pending service requests.')
      } else {
        console.log(`✅ Found ${importedRequests.length} imported requests that will be added to the list.`)
      }
      } catch (err: any) {
        console.error('Failed to load service requests:', err)
        
        // Check if it's a timeout error
        const isTimeout = err.message?.includes('timeout') || 
                         err.message?.includes('Request timeout') ||
                         err.code === 'ECONNABORTED' ||
                         err.message?.includes('took too long')
        
        if (isTimeout) {
          const errorMsg = 'Request timed out. The date range may be too large. The backend is processing a 2-year date range which can take time. Please try refreshing the page.'
          setError(errorMsg)
          toast.error('Request timed out. The backend is processing a large date range. Please try again.')
        } else if (err.message?.includes('Status: 500')) {
          const errorMsg = 'Backend error (500). The server may be experiencing issues. Please try again or contact support.'
          setError(errorMsg)
          toast.error('Backend error. Please try again.')
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load service requests')
        }
        
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
      const query = searchQuery.toLowerCase().trim()
      // Remove any search icon characters (like "Q" prefix)
      const cleanQuery = query.replace(/^[q]\s*/i, '').trim()
      
      // Debug logging for search (only log once per unique query to avoid spam)
      if (cleanQuery && requests.length > 0) {
        const matches = requests.filter(
          (req) =>
            req.name.toLowerCase().includes(cleanQuery) ||
            req.service.toLowerCase().includes(cleanQuery) ||
            req.phone.includes(cleanQuery) ||
            req.address.toLowerCase().includes(cleanQuery)
        )
        
        // Log search results
        console.log('🔍 Search debug:', {
          originalQuery: searchQuery,
          cleanQuery: cleanQuery,
          totalRequests: requests.length,
          matchesFound: matches.length,
          sampleNames: requests.slice(0, 20).map(r => r.name),
          sampleMatches: matches.slice(0, 10).map(m => m.name),
          allUniqueNames: [...new Set(requests.map(r => r.name))].slice(0, 50),
          note: matches.length === 0 
            ? '⚠️ No matches found. Check if imported records have different names than expected.'
            : `✅ Found ${matches.length} matches`
        })
        
        // If no matches and searching for "test customer", show all names containing "test"
        if (matches.length === 0 && cleanQuery.includes('test')) {
          const testMatches = requests.filter(r => r.name.toLowerCase().includes('test'))
          console.log('🔍 Test customer search - alternative matches:', {
            testMatchesCount: testMatches.length,
            testMatchNames: testMatches.map(m => m.name).slice(0, 20)
          })
        }
      }
      
      filtered = filtered.filter(
        (req) =>
          req.name.toLowerCase().includes(cleanQuery) ||
          req.service.toLowerCase().includes(cleanQuery) ||
          req.phone.includes(cleanQuery) ||
          req.address.toLowerCase().includes(cleanQuery)
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

    // Log filtering results to help debug why imported records might not be visible
    const testCustomerRecords = requests.filter(r => /Test Customer/i.test(r.name))
    if (testCustomerRecords.length > 0) {
      const testCustomersInFiltered = filtered.filter(r => /Test Customer/i.test(r.name))
      if (testCustomersInFiltered.length !== testCustomerRecords.length) {
        console.warn('⚠️ Some imported records are being filtered out:', {
          totalTestCustomers: testCustomerRecords.length,
          visibleAfterFilters: testCustomersInFiltered.length,
          filteredOut: testCustomerRecords.length - testCustomersInFiltered.length,
          currentFilters: {
            status: serviceStatusFilter,
            serviceType: serviceTypeFilter,
            searchQuery: searchQuery
          },
          testCustomerStatuses: [...new Set(testCustomerRecords.map(r => r.status))],
          testCustomerServices: [...new Set(testCustomerRecords.map(r => r.service))],
          tip: 'Set status filter to "All" and service type to "All" to see all imported records'
        })
      } else {
        console.log(`✅ All ${testCustomerRecords.length} imported records are visible after filters`)
      }
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
      console.log('Selected services:', selectedServices.map(s => ({ 
        id: s.id, 
        name: s.name, 
        creditId: s.approvedUserCreditId,
        userId: s.userId,
        serviceId: s.serviceId,
        remainingCredits: s.credits.remaining
      })))

      // Validate credit IDs before calling API
      // Fetch current credits to verify they exist and have remaining balance
      console.log('🔍 Validating credit IDs before auto-dispatch...')
      const validationResponse = await listApprovedUserCredits({ IsActive: true })
      if (validationResponse.Status === 201 && validationResponse.data && Array.isArray(validationResponse.data)) {
        const availableCredits = validationResponse.data
        const validCreditIds: number[] = []
        const invalidCreditIds: number[] = []
        
        uniqueCreditIds.forEach(creditId => {
          const credit = availableCredits.find(c => c.Id === creditId)
          if (credit && (credit.RemainingCredits || 0) > 0) {
            validCreditIds.push(creditId)
            console.log(`✅ Credit ID ${creditId} is valid: ${credit.RemainingCredits} remaining credits`)
          } else {
            invalidCreditIds.push(creditId)
            if (credit) {
              console.warn(`⚠️ Credit ID ${creditId} has no remaining credits (${credit.RemainingCredits || 0} remaining)`)
            } else {
              console.warn(`⚠️ Credit ID ${creditId} not found in database`)
            }
          }
        })

        // Filter out service requests with 0 remaining credits from selectedServices
        const servicesWithCredits = selectedServices.filter(s => {
          const hasCredits = s.credits && s.credits.remaining > 0;
          if (!hasCredits) {
            console.warn(`⚠️ Service request ${s.id} has 0 remaining credits, excluding from auto-dispatch`);
          }
          return hasCredits;
        });

        if (servicesWithCredits.length === 0) {
          toast.error('No service requests with remaining credits selected. Please select requests that have remaining credits > 0.');
          setIsRunningAutoDispatch(false);
          return;
        }

        if (servicesWithCredits.length < selectedServices.length) {
          const excludedCount = selectedServices.length - servicesWithCredits.length;
          toast.warning(`${excludedCount} service request(s) with 0 remaining credits were excluded from auto-dispatch.`);
        }
        
        if (invalidCreditIds.length > 0) {
          console.warn('⚠️ Some credit IDs are invalid or have no remaining credits:', {
            invalidIds: invalidCreditIds,
            validIds: validCreditIds,
            totalSelected: uniqueCreditIds.length,
            validCount: validCreditIds.length
          })
          
          // If some are invalid but we have valid ones, use only valid ones
          if (validCreditIds.length > 0) {
            console.log(`✅ Using ${validCreditIds.length} valid credit ID(s) instead of ${uniqueCreditIds.length} selected`)
            uniqueCreditIds.splice(0, uniqueCreditIds.length, ...validCreditIds)
          } else {
            // No valid credits - try to find credits for the selected services
            console.log('⚠️ No valid credit IDs found. Attempting to find credits for selected services...')
            const fallbackCreditIds: number[] = []
            
            servicesWithCredits.forEach(service => {
              const matchingCredit = availableCredits.find(
                c => c.UserId === service.userId && 
                     c.ServiceId === service.serviceId &&
                     (c.RemainingCredits || 0) > 0
              )
              if (matchingCredit?.Id && !fallbackCreditIds.includes(matchingCredit.Id)) {
                fallbackCreditIds.push(matchingCredit.Id)
                console.log(`✅ Found matching credit ID ${matchingCredit.Id} for service ${service.name}`)
              }
            })
            
            if (fallbackCreditIds.length > 0) {
              uniqueCreditIds.splice(0, uniqueCreditIds.length, ...fallbackCreditIds)
              console.log(`✅ Using ${fallbackCreditIds.length} fallback credit ID(s)`)
            } else {
              toast.error(
                `No valid credits found. The selected services don't have credits with remaining balance in the ${process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL ? 'DEV' : 'PRODUCTION'} database.`,
                {
                  description: 'Please ensure credits exist and have remaining balance, or create new credits in the Credits page.',
                  duration: 8000
                }
              )
              setIsRunningAutoDispatch(false)
              return
            }
          }
        }
      } else {
        console.warn('⚠️ Could not validate credit IDs - proceeding anyway (backend will validate)')
      }

      // Call the real API with timeout handling
      console.log('Calling generateBookings API with validated credit IDs:', uniqueCreditIds)
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
        
        // Provide more helpful error messages for common issues
        let userFriendlyMessage = errorMessage
        if (errorMessage.includes('No ApprovedUserCredits found') || errorMessage.includes('no remaining credits')) {
          userFriendlyMessage = `No valid credits found for the selected services. The credits may not exist in the ${process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL ? 'DEV' : 'PRODUCTION'} database, or they may have no remaining balance.`
        } else if (errorMessage.includes('timeout')) {
          userFriendlyMessage = 'Request timed out. The server may be processing. Please try again.'
        } else if (errorMessage.includes('Cannot connect') || errorMessage.includes('Network Error')) {
          userFriendlyMessage = `Cannot connect to backend. Please verify the ${process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL ? 'DEV' : 'PRODUCTION'} backend is running.`
        }
        
        toast.error(userFriendlyMessage, {
          description: errorMessage !== userFriendlyMessage ? errorMessage : undefined,
          duration: 8000
        })
        
        if (response.data?.ErrorLogs && response.data.ErrorLogs.length > 0) {
          console.error('Error logs:', response.data.ErrorLogs)
        }
        
        // Log detailed error for debugging
        console.error('Auto Dispatch error details:', {
          status: response.Status,
          message: response.Message,
          creditIds: uniqueCreditIds,
          selectedServices: selectedServices.map(s => ({
            name: s.name,
            creditId: s.approvedUserCreditId,
            userId: s.userId,
            serviceId: s.serviceId,
            remainingCredits: s.credits.remaining
          })),
          responseData: response.data
        })
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
      toast.success(`Successfully imported ${importedData.length} service request${importedData.length !== 1 ? 's' : ''}.`, {
        description: '⚠️ Note: Backend is converting imported records to bookings immediately. They should remain as pending service requests until dispatched.',
        duration: 7000
      })
    } else {
      toast.success('Import completed.', {
        description: '⚠️ Note: Backend is converting imported records to bookings immediately. This behavior should be changed.',
        duration: 7000
      })
    }
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
