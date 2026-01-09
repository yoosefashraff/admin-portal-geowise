'use server';

import { GetZonesCompanyPayload, GetZonesCompanyResponse, ServiceZone, ServiceZonePayload } from "@/lib/types/zone.types";
import serverAPI from "../api/axios-server";


export async function getZonesForCompany(data: GetZonesCompanyPayload) : Promise<GetZonesCompanyResponse> {
  try {
    const response: GetZonesCompanyResponse = await serverAPI.post('/company/GetAllServiceZonesForCompany', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, List: [], TotalCount: 0};
  }
}

export async function deleteCompanyServiceZone({ServiceZoneId}: {ServiceZoneId: number}) : Promise<{Message: string, Status: number}> {
  try {
    const response: {Message: string, Status: number} = await serverAPI.post('/company/deletecompanyservicezone', {ServiceZoneId});
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

export async function addServiceZoneAssociatBarber(data: ServiceZonePayload) : Promise<{Status: number, Message : string}> {
  try {
    const response : {Status: number, Message : string} = await serverAPI.post('/company/associatezonetoprovideranddays', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

export async function getServiceZoneColorList() : Promise<{Status: number, Message: string, List: {Key: string, Value: string}[]}> {
  try {
    const response: {Status: number, Message: string, List: {Key: string, Value: string}[]} = await serverAPI.get('/servicezone/GetServiceZoneColorList');
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, List: []};
  }
}

export async function getServiceZoneByZoneId(data: {zoneId: number}) : Promise<{Status: number, Message: string, Response: ServiceZone}> {
  try {
    const response: {Status: number, Message: string, Response: ServiceZone} = await serverAPI.get('/company/getservicezonebyid/?id=' + data.zoneId);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, Response: {} as ServiceZone};
  }
}
