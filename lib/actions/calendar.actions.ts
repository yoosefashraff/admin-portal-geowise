"use server";

import serverAPI from "@/lib/api/axios-server";
import { APIResponse, BookingRequestPayload, FetchBookingsParams } from "@/lib/types/calendar";
import { convertTo12Hour } from "@/lib/utils";

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

export async function saveProviderAvailability(data: {
  ProviderId: number;
  Availability: Array<{
    day: string;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
    breakTimes: Array<{ start: string; end: string }>;
  }>;
}) : Promise<APIResponse> {
  try {
    // Based on old admin portal: saves each day individually using /company/UpdateCalloutHours
    // Payload format: { Model: { Id, Day, OpeningHours, ClosingHours, IsClosed, BreakHoursList }, ProviderId }
    // Try both endpoint variations (old portal uses lowercase 'company' for UpdateCalloutHours)
    const possibleEndpoints = [
      '/company/UpdateCalloutHours',  // lowercase 'company', "Callout" not "CallOut"
      '/Company/UpdateCalloutHours',  // capital 'Company' (some endpoints use this)
      '/company/UpdateCallOutHours',  // "CallOut" with capital O
    ];
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    let workingEndpoint: string | null = null;
    
    // Save each day individually (matching old portal behavior)
    for (const dayData of data.Availability) {
      let daySaved = false;
      
      // Try each endpoint until one works
      for (const endpoint of possibleEndpoints) {
        if (daySaved) break;
        
        try {
          // Convert times to 12-hour format (matching old portal)
          const openingHours = convertTo12Hour(dayData.startTime);
          const closingHours = convertTo12Hour(dayData.endTime);
          
          // Format break hours list (matching old portal structure)
          const breakHoursList = dayData.breakTimes.map(bt => ({
            BreakStartHours: convertTo12Hour(bt.start),
            BreakEndHours: convertTo12Hour(bt.end)
          }));
          
          // Build Model payload (matching old portal structure)
          // Note: When IsClosed=true, OpeningHours/ClosingHours might still be required or might be ignored
          const model: any = {
            Id: null, // null for new records (backend will assign ID or update existing)
            Day: dayData.day,
            IsClosed: !dayData.isAvailable, // Invert: isAvailable=false means IsClosed=true
            BreakHoursList: breakHoursList
          };
          
          // Only include OpeningHours/ClosingHours if day is open (matching old portal behavior)
          if (dayData.isAvailable) {
            model.OpeningHours = openingHours;
            model.ClosingHours = closingHours;
          } else {
            // For closed days, still send times (old portal might require them)
            model.OpeningHours = openingHours;
            model.ClosingHours = closingHours;
          }
          
          const payload = {
            Model: model,
            ProviderId: data.ProviderId
          };
          
          console.log('[saveProviderAvailability] 💾 Saving day:', {
            day: dayData.day,
            endpoint,
            payload: JSON.stringify(payload, null, 2)
          });
          
          const response: APIResponse = await serverAPI.post(endpoint, payload);
          
          console.log('[saveProviderAvailability] 📥 Response for', dayData.day, ':', {
            Status: response.Status,
            Message: response.Message,
            endpoint
          });
          
          if (response.Status === 200 || response.Status === 201) {
            successCount++;
            daySaved = true;
            if (!workingEndpoint) workingEndpoint = endpoint;
            console.log('[saveProviderAvailability] ✅ Saved day:', dayData.day, 'using endpoint:', endpoint);
            break; // Success, move to next day
          } else if (response.Status === 404) {
            // Endpoint not found, try next one
            console.log('[saveProviderAvailability] ⚠️ Endpoint 404, trying next:', endpoint);
            continue;
          } else {
            // Other error - log and try next endpoint
            console.error('[saveProviderAvailability] ❌ Error response:', {
              day: dayData.day,
              endpoint,
              Status: response.Status,
              Message: response.Message
            });
            continue;
          }
          
        } catch (err: any) {
          // If 404, try next endpoint
          if (err.response?.status === 404) {
            console.log('[saveProviderAvailability] ⚠️ Endpoint 404 (exception), trying next:', endpoint);
            continue;
          }
          
          // Other errors - log and try next endpoint
          console.error('[saveProviderAvailability] ❌ Exception:', {
            day: dayData.day,
            endpoint,
            status: err.response?.status,
            message: err.message,
            data: err.response?.data
          });
          continue;
        }
      }
      
      // If we tried all endpoints and none worked
      if (!daySaved) {
        errorCount++;
        const errorMsg = `${dayData.day}: All endpoints failed`;
        errors.push(errorMsg);
        console.error('[saveProviderAvailability] ❌ Failed to save day after trying all endpoints:', dayData.day);
      }
      
      // Small delay between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Return success if all days saved, otherwise return error
    if (errorCount === 0) {
      return {
        Status: 201,
        Message: `Successfully saved availability for ${successCount} day(s)`
      };
    } else {
      return {
        Status: 500,
        Message: `Saved ${successCount} day(s), failed ${errorCount} day(s): ${errors.join('; ')}`
      };
    }
    
  } catch (err: any) {
    console.error('[saveProviderAvailability] ❌ Unexpected error:', {
      message: err.message,
      stack: err.stack,
      providerId: data.ProviderId
    });
    
    return {
      Status: 500,
      Message: err.message || 'An unexpected error occurred while saving provider availability'
    };
  }
}

export async function calendarBooking(data: BookingRequestPayload) : Promise<APIResponse> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  try {
    // Log incoming request from UI
    console.log('[calendarBooking] 📥 INCOMING REQUEST FROM UI:', {
      requestId,
      timestamp,
      endpoint: '/Booking/CalendarBooking',
      payload: JSON.stringify(data, null, 2),
      payloadSummary: {
        ProviderId: data.ProviderId,
        Date: data.Date,
        Time: data.Time,
        ServiceId: data.ServiceId,
        CustomerName: data.CustomerName,
        PhoneNumber: data.PhoneNumber,
        CountryCode: data.CountryCode,
        CompanyUserId: data.CompanyUserId,
        Address: data.Address,
        EndTime: data.EndTime,
        Note: data.Note
      },
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      note: 'This is the payload received from the UI (Next.js client)'
    });
    
    // Prepare payload to send to Web API backend
    const webApiPayload = {
      ProviderId: data.ProviderId,
      Date: data.Date,
      Time: data.Time,
      ServiceId: data.ServiceId,
      EndTime: data.EndTime || '',
      CustomerName: data.CustomerName,
      PhoneNumber: data.PhoneNumber,
      CountryCode: data.CountryCode,
      CompanyUserId: data.CompanyUserId,
      Address: data.Address,
      Note: data.Note || ''
    };
    
    // Log payload being sent to Web API backend
    console.log('[calendarBooking] 📤 SENDING TO WEB API BACKEND:', {
      requestId,
      timestamp,
      webApiUrl: process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_API_URL || 'unknown',
      endpoint: '/Booking/CalendarBooking',
      payload: JSON.stringify(webApiPayload, null, 2),
      payloadSummary: {
        ProviderId: webApiPayload.ProviderId,
        Date: webApiPayload.Date,
        Time: webApiPayload.Time,
        ServiceId: webApiPayload.ServiceId,
        EndTime: webApiPayload.EndTime,
        CustomerName: webApiPayload.CustomerName,
        PhoneNumber: webApiPayload.PhoneNumber,
        CountryCode: webApiPayload.CountryCode,
        CompanyUserId: webApiPayload.CompanyUserId,
        Address: webApiPayload.Address,
        Note: webApiPayload.Note
      },
      headers: {
        TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ContentType: 'application/json'
      },
      note: 'This is the payload being sent to the Web API backend (ASP.NET)'
    });
    
    const response: APIResponse = await serverAPI.post('/Booking/CalendarBooking', webApiPayload, {
      headers: {
        TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
    
    // Log successful response from Web API backend
    console.log('[calendarBooking] ✅ RESPONSE FROM WEB API BACKEND:', {
      requestId,
      timestamp,
      status: response.Status,
      message: response.Message,
      response: JSON.stringify(response, null, 2),
      responseSummary: {
        Status: response.Status,
        Message: response.Message,
        hasObject: !!response.Object,
        hasList: !!response.List,
        objectType: response.Object ? typeof response.Object : 'none',
        listLength: response.List ? (Array.isArray(response.List) ? response.List.length : 'not array') : 'none'
      },
      note: 'This is the response received from the Web API backend (ASP.NET)'
    });
    
    return response;
  } catch (err: any) {
    // Log detailed error information
    const errorDetails = {
      requestId,
      timestamp,
      errorType: err.name || 'Unknown',
      errorMessage: err.message,
      errorCode: err.code,
      httpStatus: err.response?.status,
      httpStatusText: err.response?.statusText,
      webApiResponseData: err.response?.data ? JSON.stringify(err.response.data, null, 2) : 'no response data',
      requestPayload: JSON.stringify(data, null, 2),
      requestPayloadSummary: {
        ProviderId: data.ProviderId,
        Date: data.Date,
        Time: data.Time,
        ServiceId: data.ServiceId,
        CustomerName: data.CustomerName,
        PhoneNumber: data.PhoneNumber,
        CountryCode: data.CountryCode
      },
      stack: err.stack,
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    };
    
    console.error('[calendarBooking] ❌ ERROR - REQUEST FAILED:', errorDetails);
    
    // Extract error message from various possible locations
    const errorMessage = 
      err.response?.data?.Message || 
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.response?.statusText || 
      err.message ||
      'Unknown error occurred';
    
    console.error('[calendarBooking] ❌ ERROR SUMMARY:', {
      requestId,
      timestamp,
      httpStatus: err.response?.status || 500,
      errorMessage,
      note: 'This error occurred when calling the Web API backend. Check the detailed error log above for full payload and response details.'
    });
    
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