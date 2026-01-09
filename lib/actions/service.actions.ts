'use server';

import serverAPI from "../api/axios-server";
import { CompanyService, CompanyServicesPayload, CompanyServiceUpdatePayload, LinkedProviderPayload } from "@/lib/types/service.types";

interface ServicesForCompanyResponse {
    Status: number;
    Message: string;
    List: CompanyService[];
    TotalCount: number;
}

export async function getServicesForCompany(data: CompanyServicesPayload) : Promise<ServicesForCompanyResponse> {
  try {
    const response: ServicesForCompanyResponse = await serverAPI.post('/company/getallservicesforcompany', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, List: [], TotalCount: 0};
  }
}

export async function deleteCompanyService({serviceId}: {serviceId: number}) : Promise<{Message: string, Status: number}> {
  try {
    const response: {Message: string, Status: number} = await serverAPI.post('/Service/deletecompanyservice', {serviceId});
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

interface ServiceResponse {
    Status: number;
    Message: string;
    Object: CompanyService;
}

export async function getServiceByServiceId(data: {serviceId: number}) : Promise<ServiceResponse> {
  try {
    const response: ServiceResponse = await serverAPI.post('/company/fetchservicesbyserviceid', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, Object: {} as CompanyService};
  }
}

export async function updateCompanyService(data: CompanyServiceUpdatePayload) : Promise<{Status: number, Message: string}> {
  try {
    const response: {Status: number, Message: string} = await serverAPI.post('/company/addserviceswithlinkedproviders', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

export async function toggleLinkedProvider(data: LinkedProviderPayload) : Promise<{Status: number, Message: string}> {
  try {
    const response: {Status: number, Message: string} = await serverAPI.post('/Company/ToggleLinkedProvider', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

