import { CompanyService } from './service.types';

export interface ServiceGroup {
  Id: number;
  Name: string;
  GroupedServices?: CompanyService[];
}

export interface ServiceGroupResponse {
  Status: number;
  Message?: string;
  ID?: number;
  List?: ServiceGroup[];
  Object?: {
    Id: number;
    Name: string;
    GroupedServices?: CompanyService[];
  };
}

export interface AddServiceGroupRequest {
  Name: string;
  IsActive: boolean;
}

export interface UpdateServiceGroupRequest {
  Id: number;
  Name: string;
  IsActive: boolean;
}

export interface LinkServicesToGroupRequest {
  groupId: number;
  serviceIds: number[];
}
