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
    console.warn('📅 Fetching available booking dates:', data);
    const response : {List : string[]} = await serverAPI.post('/search/getbarberavilabelbookingdate', data);
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
    const response : {List : string[]} = await serverAPI.post('/search/getbarbertimeslotslist', data);
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

export async function addCustomerBookings(data : SchedulerSubmitData) : Promise<{Status : number, Message : string}>{
  try {
    const response : {Status : number, Message : string} = await serverAPI.post('/company/addcustomerbookings', data);
    return {Status : response.Status, Message : response.Message};
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status : 500, Message : errorMessage};
  }
}