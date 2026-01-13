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
import { apiClient } from '@/lib/api/axios-instance';
import { toast } from 'sonner';
import type { ServiceRequest } from '@/lib/types/serviceRequest.types';

export interface ServiceRequestFormData {
  // Step 1
  name: string;
  phoneNumber: string;
  countryCode: string;
  location: string;
  service: string;
  recurringPeriod: string;
  expiryDate: string;
  
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

  const handleStep1Next = (data: Partial<ServiceRequestFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
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

      // Parse service - it might be a JSON string, service ID (number), or service name (text)
      let serviceId = '0';
      let serviceName = finalData.service || 'Unknown Service';
      
      try {
        // Try parsing as JSON first
        const serviceData = JSON.parse(finalData.service || '{}');
        if (serviceData.Id) {
          serviceId = serviceData.Id.toString();
          serviceName = serviceData.ServiceName || serviceName;
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
            // It's a service name - we'll use it as-is and let API handle ID lookup
            // Or use 0 and API will create/find the service
            serviceId = '0';
            serviceName = trimmed;
          }
        }
      }

      // Parse phone number - remove country code if included
      let phoneNumber = finalData.phoneNumber || '';
      const countryCode = finalData.countryCode || 'US';
      
      // Remove country code prefix if present
      if (phoneNumber.startsWith('+')) {
        phoneNumber = phoneNumber.replace(/^\+\d+\s*/, '');
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
      const bookingData = {
        ServiceId: serviceId,
        CustomerId: null, // Will be created if doesn't exist
        Date: dateStr,
        TimingSlot: timingSlot,
        Name: finalData.name || '',
        PhoneNumber: phoneNumber,
        Email: 'customer@example.com', // Default email
        CountryCode: countryCode,
        Address: address,
        Lat: lat,
        Lng: lng,
        ProviderId: providerId,
        CompanyUserId: user.UserID || 0,
        AssociationType: 2,
        IsBarberBooking: false, // Service request, not barber booking
      };

      // Submit to API
      const response = await apiClient.post<{Status: number, Message: string}>('/company/addcustomerbookings', bookingData);

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
      toast.error(error.message || 'Failed to create service request');
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
