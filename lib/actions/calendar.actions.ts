"use server";

import serverAPI from "@/lib/api/axios-server";
import { APIResponse, BookingRequestPayload, FetchBookingsParams } from "@/lib/types/calendar";

const DEVICE_TOKEN = 'test12345';
const IS_TEST = true;

export async function fetchBookings(data: FetchBookingsParams) : Promise<APIResponse> {
  try {
    const response: APIResponse = await serverAPI.post('/api/barber/FetchBookings', data, {
      headers: {
        TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        DeviceToken: DEVICE_TOKEN,
        IsTest: String(IS_TEST)
      }
    });
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

export async function cancelCallout(callOutId: number) : Promise<APIResponse> {
  try {
    const response: APIResponse = await serverAPI.post('/company/CompanyCancelCallout', { callOutId });
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

export async function deleteBlockHour(blockHourId: number) : Promise<APIResponse> {
  try {
    const response: APIResponse = await serverAPI.delete(`/api/barber/DeleteBlockHour?Id=${blockHourId}`);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

export async function calendarBooking(data: BookingRequestPayload) : Promise<APIResponse> {
  try {
    console.log('[calendarBooking] 🔍 Calling API:', {
      endpoint: '/Booking/CalendarBooking',
      payload: data,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    const response: APIResponse = await serverAPI.post('/Booking/CalendarBooking', data, {
      headers: {
        TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
    
    console.log('[calendarBooking] 📥 API Response:', {
      Status: response.Status,
      Message: response.Message,
      response: response
    });
    
    return response;
  } catch (err: any) {
    console.error('[calendarBooking] ❌ API Error:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      requestData: JSON.stringify(data, null, 2),
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    });
    
    // Extract error message from various possible locations
    const errorMessage = 
      err.response?.data?.Message || 
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.response?.statusText || 
      err.message ||
      'Unknown error occurred';
      
    console.error('[calendarBooking] ❌ Extracted error message:', errorMessage);
    
    return {
      Status: err.response?.status || 500, 
      Message: errorMessage
    };
  }
}

export async function exportCalendar(data: any) : Promise<any> {
  try {
    const response: any = await serverAPI.post('/company/exportcalendar', data, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, blob: new Blob()};
  }
}