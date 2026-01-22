'use server';

import {barberAvilabelDatePayload, barberTimesLotsListPayload, CompanyProviderPayload, Customer, NewService, SchedulerSubmitData, Service, ServicePayload} from "@/lib/types/scheduler.types";
import serverAPI from "@/lib/api/axios-server";
import { Provider } from "../types/provider.types";

export async function getServices(data: { companyadminId: number }) : Promise<{Status: number, Message: string, Object: Service[]}> {
  try {
    const response: {Status: number, Message: string, Object: Service[]} = await serverAPI.get('/company/getservices', {params: data});
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, Object: []};
  }
}

export async function addServices(data: ServicePayload) : Promise<{Service: NewService | null, Status: number, Message : string}> {
  try {
    const response : {Service: NewService | null, Status: number, Message : string} = await serverAPI.post('/company/addservices', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, Service: null};
  }
}

export async function searchCompanyProvider(data: CompanyProviderPayload) : Promise<{Object: Provider[]}> {
  try {
    const response : {Object: Provider[]} = await serverAPI.post('/company/searchcompanyprovider', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message || "Failed to fetch providers";
    // Return error response instead of throwing to prevent server action 500 error
    console.error('[searchCompanyProvider] ❌ Error:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    });
    return {Object: []};
  }
}

export async function getbarberavilabelbookingdate(data : barberAvilabelDatePayload) : Promise<{List : string[]}>{
  try {
    console.warn('📅 Fetching available booking dates:', data);
    const response : {List : string[]} = await serverAPI.post('/search/getbarberavilabelbookingdate', data, {
      // Override default 60s timeout – availability lookups can legitimately take longer
      timeout: 0, // 0 = no timeout in axios
    });
    console.warn('✅ Available dates response:', response);
    return response;
  } catch (err: any) {
    console.error('❌ Error fetching barber availability:', {
      error: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    });
    const errorMessage = err.response?.statusText || err.message || "Failed to fetch barber availability";
    throw new Error(errorMessage);
  }
}

export async function getbarbertimeslotslist(data : barberTimesLotsListPayload) : Promise<{List : string[]}>{
  try {
    console.warn('⏰ Fetching time slots list:', data);
    const response : {List : string[]} = await serverAPI.post('/search/getbarbertimeslotslist', data, {
      // Override default 60s timeout – slot generation can be slow on backend
      timeout: 0,
    });
    console.warn('✅ Time slots response:', response);
    return response;
  } catch (err: any) {
    console.error('❌ Error fetching time slots:', {
      error: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    });
    const errorMessage = err.response?.statusText || err.message || "Failed to fetch time slots";
    throw new Error(errorMessage);
  }
}

export async function listcustomerforscheduler(data: { providerId: number }) : Promise<{Response: Customer[]}> {
  try {
    const response: {Response: Customer[]} = await serverAPI.get('/company/listcustomerforscheduler', {params: data});
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    throw new Error(errorMessage || "Failed to fetch customer");
  }
}

export interface CreateCustomerPayload {
  Name: string;
  PhoneNumber: string;
  CountryCode: string;
  Email: string;
  Address: string;
  Lat?: number;
  Lng?: number;
  CompanyUserId: number;
}

export interface CreateCustomerResponse {
  Status: number;
  Message?: string;
  CustomerId?: number;
  Customer?: Customer;
}

export interface GetCustomerByPhoneResponse {
  Status: number;
  Message?: string;
  Object?: {
    UserId: number;
    FullName: string;
    Address?: string;
  };
}

/**
 * Get customer information by phone number and country code
 * GET /company/GetCustomerByPhoneAndType
 */
export async function getCustomerByPhoneAndType(
  phoneNumber: string,
  countryCode: string,
  userType: number = 2
): Promise<GetCustomerByPhoneResponse> {
  try {
    console.log('[getCustomerByPhoneAndType] 🔍 Looking up customer:', {
      phoneNumber,
      countryCode,
      userType
    });

    const response: GetCustomerByPhoneResponse = await serverAPI.get(
      '/company/GetCustomerByPhoneAndType',
      {
        params: {
          PhoneNumber: phoneNumber,
          CountryCode: countryCode,
          userType: userType
        }
      }
    );

    console.log('[getCustomerByPhoneAndType] 📥 Response:', {
      Status: response.Status,
      Message: response.Message,
      hasCustomer: !!response.Object
    });

    return response;
  } catch (err: any) {
    console.error('[getCustomerByPhoneAndType] ❌ Error:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    });

    const errorMessage = err.response?.data?.Message || err.response?.statusText || err.message;
    return {
      Status: err.response?.status || 500,
      Message: errorMessage
    };
  }
}

/**
 * Create a new customer in the database.
 * This should be called before creating a booking to ensure the customer exists.
 * 
 * TODO: Update the endpoint when backend API is ready.
 * Expected endpoint: /company/createcustomer or /company/addcustomer
 */
export async function createCustomer(data: CreateCustomerPayload): Promise<CreateCustomerResponse> {
  try {
    console.log('[createCustomer] 🔍 Creating customer:', {
      Name: data.Name,
      PhoneNumber: data.PhoneNumber,
      CountryCode: data.CountryCode,
      Email: data.Email,
      Address: data.Address,
      CompanyUserId: data.CompanyUserId
    });

    // TODO: Replace with actual endpoint when backend API is ready
    // For now, try common endpoint patterns
    // If endpoint doesn't exist, backend developer will provide the correct one
    const response: CreateCustomerResponse = await serverAPI.post('/company/createcustomer', data);
    
    console.log('[createCustomer] 📥 Response received:', {
      Status: response.Status,
      Message: response.Message,
      CustomerId: response.CustomerId
    });
    
    return response;
  } catch (err: any) {
    console.error('[createCustomer] ❌ Error:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      requestData: data
    });
    
    // If endpoint doesn't exist (404), return a helpful error
    if (err.response?.status === 404) {
      return {
        Status: 404,
        Message: 'Customer creation endpoint not found. Please check with backend developer for the correct endpoint.'
      };
    }
    
    const errorMessage = err.response?.data?.Message || err.response?.statusText || err.message;
    return {
      Status: err.response?.status || 500,
      Message: errorMessage
    };
  }
}

export async function addCustomerBookings(data : SchedulerSubmitData) : Promise<{Status : number, Message : string}>{
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  try {
    // Log incoming request from UI
    console.log('[addCustomerBookings] 📥 INCOMING REQUEST FROM UI:', {
      requestId,
      timestamp,
      endpoint: '/company/addcustomerbookings',
      payload: JSON.stringify(data, null, 2),
      payloadSummary: {
        Name: data.Name,
        PhoneNumber: data.PhoneNumber,
        CountryCode: data.CountryCode,
        Email: data.Email,
        ServiceId: data.ServiceId,
        CustomerId: data.CustomerId,
        Address: data.Address,
        CompanyUserId: data.CompanyUserId,
        Date: data.Date,
        TimingSlot: data.TimingSlot,
        DateFormat: 'YYYY-MM-DD',
        TimingSlotFormat: 'HH:MM AM/PM-HH:MM AM/PM (e.g., "09:00 AM-05:00 PM")',
        DateLength: data.Date?.length,
        TimingSlotLength: data.TimingSlot?.length,
        DateType: typeof data.Date,
        TimingSlotType: typeof data.TimingSlot
      },
      note: 'This is the payload received from the UI (Next.js client)'
    });
    
    // Prepare payload to send to Web API backend
    const webApiPayload = {
      Name: data.Name,
      PhoneNumber: data.PhoneNumber,
      CountryCode: data.CountryCode,
      Email: data.Email || '',
      ServiceId: data.ServiceId,
      CustomerId: data.CustomerId,
      Address: data.Address,
      CompanyUserId: data.CompanyUserId,
      Date: data.Date,
      TimingSlot: data.TimingSlot
    };
    
    // Log payload being sent to Web API backend
    console.log('[addCustomerBookings] 📤 SENDING TO WEB API BACKEND:', {
      requestId,
      timestamp,
      webApiUrl: process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_API_URL || 'unknown',
      endpoint: '/company/addcustomerbookings',
      payload: JSON.stringify(webApiPayload, null, 2),
      payloadSummary: {
        Name: webApiPayload.Name,
        PhoneNumber: webApiPayload.PhoneNumber,
        CountryCode: webApiPayload.CountryCode,
        Email: webApiPayload.Email,
        ServiceId: webApiPayload.ServiceId,
        CustomerId: webApiPayload.CustomerId,
        Address: webApiPayload.Address,
        CompanyUserId: webApiPayload.CompanyUserId,
        Date: webApiPayload.Date,
        TimingSlot: webApiPayload.TimingSlot
      },
      note: 'This is the payload being sent to the Web API backend (ASP.NET)'
    });
    
    const response : {Status : number, Message : string} = await serverAPI.post('/company/addcustomerbookings', webApiPayload);
    
    // Log successful response from Web API backend
    console.log('[addCustomerBookings] ✅ RESPONSE FROM WEB API BACKEND:', {
      requestId,
      timestamp,
      status: response.Status,
      message: response.Message,
      response: JSON.stringify(response, null, 2),
      responseSummary: {
        Status: response.Status,
        Message: response.Message
      },
      note: 'This is the response received from the Web API backend (ASP.NET)'
    });
    
    return {Status : response.Status, Message : response.Message};
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
        Name: data.Name,
        PhoneNumber: data.PhoneNumber,
        CountryCode: data.CountryCode,
        ServiceId: data.ServiceId,
        CustomerId: data.CustomerId,
        Date: data.Date,
        TimingSlot: data.TimingSlot
      },
      stack: err.stack,
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    };
    
    console.error('[addCustomerBookings] ❌ ERROR - REQUEST FAILED:', errorDetails);
    
    // Extract error message
    const errorMessage = err.response?.data?.Message || err.response?.statusText || err.message;
    
    console.error('[addCustomerBookings] ❌ ERROR SUMMARY:', {
      requestId,
      timestamp,
      httpStatus: err.response?.status || 500,
      errorMessage,
      note: 'This error occurred when calling the Web API backend. Check the detailed error log above for full payload and response details. If error mentions DateTime, check Date and TimingSlot formats.'
    });
    
    return {Status : err.response?.status || 500, Message : errorMessage};
  }
}