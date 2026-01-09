"use server";

import serverAPI from "@/lib/api/axios-server";
import { APIResponse, BookingRequestPayload, FetchBookingsParams } from "@/lib/types/calendar";

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

export async function calendarBooking(data: BookingRequestPayload) : Promise<APIResponse> {
  try {
    const response: APIResponse = await serverAPI.post('/Booking/CalendarBooking', data, {
      headers: {
        TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.statusText || err.message;
    return {Status: 500, Message: errorMessage};
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