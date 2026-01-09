"use server";

import serverAPI from "../api/axios-server";
import { User } from "../types/auth.types";
import { CompanyDetails } from "../types/profile.types";

export async function getCompanyDetails(data: {userId: number}) : Promise<{Status: number, Message: string, Object: CompanyDetails}> {
  try {
    const response: {Status: number, Message: string, Object: CompanyDetails} = await serverAPI.post('/Company/FetchCompanyDetails', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage, Object: {} as CompanyDetails};
  }
}

export async function saveCompanyBiography(data: {BarberId: number, Description: string}) : Promise<{Status: number, Message: string}> {
  try {
    const response: {Status: number, Message: string} = await serverAPI.post('/Company/SaveCompanyBiography', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

export async function uploadWorkspaceImages(data: FormData) : Promise<{Status: number, Message: string}> {
  try {
    const response: {Status: number, Message: string} = await serverAPI.post(
      '/Provider/Home/UploadImages', 
      data, 
      {
        headers: {'Content-Type': 'multipart/form-data'}
      }
    );
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

export async function addPaymentType(data: {PaymentType: string, CompanyUserId: number}) : Promise<{Status: number, Message: string}> {
  try {
    const response: {Status: number, Message: string} = await serverAPI.post('/Company/AddPaymentType', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}

export async function addAdminUserLocation(data: {CompanyUserId: number, Latitude: number, Longitude: number}) : Promise<{Status: number, Message: string}> {
  try {
    const response: {Status: number, Message: string} = await serverAPI.post('/Company/AddAdminUserLocation', data);
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
  }
}