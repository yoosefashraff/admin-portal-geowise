'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Step1Form from '@/components/service-requests/Step1Form';
import Step2Form from '@/components/service-requests/Step2Form';
import Step3Form from '@/components/service-requests/Step3Form';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';
import type { ServiceRequest } from '@/lib/types/serviceRequest.types';
import { addCustomerBookings, createCustomer } from '@/lib/actions/scheduler.actions';
import type { SchedulerSubmitData } from '@/lib/types/scheduler.types';
import { getCallingCode } from '@/lib/utils';

export interface ServiceRequestFormData {
  // Step 1
  name: string;
  phoneNumber: string;
  countryCode: string;
  location: string;
  service: string;
  recurringPeriod: string;
  expiryDate: string;
  customerId?: number; // CustomerId after customer is created
  
  // Step 2
  credits: number;
  approvedCredits: number;
  usedCredits: number;
  remainingCredits: number;
  notes: string;
  startTime: string;
  endTime: string;
  
  // Step 3
  preferredStaff: string[];
  preferredDays: string[];
}

export default function NewServiceRequestPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ServiceRequestFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStep1Next = async (data: Partial<ServiceRequestFormData>) => {
    // Create customer when moving from Step 1 to Step 2
    // This ensures the customer exists in the database before final submission
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    // Validate required fields for customer creation
    if (!data.name || !data.phoneNumber || !data.countryCode || !data.location) {
      toast.error('Please fill in all required fields (name, phone, country, location)');
      return;
    }

    try {
      // Parse location data
      let address = '';
      let lat = 0;
      let lng = 0;
      
      if (data.location) {
        try {
          const locationData = JSON.parse(data.location);
          address = locationData.Address || locationData.address || locationData.formatted_address || '';
          lat = locationData.Lat || locationData.lat || locationData.latitude || 0;
          lng = locationData.Lng || locationData.lng || locationData.longitude || 0;
        } catch {
          address = data.location; // Fallback to string if not JSON
        }
      }

      // Clean phone number
      let phoneNumber = data.phoneNumber || '';
      if (phoneNumber.startsWith('+')) {
        phoneNumber = phoneNumber.replace(/^\+\d+\s*/, '');
      }
      phoneNumber = phoneNumber.replace(/[^\d]/g, '').trim();

      // Convert country code to calling code format
      const countryCode = getCallingCode(data.countryCode || 'US');

      // Generate placeholder email
      const placeholderEmail = `noemail-${Date.now()}@placeholder.local`;

      // Create customer
      console.log('[handleStep1Next] 🔄 Creating customer before moving to Step 2...');
      const customerResponse = await createCustomer({
        Name: (data.name || '').trim(),
        PhoneNumber: phoneNumber,
        CountryCode: countryCode,
        Email: placeholderEmail,
        Address: address.trim(),
        Lat: lat,
        Lng: lng,
        CompanyUserId: user.UserID || 0,
      });

      if (customerResponse.Status === 201 || customerResponse.Status === 200) {
        // Customer created successfully
        const customerId = customerResponse.CustomerId || customerResponse.Customer?.Id;
        if (customerId) {
          console.log('[handleStep1Next] ✅ Customer created with ID:', customerId);
          setFormData((prev) => ({ ...prev, ...data, customerId }));
          setCurrentStep(2);
        } else {
          console.warn('[handleStep1Next] ⚠️ Customer created but no CustomerId returned');
          // Still proceed - backend might handle it differently
          setFormData((prev) => ({ ...prev, ...data }));
          setCurrentStep(2);
        }
      } else if (customerResponse.Status === 404) {
        // Endpoint not found - backend API not ready yet
        console.warn('[handleStep1Next] ⚠️ Customer creation endpoint not found. Backend API may not be ready yet.');
        toast.warning('Customer creation API not available. Proceeding without pre-creating customer.');
        // Still proceed - backend might create customer during booking
        setFormData((prev) => ({ ...prev, ...data }));
        setCurrentStep(2);
      } else {
        // Error creating customer
        const errorMsg = customerResponse.Message || 'Failed to create customer';
        console.error('[handleStep1Next] ❌ Failed to create customer:', errorMsg);
        toast.error(`Failed to create customer: ${errorMsg}`);
        // Don't proceed to next step if customer creation fails
      }
    } catch (error: any) {
      console.error('[handleStep1Next] ❌ Error creating customer:', error);
      toast.error(`Error creating customer: ${error.message || 'Unknown error'}`);
      // Don't proceed to next step if customer creation fails
    }
  };

  const handleStep2Next = (data: Partial<ServiceRequestFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleSubmit = async (data: Partial<ServiceRequestFormData>) => {
    const finalData = { ...formData, ...data };
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse location - it might be a JSON string or plain address
      let address = finalData.location || '';
      let lat = 0;
      let lng = 0;
      
      try {
        const locationData = JSON.parse(finalData.location || '{}');
        if (locationData.Address) {
          address = locationData.Address;
          lat = locationData.Lat || 0;
          lng = locationData.Lng || 0;
        }
      } catch {
        // If not JSON, use as plain address
        address = finalData.location || '';
      }

      // Parse service - it might be a JSON string with Id and ServiceName, service ID (number), or service name (text)
      let serviceId = '0';
      let serviceName = finalData.service || 'Unknown Service';
      
      if (!finalData.service || finalData.service.trim() === '') {
        toast.error('Service is required');
        return;
      }

      try {
        // Try parsing as JSON first (from dropdown selection)
        const serviceData = JSON.parse(finalData.service || '{}');
        if (serviceData.Id) {
          serviceId = serviceData.Id.toString();
          serviceName = serviceData.ServiceName || serviceName;
        } else {
          throw new Error('Invalid service data');
        }
      } catch {
        // If not JSON, check if it's a numeric ID
        if (typeof finalData.service === 'string') {
          const trimmed = finalData.service.trim();
          if (trimmed.match(/^\d+$/)) {
            // It's a numeric ID
            serviceId = trimmed;
            serviceName = `Service ${trimmed}`; // Default name
          } else {
            // It's a service name - this shouldn't happen with dropdown, but handle gracefully
            toast.error('Invalid service selected. Please select a service from the dropdown.');
            return;
          }
        } else {
          toast.error('Service is required');
          return;
        }
      }

      // Validate service ID is not 0
      if (serviceId === '0' || !serviceId) {
        toast.error('Please select a valid service from the dropdown');
        return;
      }

      // Parse phone number - remove country code if included
      let phoneNumber = finalData.phoneNumber || '';
      const countryCodeISO = finalData.countryCode || 'US';
      
      // Convert ISO country code (e.g., "EG", "US") to calling code format (e.g., "+20", "+1")
      // Backend expects calling code format, not ISO code
      const countryCode = getCallingCode(countryCodeISO);
      
      // Remove country code prefix if present in phone number
      if (phoneNumber.startsWith('+')) {
        phoneNumber = phoneNumber.replace(/^\+\d+\s*/, '');
      }
      
      // Clean phone number - remove any non-digit characters (including spaces)
      // Backend expects digits only, no spaces
      phoneNumber = phoneNumber.replace(/[^\d]/g, '').trim();

      // Clean and format name - remove extra whitespace, ensure it's not empty
      const customerName = (finalData.name || '').trim();
      
      // Clean address
      const cleanAddress = (address || '').trim();

      // Validate required fields AFTER cleaning
      if (!customerName || customerName.length === 0) {
        toast.error('Name is required');
        setIsSubmitting(false);
        return;
      }
      if (!phoneNumber || phoneNumber.length === 0) {
        toast.error('Phone number is required');
        setIsSubmitting(false);
        return;
      }
      if (!cleanAddress || cleanAddress.length === 0) {
        toast.error('Address is required');
        setIsSubmitting(false);
        return;
      }

      // Get preferred staff provider IDs
      let providerId = '0';
      if (finalData.preferredStaff && finalData.preferredStaff.length > 0) {
        // Try to parse first preferred staff as provider ID
        try {
          const staffData = JSON.parse(finalData.preferredStaff[0]);
          if (staffData.ProviderId) {
            providerId = staffData.ProviderId.toString();
          }
        } catch {
          // If not JSON, might be a provider name - we'll use 0 for now
        }
      }

      // Format date and time - use today's date and start/end times from form
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const startTime = finalData.startTime || '09:00';
      const endTime = finalData.endTime || '17:00';
      const timingSlot = `${startTime}-${endTime}`;

      // Prepare booking data
      // Generate a placeholder email if not provided (backend requires email field)
      // Format: noemail-{timestamp}@placeholder.local to avoid conflicts with real emails
      const placeholderEmail = `noemail-${Date.now()}@placeholder.local`;
      
      // Use existing CustomerId if customer was created in Step 1, otherwise null
      const customerId = finalData.customerId ? finalData.customerId.toString() : null;

      const bookingData = {
        ServiceId: serviceId,
        CustomerId: customerId, // Use existing CustomerId if customer was created in Step 1
        Date: dateStr,
        TimingSlot: timingSlot,
        Name: customerName, // Already trimmed and validated
        PhoneNumber: phoneNumber, // Already cleaned (digits only) and validated
        Email: placeholderEmail, // Placeholder email since form doesn't collect email
        CountryCode: countryCode, // Now in calling code format (e.g., "+20" instead of "EG")
        Address: cleanAddress, // Already trimmed and validated
        Lat: lat,
        Lng: lng,
        ProviderId: providerId,
        CompanyUserId: user.UserID || 0,
        AssociationType: 2,
        IsBarberBooking: false, // Service request, not barber booking
      };

      console.warn('🔍 Creating service request (new customer):', {
        customerName: finalData.name,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        customerId: bookingData.CustomerId,
        serviceId: bookingData.ServiceId,
        address: address,
        fullBookingData: bookingData,
        reason: 'Using server action to avoid CORS issues'
      });

      // Submit via server action (avoids CORS issues)
      // Server action uses serverAPI which is server-side and handles dev environment automatically
      const bookingPayload: SchedulerSubmitData = {
        ServiceId: bookingData.ServiceId,
        CustomerId: bookingData.CustomerId,
        Date: bookingData.Date,
        TimingSlot: bookingData.TimingSlot,
        Name: bookingData.Name,
        PhoneNumber: bookingData.PhoneNumber,
        Email: bookingData.Email,
        CountryCode: bookingData.CountryCode,
        Address: bookingData.Address,
        Lat: bookingData.Lat,
        Lng: bookingData.Lng,
        ProviderId: bookingData.ProviderId,
        CompanyUserId: bookingData.CompanyUserId,
        AssociationType: bookingData.AssociationType,
        IsBarberBooking: bookingData.IsBarberBooking,
      };

      const response = await addCustomerBookings(bookingPayload);

      if (response.Status === 201) {
        toast.success('Service request created successfully!');
        
        // Create the service request object to add to the list immediately
        const newServiceRequest: ServiceRequest = {
          id: `new-${Date.now()}`, // Temporary ID
          name: finalData.name || '',
          phone: `${countryCode} ${phoneNumber}`,
          service: serviceName,
          address: address,
          credits: {
            approved: finalData.approvedCredits || 0,
            used: finalData.usedCredits || 0,
            remaining: finalData.remainingCredits || (finalData.approvedCredits || 0) - (finalData.usedCredits || 0),
          },
          preferredStaff: finalData.preferredStaff || [],
          preferredDays: finalData.preferredDays || [],
          status: 'Approved', // Set as Approved so it appears immediately
        };

        // Store in sessionStorage to add to list on navigation
        const existingRequests = sessionStorage.getItem('pendingServiceRequests');
        const requests = existingRequests ? JSON.parse(existingRequests) : [];
        requests.push(newServiceRequest);
        sessionStorage.setItem('pendingServiceRequests', JSON.stringify(requests));

        // Navigate back to service requests page
        router.push('/scheduler/service-requests');
      } else {
        toast.error(response.Message || 'Failed to create service request');
      }
    } catch (error: any) {
      console.error('Error creating service request:', error);
      const errorMessage = error.response?.data?.Message || error.message || 'Failed to create service request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <DashboardHeader
        title="New Service Requests"
        description="Create a new service request for your customers."
      />

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06)] p-6 mt-6">
        <CardContent className="px-0">
          {/* Step Indicator */}
          <div className="text-sm font-medium text-gray-600 mb-4">
            Step {currentStep} of 3
          </div>
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/scheduler/service-requests" className="font-medium text-gray-500 hover:text-gray-700">
              Services Request
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-gray-700">Add New Service Request</span>
          </div>

          {/* Form Steps */}
          {currentStep === 1 && (
            <Step1Form
              initialData={formData}
              onNext={handleStep1Next}
            />
          )}

          {currentStep === 2 && (
            <Step2Form
              initialData={formData}
              onNext={handleStep2Next}
              onBack={handleStep2Back}
            />
          )}

          {currentStep === 3 && (
            <Step3Form
              initialData={formData}
              onSubmit={handleSubmit}
              onBack={handleStep3Back}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
