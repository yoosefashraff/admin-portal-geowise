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
    const response: ProviderResponse = await serverAPI.post('/company/getallprovidersforcompany', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, List: [], TotalCount: 0};
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
    const response: {Status: number, Message: string, Object: Provider[]} = await serverAPI.post('/company/FetchProviderByCompanyId', {CompanyAdminId});
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, Object: []};
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