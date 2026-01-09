export interface ProvidersForCompanyPayload {
  CompanyAdminId: number,
  PageNo: number,
  RecordsPerPage: number
}
export interface Provider {
  TotalBookings: string,
  ProviderName: string,
  ProviderId: number,
  ProfileImage: string,
  IsEmailVerified: boolean,
  ConfirmationDate: string | null,
  CreationDate: string | null,
  ZoneCoords: string[],
  ZoneName: string[],
  ServiceZoneId: number[],
  Distance: string,
  isInsideZone?: boolean
}

export interface ProviderLinkedServices{
  IsLinkedToService: boolean,
  ProfileImage: string,
  ProviderId: number,
  ProviderName: string
}

export interface  ProviderLinkedServicesResponse{
  Status: number,
  Message: string,
  Object: ProviderLinkedServices[]
}