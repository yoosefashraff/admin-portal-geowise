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
    const errorMessage = err.response?.statusText || err.message;
    throw new Error(errorMessage || "Failed to fetch providers");
  }
}

export async function getbarberavilabelbookingdate(data : barberAvilabelDatePayload) : Promise<{List : string[]}>{
  try {
    const response : {List : string[]} = await serverAPI.post('/search/getbarberavilabelbookingdate', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    throw new Error(errorMessage || "Failed to fetch barber availability");
  }
}

export async function getbarbertimeslotslist(data : barberTimesLotsListPayload) : Promise<{List : string[]}>{
  try {
    const response : {List : string[]} = await serverAPI.post('/search/getbarbertimeslotslist', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    throw new Error(errorMessage || "Failed to fetch time slots");
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

export async function addCustomerBookings(data : SchedulerSubmitData) : Promise<{Status : number, Message : string}>{
  try {
    const response : {Status : number, Message : string} = await serverAPI.post('/company/addcustomerbookings', data);
    return {Status : response.Status, Message : response.Message};
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status : 500, Message : errorMessage};
  }
}