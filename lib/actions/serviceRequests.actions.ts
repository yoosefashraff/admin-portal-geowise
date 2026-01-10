"use server";

import serverAPI from "@/lib/api/axios-server";
import { fetchBookings } from "./calendar.actions";
import type { FetchBookingsParams } from "@/lib/types/calendar";

const DEVICE_TOKEN = 'test12345';
const IS_TEST = true;

/**
 * Fetch service requests for the current date range
 * Defaults to today's date range
 */
export async function fetchServiceRequests(
  startDate?: string,
  endDate?: string,
  onlyConfirmed?: boolean,
  companyAdminId?: number
): Promise<any> {
  const today = new Date()
  const defaultStartDate = startDate || today.toISOString().split('T')[0]
  const defaultEndDate = endDate || today.toISOString().split('T')[0]

  const params: FetchBookingsParams = {
    StartDate: `${defaultStartDate}T00:00:00Z`,
    EndDate: `${defaultEndDate}T23:59:59Z`,
    IsOnlyConfirmed: onlyConfirmed ?? false,
    CompanyAdminId: companyAdminId || 0,
  }

  return fetchBookings(params)
}

/**
 * Fetch dispatch logs (historical bookings/dispatches)
 * Fetches bookings from a past date range to show dispatch history
 */
export async function fetchDispatchLogs(
  daysBack: number = 30,
  onlyConfirmed?: boolean,
  companyAdminId?: number
): Promise<any> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  const params: FetchBookingsParams = {
    StartDate: `${startDateStr}T00:00:00Z`,
    EndDate: `${endDateStr}T23:59:59Z`,
    IsOnlyConfirmed: onlyConfirmed ?? false,
    CompanyAdminId: companyAdminId || 0,
  }

  return fetchBookings(params)
}

/**
 * Import Service Requests from a file (bulk import)
 * POST /ServiceRequests/import
 * Content-Type: multipart/form-data
 * Form-data key: file
 * 
 * @param formData - FormData object containing the file with key 'file'
 *                   Client should create: formData.append('file', file)
 */
export async function importServiceRequests(
  formData: FormData
): Promise<{ Status: number; Message?: string; data?: { success: number; errors?: string[] } }> {
  try {
    const response: any = await serverAPI.post(
      '/ServiceRequests/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    
    if (response.Status === 201) {
      return { 
        Status: 201, 
        Message: response.Message || 'Import completed successfully',
        data: response.Object || response.data || response
      }
    } else {
      return { 
        Status: response.Status || 500, 
        Message: response.Message || 'Import failed',
        data: response.Object || response.data
      }
    }
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message || 'Failed to import service requests'
    return { Status: 500, Message: errorMessage }
  }
}