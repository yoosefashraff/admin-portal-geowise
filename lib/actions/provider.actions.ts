'use server';

import serverAPI from "../api/axios-server";
import { Provider, ProviderLinkedServicesResponse, ProvidersForCompanyPayload } from "../types/provider.types";
import { Service } from "../types/scheduler.types";

interface ProviderResponse {
    Status: number;
    Message: string;
    List: Provider[];
    TotalCount: number;
}

export async function getAllProvidersForCompany(data: ProvidersForCompanyPayload) : Promise<ProviderResponse> {
  try {
    console.log('[getAllProvidersForCompany] 🔍 Calling API with:', {
      CompanyAdminId: data.CompanyAdminId,
      PageNo: data.PageNo,
      RecordsPerPage: data.RecordsPerPage
    });
    const response: ProviderResponse = await serverAPI.post('/company/getallprovidersforcompany', data);
    console.log('[getAllProvidersForCompany] ✅ API Response:', {
      Status: response.Status,
      Message: response.Message,
      ListLength: response.List?.length || 0,
      TotalCount: response.TotalCount
    });
    return response;
  } catch (err: any) {
    console.error('[getAllProvidersForCompany] ❌ Error:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      isTimeout: err.code === 'ECONNABORTED' || err.message?.includes('timeout'),
      isNetworkError: err.code === 'ERR_NETWORK' || err.message === 'Network Error'
    });
    
    const errorMessage = err.response?.statusText || err.message || 'Failed to fetch providers';
    
    // Return error response instead of throwing to prevent server action 500 error
    return {
      Status: err.response?.status || 500, 
      Message: errorMessage, 
      List: [], 
      TotalCount: 0
    };
  }
}

export async function getProviderByCompanyIdByLinkedServices(data: {CompanyAdminId: number, ServiceId: number}) : Promise<ProviderLinkedServicesResponse> {
  try {
    const response: ProviderLinkedServicesResponse = await serverAPI.post('/Company/FetchProviderByCompanyIdByLinkedServices', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, Object: []};
  }
}

export async function fetchProviderByCompanyId(CompanyAdminId: number) : Promise<{Status: number, Message: string, Object: Provider[]}> {
  try {
    console.log('[fetchProviderByCompanyId] 🔍 Calling API with CompanyAdminId:', CompanyAdminId);
    const response: {Status: number, Message: string, Object: Provider[]} = await serverAPI.post('/company/FetchProviderByCompanyId', {CompanyAdminId});
    console.log('[fetchProviderByCompanyId] ✅ API Response:', {
      Status: response.Status,
      Message: response.Message,
      ObjectLength: response.Object?.length || 0
    });
    return response;
  } catch (err: any) {
    console.error('[fetchProviderByCompanyId] ❌ Error:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      isTimeout: err.code === 'ECONNABORTED' || err.message?.includes('timeout'),
      isNetworkError: err.code === 'ERR_NETWORK' || err.message === 'Network Error'
    });
    
    const errorMessage = err.response?.statusText || err.message || 'Failed to fetch providers';
    
    // Return error response instead of throwing to prevent server action 500 error
    return {
      Status: err.response?.status || 500, 
      Message: errorMessage, 
      Object: []
    };
  }
}

export async function getCompanyProviderServices(data: { CompanyAdminId: number, ProviderId: number }) : Promise<{Status: number, Message: string, Object: Service[]}> {
  try {
    const response: {Status: number, Message: string, Object: Service[]} = await serverAPI.get('/company/GetCompanyProviderServices', {params: data});
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, Object: []};
  }
}

export async function deleteProvider(providerId: number) : Promise<{Status: number, Message: string}> {
  // Try multiple endpoint patterns based on codebase conventions
  // Some endpoints use DELETE, others use POST for delete operations
  // Pattern examples from codebase:
  // - /Service/deletecompanyservice (POST with {serviceId})
  // - /company/deletecompanyservicezone (POST with {ServiceZoneId})
  // - /ServiceGroup/Delete?id={id} (DELETE with query param)
  const possibleEndpoints = [
    // POST method patterns (most common in this codebase for delete operations)
    { method: 'POST' as const, url: `/company/deleteprovider`, data: { userId: providerId } },      // Lowercase pattern (like deletecompanyservicezone)
    { method: 'POST' as const, url: `/company/deleteprovider`, data: { id: providerId } },          // Lowercase with 'id'
    { method: 'POST' as const, url: `/company/deleteprovider`, data: { providerId: providerId } },  // Lowercase with 'providerId'
    { method: 'POST' as const, url: `/company/DeleteProvider`, data: { userId: providerId } },     // Capital D, lowercase c
    { method: 'POST' as const, url: `/company/DeleteProvider`, data: { id: providerId } },         // Capital D, lowercase c, with 'id'
    { method: 'POST' as const, url: `/company/DeleteProvider`, data: { providerId: providerId } }, // Capital D, lowercase c, with 'providerId'
    { method: 'POST' as const, url: `/Company/DeleteProvider`, data: { userId: providerId } },      // Capital C and D
    { method: 'POST' as const, url: `/Company/deleteprovider`, data: { userId: providerId } },      // Capital C, lowercase d
    // DELETE method patterns
    { method: 'DELETE' as const, url: `/company/DeleteProvider?userId=${providerId}` },             // Current pattern
    { method: 'DELETE' as const, url: `/Company/DeleteProvider?userId=${providerId}` },             // Capital C pattern
    { method: 'DELETE' as const, url: `/company/DeleteProvider?id=${providerId}` },                  // Using 'id' instead of 'userId'
    { method: 'DELETE' as const, url: `/company/DeleteProvider?providerId=${providerId}` },         // Using 'providerId'
    { method: 'DELETE' as const, url: `/Company/DeleteProvider?id=${providerId}` },                  // Capital C + id
    { method: 'DELETE' as const, url: `/company/deleteprovider?userId=${providerId}` },              // Lowercase pattern
  ];
  
  let lastError: any = null;
  let attemptedEndpoints: string[] = [];
  
  for (const endpoint of possibleEndpoints) {
    try {
      const endpointStr = endpoint.method === 'DELETE' 
        ? endpoint.url 
        : `${endpoint.url} (POST with ${JSON.stringify(endpoint.data)})`;
      attemptedEndpoints.push(endpointStr);
      
      console.log('[deleteProvider] 🔍 Trying endpoint:', {
        method: endpoint.method,
        url: endpoint.url,
        providerId,
        attempt: attemptedEndpoints.length,
        totalAttempts: possibleEndpoints.length
      });
      
      let response: {Status: number, Message: string};
      
      if (endpoint.method === 'DELETE') {
        response = await serverAPI.delete(endpoint.url);
      } else {
        response = await serverAPI.post(endpoint.url, endpoint.data);
      }
      
      // If we get a successful response (200/201), use it
      if (response.Status === 200 || response.Status === 201) {
        console.log('[deleteProvider] ✅ Success with endpoint:', {
          method: endpoint.method,
          url: endpoint.url,
          Status: response.Status,
          Message: response.Message
        });
        return response;
      }
      
      // If it's a 404, try next endpoint
      if (response.Status === 404) {
        console.log('[deleteProvider] ⚠️ Endpoint not found, trying next:', endpointStr);
        lastError = { response: { status: 404 }, message: `Endpoint returned 404` };
        continue;
      }
      
      // Other status codes - return the response
      return response;
      
    } catch (err: any) {
      lastError = err;
      
      // If it's a 404, try the next endpoint
      if (err.response?.status === 404) {
        console.log('[deleteProvider] ⚠️ Endpoint returned 404, trying next:', endpoint.url);
        continue;
      }
      
      // For non-404 errors, return immediately (might be auth, validation, etc.)
      console.error('[deleteProvider] ❌ Non-404 error on endpoint:', {
        method: endpoint.method,
        url: endpoint.url,
        status: err.response?.status,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.Message || err.response?.statusText || err.message;
      return {
        Status: err.response?.status || 500,
        Message: errorMessage
      };
    }
  }
  
  // All endpoints returned 404
  console.error('[deleteProvider] ❌ All endpoints returned 404:', {
    attemptedEndpoints,
    providerId
  });
  
  return {
    Status: 404,
    Message: `No valid endpoint found for deleting provider. Attempted endpoints: ${attemptedEndpoints.join(', ')}. Please check backend API documentation or contact the backend team to provide the correct endpoint name.`
  };
}