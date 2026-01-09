export interface CompanyServicesPayload {
  CompanyAdminId: number,
  PageNo: number,
  RecordsPerPage: number
}

export interface CompanyService {
  Id: number,
  ServiceName: string,
  Duration: number,
  Price: number,
  CurrencyCode?: string,
  CurrencyId: number,
  PriceType: string,
  ProviderNames?: number[]
}

export interface CompanyServiceUpdatePayload extends CompanyService {
  companyAdminId: number
}

export interface LinkedProviderPayload {
  ProviderId: string,
  ServiceId: number,
  IsChecked: boolean
}