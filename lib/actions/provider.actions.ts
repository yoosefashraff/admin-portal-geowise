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
  try {
    const response: {Status: number, Message: string} = await serverAPI.delete(`/Company/DeleteProvider`, {params: {userId: providerId}});
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}