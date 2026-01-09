import { Provider } from "./provider.types"

export interface ProviderZone{
  AssignedDays: string[] | null,
  ProviderName: string
}
export interface ServiceZone {
  ID: number,
  BarberId: number,
  Radius: number,
  Name: string,
  Coordinates: string,
  CreatedDate: string,
  AssignedDays: string[] | null,
  IsCustomerLocation: boolean,
  IsCustom: boolean,
  IsCompanyZone: boolean,
  Providers: Provider[] | null
}
export interface GetZonesCompanyPayload{
  CompanyAdminId: number,
  PageNo: number,
  RecordsPerPage: number
}
export interface GetZonesCompanyResponse{
  Status: number,
  Message: string,
  List: ServiceZone[],
  TotalCount: number
}

export interface ServiceZonePayload{
  CompanyAdminId: number,
  ProviderIds: number[],
  Days: string,
  ZoneName: string,
  Coords: string,
  ZoneId: number
}

export interface Point {
  P: string;
}

export interface Zone {
  id: string | number;
  name?: string;
  providers?: string[];
  points: Point[];
}