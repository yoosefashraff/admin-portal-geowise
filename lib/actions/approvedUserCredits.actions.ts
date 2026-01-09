"use server";

import serverAPI from "@/lib/api/axios-server";

export interface ApprovedUserCredit {
  Id?: number
  UserId: number
  ServiceId: number
  ApprovedCredits: number
  UsedCredits?: number
  RemainingCredits?: number
  StartDate: string // ISO datetime
  EndDate: string // ISO datetime
  RecurringPeriod: number
  IsActive: boolean
}

export interface CreditListResponse {
  data: ApprovedUserCredit[]
  totalCount?: number
  pageNumber?: number
  pageSize?: number
}

export interface ListCreditsParams {
  PageNumber?: number
  PageSize?: number
  UserId?: number
  ServiceId?: number
  IsActive?: boolean
  SearchTerm?: string
}

/**
 * List ApprovedUserCredits with filters
 */
export async function listApprovedUserCredits(
  params: ListCreditsParams
): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit[] }> {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.PageNumber) queryParams.append('PageNumber', params.PageNumber.toString())
    if (params.PageSize) queryParams.append('PageSize', params.PageSize.toString())
    if (params.UserId) queryParams.append('UserId', params.UserId.toString())
    if (params.ServiceId) queryParams.append('ServiceId', params.ServiceId.toString())
    if (params.IsActive !== undefined) queryParams.append('IsActive', params.IsActive.toString())
    if (params.SearchTerm) queryParams.append('SearchTerm', params.SearchTerm)

    const url = `/ApprovedUserCredits/List${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    const response: any = await serverAPI.get(url)
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return { Status: 201, data: response }
    } else if (response.data && Array.isArray(response.data)) {
      return { Status: 201, data: response.data }
    } else if (response.items && Array.isArray(response.items)) {
      return { Status: 201, data: response.items }
    } else if (response.Status === 201 && response.Object) {
      // Handle if response has Status and Object
      const data = Array.isArray(response.Object) ? response.Object : []
      return { Status: 201, data }
    } else {
      return { Status: response.Status || 500, Message: response.Message || 'Unexpected response format', data: [] }
    }
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message
    return { Status: 500, Message: errorMessage, data: [] }
  }
}

/**
 * Get ApprovedUserCredits for the current user (from session)
 */
export async function getApprovedUserCreditsByUserId(): Promise<{ Status: number; Message?: string; data?: ApprovedUserCredit[] }> {
  try {
    const response: any = await serverAPI.get('/ApprovedUserCredits/GetByUserId')
    
    if (Array.isArray(response)) {
      return { Status: 201, data: response }
    } else if (response.data && Array.isArray(response.data)) {
      return { Status: 201, data: response.data }
    } else if (response.Status === 201 && response.Object) {
      const data = Array.isArray(response.Object) ? response.Object : []
      return { Status: 201, data }
    } else {
      return { Status: response.Status || 500, Message: response.Message || 'Unexpected response format', data: [] }
    }
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message
    return { Status: 500, Message: errorMessage, data: [] }
  }
}
