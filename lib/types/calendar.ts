export interface Barber {
  UserID: string;
  FullName: string;
  UserName: string;
  ImageUrl: string;
  Callouts: Callout[];
}

export interface Callout {
  Id: number;
  BlockHourId?: number;
  BookingDate: string;
  TimeSlot: string;
  Customer?: string;
  ServiceName?: string;
  Address?: string;
}

export interface CalendarResource {
  id: string;
  title: string;
  extendedProps: {
    avatar: string;
    username: string;
  };
}

export interface CalendarEvent {
  id: string;
  resourceId: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  textColor: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
  display?: 'background' | 'auto';
  className?: string[];
  extendedProps: {
    time?: string;
    date?: string;
    services?: string;
    location?: string;
    customer?: string;
    calloutId?: number;
    blockHourId?: number;
    _dateKey?: string;
    isTravel?: boolean;
    gapMinutes?: number;
    fromBooking?: string;
    toBooking?: string;
    note?: string;
  };
}

export interface TimeSlotResult {
  start: string;
  end: string;
  startLocal: string;
  endLocal: string;
  localDate: string;
}

export interface APIResponse {
  Status: number;
  Object?: Barber[];
  Message?: string;
}

export interface ColorItem {
  Key: string;
  Value: string;
}

export interface FetchBookingsParams {
  StartDate: string;
  EndDate: string;
  IsOnlyConfirmed: boolean;
  CompanyAdminId: number;
}

export interface BookingRequestPayload {
  ProviderId: string,
  Date: string, // Format: YYYY-MM-DD
  Time: string, // Always send start time
  ServiceId: string, // 0 if not provided (for block hours)
  EndTime: string, // End time only for block hours (when ServiceId is 0)
  CustomerName: string,
  PhoneNumber: string, // Only the phone number part (without country code)
  CountryCode: string, // Country code separately
  CompanyUserId: string,
  Address: string,
  Note: string,
  CalloutId ?: number,
  BlockHourId ?: number
}