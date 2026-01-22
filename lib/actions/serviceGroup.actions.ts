'use server';

import serverAPI from "../api/axios-server";
import {
  ServiceGroup,
  ServiceGroupResponse,
  AddServiceGroupRequest,
  UpdateServiceGroupRequest,
  LinkServicesToGroupRequest,
} from "@/lib/types/serviceGroup.types";

export async function addServiceGroup(
  data: AddServiceGroupRequest
): Promise<ServiceGroupResponse> {
  // Try multiple endpoint patterns based on codebase conventions
  // According to API docs, the correct endpoint is POST /ServiceGroup/Add with { Name, IsActive }
  const possibleEndpoints = [
    // Correct format according to API documentation
    { method: 'POST' as const, url: '/ServiceGroup/Add', payload: { Name: data.Name, IsActive: data.IsActive } },
    // Fallback patterns (in case of casing issues)
    { method: 'POST' as const, url: '/servicegroup/Add', payload: { Name: data.Name, IsActive: data.IsActive } },
    { method: 'POST' as const, url: '/ServiceGroup/add', payload: { Name: data.Name, IsActive: data.IsActive } },
  ];
  
  let lastError: any = null;
  let attemptedEndpoints: string[] = [];
  
  for (const endpoint of possibleEndpoints) {
    try {
      const endpointStr = `${endpoint.method} ${endpoint.url} with payload: ${JSON.stringify(endpoint.payload)}`;
      attemptedEndpoints.push(endpointStr);
      
      console.log('[addServiceGroup] 🔍 Trying endpoint:', {
        method: endpoint.method,
        url: endpoint.url,
        payload: endpoint.payload,
        attempt: attemptedEndpoints.length,
        totalAttempts: possibleEndpoints.length
      });
      
      const response: ServiceGroupResponse = await serverAPI.post(endpoint.url, endpoint.payload);
      
      // If we get a successful response (200/201), use it
      if (response.Status === 200 || response.Status === 201) {
        console.log('[addServiceGroup] ✅ Success with endpoint:', {
          method: endpoint.method,
          url: endpoint.url,
          Status: response.Status,
          Message: response.Message,
          ID: response.ID
        });
        return response;
      }
      
      // If it's a 404, try next endpoint
      if (response.Status === 404) {
        console.log('[addServiceGroup] ⚠️ Endpoint not found, trying next:', endpointStr);
        lastError = { response: { status: 404 }, message: `Endpoint returned 404` };
        continue;
      }
      
      // Other status codes - return the response (might be validation error, etc.)
      console.log('[addServiceGroup] ⚠️ Endpoint returned non-success status:', {
        url: endpoint.url,
        Status: response.Status,
        Message: response.Message
      });
      return response;
      
    } catch (err: any) {
      lastError = err;
      
      // If it's a 404, try the next endpoint
      if (err.response?.status === 404) {
        console.log('[addServiceGroup] ⚠️ Endpoint returned 404, trying next');
        continue;
      }
      
      // For non-404 errors, log and continue to try other endpoints
      console.error('[addServiceGroup] ⚠️ Error on endpoint (will try next):', {
        method: endpoint.method,
        url: endpoint.url,
        status: err.response?.status,
        message: err.message,
        responseData: err.response?.data
      });
      
      // If it's not a 404, it might be a validation error - try next endpoint anyway
      // but keep track of the error in case all endpoints fail
      continue;
    }
  }
  
  // All endpoints failed
  console.error('[addServiceGroup] ❌ All endpoints failed:', {
    name: data.Name,
    attemptedEndpoints,
    totalAttempts: attemptedEndpoints.length,
    lastError: lastError?.message || lastError?.response?.data
  });
  
  const errorMessage = lastError?.response?.data?.Message 
    || lastError?.response?.statusText 
    || lastError?.message 
    || `Failed to add service group. Attempted endpoints: ${attemptedEndpoints.join(', ')}`;
  
  return {
    Status: lastError?.response?.status || 500,
    Message: errorMessage,
  };
}

export async function getServiceGroupList(): Promise<ServiceGroupResponse> {
  try {
    console.log('[getServiceGroupList] 🔄 Fetching service groups...');
    
    const response: ServiceGroupResponse = await serverAPI.get('/ServiceGroup/List');
    
    console.log('[getServiceGroupList] 📥 Response received:', {
      status: response.Status,
      message: response.Message,
      listLength: response.List?.length || 0,
    });
    
    return response;
  } catch (err: any) {
    console.error('[getServiceGroupList] ❌ Error:', {
      message: err.message,
      status: err.response?.status,
    });
    
    const errorMessage = err.response?.data?.Message || err.response?.statusText || err.message || 'Failed to fetch service groups';
    
    return {
      Status: err.response?.status || 500,
      Message: errorMessage,
      List: [],
    };
  }
}

export async function getServiceGroupById(id: number): Promise<ServiceGroupResponse> {
  try {
    console.log('[getServiceGroupById] 🔄 Fetching service group...', { id });
    
    const response: ServiceGroupResponse = await serverAPI.get(`/ServiceGroup/GetById/${id}`);
    
    console.log('[getServiceGroupById] 📥 Response received:', {
      status: response.Status,
      message: response.Message,
      hasObject: !!response.Object,
      servicesCount: response.Object?.GroupedServices?.length || 0,
    });
    
    return response;
  } catch (err: any) {
    console.error('[getServiceGroupById] ❌ Error:', {
      message: err.message,
      status: err.response?.status,
    });
    
    const errorMessage = err.response?.data?.Message || err.response?.statusText || err.message || 'Failed to fetch service group';
    
    return {
      Status: err.response?.status || 500,
      Message: errorMessage,
    };
  }
}

export async function updateServiceGroup(
  data: UpdateServiceGroupRequest
): Promise<ServiceGroupResponse> {
  try {
    console.log('[updateServiceGroup] 🔄 Updating service group...', { 
      id: data.Id, 
      name: data.Name,
      isActive: data.IsActive 
    });
    
    // According to API docs, payload should be { Id, Name, IsActive }
    const response: ServiceGroupResponse = await serverAPI.post('/ServiceGroup/Update', {
      Id: data.Id,
      Name: data.Name,
      IsActive: data.IsActive
    });
    
    console.log('[updateServiceGroup] 📥 Response received:', {
      status: response.Status,
      message: response.Message,
    });
    
    return response;
  } catch (err: any) {
    console.error('[updateServiceGroup] ❌ Error:', {
      message: err.message,
      status: err.response?.status,
    });
    
    const errorMessage = err.response?.data?.Message || err.response?.statusText || err.message || 'Failed to update service group';
    
    return {
      Status: err.response?.status || 500,
      Message: errorMessage,
    };
  }
}

export async function deleteServiceGroup(id: number): Promise<ServiceGroupResponse> {
  // According to API docs: POST https://gw5cndev.geowise.ai/ServiceGroup/Delete?id=2
  // Uses query parameter, not body data
  const possibleEndpoints = [
    // Correct format according to API documentation
    { method: 'POST' as const, url: `/ServiceGroup/Delete?id=${id}` },
    // Fallback patterns
    { method: 'POST' as const, url: `/ServiceGroup/Delete`, data: { id: id } },
    { method: 'POST' as const, url: `/servicegroup/Delete?id=${id}` },
    { method: 'DELETE' as const, url: `/ServiceGroup/Delete?id=${id}` },
  ];
  
  let lastError: any = null;
  let attemptedEndpoints: string[] = [];
  
  for (const endpoint of possibleEndpoints) {
    try {
      const endpointStr = endpoint.method === 'DELETE' 
        ? endpoint.url 
        : `${endpoint.url} (POST with ${JSON.stringify(endpoint.data)})`;
      attemptedEndpoints.push(endpointStr);
      
      console.log('[deleteServiceGroup] 🔍 Trying endpoint:', {
        method: endpoint.method,
        url: endpoint.url,
        id,
        attempt: attemptedEndpoints.length,
        totalAttempts: possibleEndpoints.length
      });
      
      let response: ServiceGroupResponse;
      
      if (endpoint.method === 'DELETE') {
        response = await serverAPI.delete(endpoint.url);
      } else if (endpoint.url.includes('?')) {
        // Query parameter in URL (correct format per API docs)
        response = await serverAPI.post(endpoint.url);
      } else {
        // Body data (fallback)
        response = await serverAPI.post(endpoint.url, endpoint.data);
      }
      
      // If we get a successful response (200/201), use it
      if (response.Status === 200 || response.Status === 201) {
        console.log('[deleteServiceGroup] ✅ Success with endpoint:', {
          method: endpoint.method,
          url: endpoint.url,
          Status: response.Status,
          Message: response.Message
        });
        return response;
      }
      
      // If it's a 404, try next endpoint
      if (response.Status === 404) {
        console.log('[deleteServiceGroup] ⚠️ Endpoint not found, trying next:', endpointStr);
        lastError = { response: { status: 404 }, message: `Endpoint returned 404` };
        continue;
      }
      
      // Other status codes - return the response
      return response;
      
    } catch (err: any) {
      lastError = err;
      
      // If it's a 404, try the next endpoint
      if (err.response?.status === 404) {
        console.log('[deleteServiceGroup] ⚠️ Endpoint returned 404, trying next');
        continue;
      }
      
      // For non-404 errors, return immediately (might be auth, validation, etc.)
      console.error('[deleteServiceGroup] ❌ Non-404 error on endpoint:', {
        method: endpoint.method,
        url: endpoint.url,
        status: err.response?.status,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.Message || err.response?.statusText || err.message || 'Failed to delete service group';
      return {
        Status: err.response?.status || 500,
        Message: errorMessage,
      };
    }
  }
  
  // All endpoints returned 404
  console.error('[deleteServiceGroup] ❌ All endpoints returned 404:', {
    id,
    attemptedEndpoints,
    totalAttempts: attemptedEndpoints.length
  });
  
  return {
    Status: 404,
    Message: `Service group deletion endpoint not found. Attempted endpoints: ${attemptedEndpoints.join(', ')}`,
  };
}

export async function linkServicesToGroup(
  data: LinkServicesToGroupRequest
): Promise<ServiceGroupResponse> {
  try {
    console.log('[linkServicesToGroup] 🔄 Linking services to group...', {
      groupId: data.groupId,
      serviceCount: data.serviceIds.length,
    });
    
    const response: ServiceGroupResponse = await serverAPI.post('/ServiceGroup/LinkServices', {
      groupId: data.groupId,
      serviceIds: data.serviceIds,
    });
    
    console.log('[linkServicesToGroup] 📥 Response received:', {
      status: response.Status,
      message: response.Message,
    });
    
    return response;
  } catch (err: any) {
    console.error('[linkServicesToGroup] ❌ Error:', {
      message: err.message,
      status: err.response?.status,
    });
    
    const errorMessage = err.response?.data?.Message || err.response?.statusText || err.message || 'Failed to link services to group';
    
    return {
      Status: err.response?.status || 500,
      Message: errorMessage,
    };
  }
}

