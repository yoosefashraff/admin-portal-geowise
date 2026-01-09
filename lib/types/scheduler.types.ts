export interface Service {
  Id: number,
  ServiceName: string,
  Duration: number,
  Price: number,
  PriceType: string,
  Type: number,
  CurrencyId: number,
  CurrencyCode: string,
  CompanyAdminId: number
}

export interface NewService {
  Id: null,
  ServiceName: string
  Duration: number,
  Price: number,
  PriceType: string,
  Type: number,
  CurrencyId: number,
  CurrencyCode: string,
  Currency: string | null,
  ServiceIdReturned: number,
  CompanyAdminId: number
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  street_address: string;
  city: string;
  state: string;
  zipCode: string;
  address: string
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Customer {
    Id?: number | null,
    Name: string,
    Email: string | null,
    Image?: string | null,
    ImageThumb?: string | null
    Address?: string | null,
    Contact: string | null,
    CountryCode: string | null,
    ChatDialog?: string | null,
    AppUserId?: string | null,
    TimeZone?: string | null
}

export interface Appointment {
  id: string;
  serviceId: string;
  locationId: string;
  providerId: string;
  clientId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulerData {
  ServiceId: string | string[];
  CustomerId: string | null;
  Date: string;
  TimingSlot: string;
  Name: string;
  PhoneNumber: string;
  Email: string;
  CountryCode: string;
  Address: string;
  Lat: number;
  Lng: number;
  ProviderId: string;
  CompanyUserId: number;
  AssociationType: number;
  IsBarberBooking: boolean;
  StreetAddress: string,
  City: string, 
  State: string, 
  Zipcode: string,
  ServiceZoneId: number
}

export interface SchedulerSubmitData {
  ServiceId: string;
  CustomerId: string | null;
  Date: string;
  TimingSlot: string;
  Name: string;
  PhoneNumber: string;
  Email: string;
  CountryCode: string;
  Address: string;
  Lat: string | number;
  Lng: string | number;
  ProviderId: string;
  CompanyUserId: number;
  AssociationType: number;
  IsBarberBooking: boolean;
}

export interface BookingConfirmed {
  ServiceId: string;
  CustomerId: string | null;
  Date: string;
  TimingSlot: string;
  Name: string;
  PhoneNumber: string;
  Email: string;
  CountryCode: string;
  Address: string;
  Lat: string | number;
  Lng: string | number;
  ProviderId: string;
  CompanyUserId: number;
  AssociationType: number;
  IsBarberBooking: boolean;
  ServiceZoneId: string;
  ProviderName: string,
  ProfileImage: string,
  Services: Service[]
}

export interface LocationSelectProps {
  StreetAddress: string, 
  City: string, 
  State: string, 
  Zipcode: string
}


export interface CompanyProviderPayload{
  ServiceId: string | string[],
  CompanyId: number,
  CustomerLat: number,
  CustomerLng: number
}

export interface barberAvilabelDatePayload{
  BarberId: number,
  FromDate: string,
  ToDate: string,
  ServiceZoneId: number,
  AssociationType: number,
  CompanyAdminId: number,
  TimeZone: string
}

export interface barberTimesLotsListPayload{
  BarberId: number,
  Date: string,
  BookingType: number,
  ServiceId: number,
  Lat: number,
  Lng: number,
  AssociationType: number,
  CompanyAdminId: number,
  TimeZone: string
}

export interface MonthGroup {
  month: string;
  dates: string[];
}

export interface ServicePayload{
  ServiceName: string,
  Price: number,
  Duration: number,
  Type: number,
  PriceType: string,
  CompanyAdminId: number
}