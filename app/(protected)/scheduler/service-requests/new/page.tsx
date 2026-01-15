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
import { createCustomer, getCustomerByPhoneAndType } from '@/lib/actions/scheduler.actions';
import { calendarBooking } from '@/lib/actions/calendar.actions';
import type { BookingRequestPayload } from '@/lib/types/calendar';
import { getCallingCode, convertTo12Hour } from '@/lib/utils';
import dayjs from 'dayjs';

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

      // First, check if customer already exists
      console.log('[handleStep1Next] 🔍 Checking if customer exists...');
      let customerId: number | undefined = undefined;
      
      try {
        const existingCustomerResponse = await getCustomerByPhoneAndType(phoneNumber, countryCode, 2);
        
        if (existingCustomerResponse.Status === 201 && existingCustomerResponse.Object) {
          // Customer already exists - use existing CustomerId
          customerId = existingCustomerResponse.Object.UserId;
          console.log('[handleStep1Next] ✅ Customer already exists with ID:', customerId);
          
          // Update form data with existing customer ID and proceed
          setFormData((prev) => ({ ...prev, ...data, customerId }));
          setCurrentStep(2);
          return; // Exit early - customer exists, no need to create
        }
      } catch (error: any) {
        // If lookup fails, continue to create new customer
        console.log('[handleStep1Next] ℹ️ Customer lookup failed or customer not found, will create new customer:', error.message);
      }

      // Customer doesn't exist - create new customer
      console.log('[handleStep1Next] 🔄 Creating new customer...');
      
      // Generate placeholder email
      const placeholderEmail = `noemail-${Date.now()}@placeholder.local`;

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
        const newCustomerId = customerResponse.CustomerId || customerResponse.Customer?.Id;
        if (newCustomerId) {
          console.log('[handleStep1Next] ✅ New customer created with ID:', newCustomerId);
          setFormData((prev) => ({ ...prev, ...data, customerId: newCustomerId }));
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
        // Error creating customer - check if it's a duplicate error
        const errorMsg = customerResponse.Message || 'Failed to create customer';
        
        // Check if error indicates customer already exists (duplicate)
        if (errorMsg.toLowerCase().includes('already exists') || 
            errorMsg.toLowerCase().includes('duplicate') ||
            errorMsg.toLowerCase().includes('exists')) {
          console.log('[handleStep1Next] ℹ️ Customer appears to already exist, trying lookup again...');
          
          // Try lookup one more time to get the CustomerId
          try {
            const retryLookup = await getCustomerByPhoneAndType(phoneNumber, countryCode, 2);
            if (retryLookup.Status === 201 && retryLookup.Object) {
              customerId = retryLookup.Object.UserId;
              console.log('[handleStep1Next] ✅ Found existing customer ID:', customerId);
              setFormData((prev) => ({ ...prev, ...data, customerId }));
              setCurrentStep(2);
              return;
            }
          } catch (retryError) {
            console.error('[handleStep1Next] ❌ Retry lookup also failed:', retryError);
          }
        }
        
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

      // Get preferred staff provider IDs - REQUIRED for booking
      // Step3Form stores provider IDs as strings directly (e.g., ["123", "456"])
      let providerId = '0';
      if (finalData.preferredStaff && finalData.preferredStaff.length > 0) {
        // preferredStaff[0] is already a provider ID string (e.g., "123")
        // Not a JSON object, so we use it directly
        providerId = finalData.preferredStaff[0].toString();
      }
      
      // Validate ProviderId is set (required for calendar booking API)
      if (!providerId || providerId === '0' || providerId.trim() === '') {
        toast.error('Please select a provider/staff member in Step 3. Provider is required for booking.');
        setIsSubmitting(false);
        return;
      }

      // Format date and time - use EXACT same approach as working EditBookingDialog
      // EditBookingDialog line 60: const today = new Date().toISOString().split('T')[0];
      // This is what the working calendar booking uses
      // Use the date from formData if provided, otherwise use today's date
      let dateStr = finalData.expiryDate 
        ? dayjs(finalData.expiryDate).format('YYYY-MM-DD')
        : new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Ensure times are in HH:MM format (24-hour format from HTML5 time input)
      let startTime = (finalData.startTime || '09:00').trim();
      let endTime = (finalData.endTime || '17:00').trim();
      
      // Validate time format (HH:MM) - HTML5 time input returns 24-hour format
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        toast.error(`Invalid start time format: ${startTime}. Please use HH:MM format (e.g., 09:00)`);
        setIsSubmitting(false);
        return;
      }
      if (!timeRegex.test(endTime)) {
        toast.error(`Invalid end time format: ${endTime}. Please use HH:MM format (e.g., 17:00)`);
        setIsSubmitting(false);
        return;
      }
      
      // Convert 24-hour format to 12-hour format with AM/PM - same as EditBookingDialog
      // EditBookingDialog uses convertTo12Hour() from lib/utils.ts (line 302, 313)
      const startTime12 = convertTo12Hour(startTime);
      const endTime12 = convertTo12Hour(endTime);
      
      console.warn('📅 Date/Time formatting (matching EditBookingDialog):', {
        dateStr,
        dateFormat: 'YYYY-MM-DD (toISOString().split)',
        systemDate: new Date().toString(),
        systemYear: new Date().getFullYear(),
        startTime24: startTime,
        endTime24: endTime,
        startTime12,
        endTime12,
        note: 'Using EXACT same date/time formatting as working EditBookingDialog'
      });

      // Use the SAME API as calendar booking to ensure conflict checking and prevent double-booking
      // This API checks if the provider is already booked at this time slot
      // IMPORTANT: EndTime should only be sent for block hours (when ServiceId is '0')
      // When a service is selected, EndTime must be empty string
      const bookingPayload: BookingRequestPayload = {
        ProviderId: providerId,
        Date: dateStr, // YYYY-MM-DD format
        Time: startTime12, // Start time in 12-hour format (e.g., "09:00 AM")
        ServiceId: serviceId, // Service ID (not "0" for service requests)
        EndTime: serviceId && serviceId !== '0' ? '' : endTime12, // End time only for block hours (when ServiceId is '0')
        CustomerName: customerName, // Already trimmed and validated
        PhoneNumber: phoneNumber, // Already cleaned (digits only) and validated
        CountryCode: countryCode, // Calling code format (e.g., "+20")
        CompanyUserId: String(user.UserID || ''),
        Address: cleanAddress, // Already trimmed and validated
        Note: finalData.notes || '', // Notes from Step 2
      };

      console.warn('📤 Submitting booking via CalendarBooking API (same as calendar):', {
        Date: bookingPayload.Date,
        Time: bookingPayload.Time,
        EndTime: bookingPayload.EndTime,
        ServiceId: bookingPayload.ServiceId,
        ProviderId: bookingPayload.ProviderId,
        CustomerName: bookingPayload.CustomerName,
        fullPayload: bookingPayload,
        note: 'Using CalendarBooking API to ensure conflict checking and prevent double-booking'
      });

      const response = await calendarBooking(bookingPayload);

      console.warn('📥 Booking response:', {
        Status: response.Status,
        Message: response.Message,
        response: response
      });

      if (response.Status === 201 || response.Status === 200) {
        toast.success('Service request created successfully!');
        
        // Fetch credits from backend API for this customer and service
        // Start with form values as default (in case API fails or returns empty)
        let creditInfo = {
          approved: finalData.approvedCredits || 0,
          used: finalData.usedCredits || 0,
          remaining: finalData.remainingCredits || (finalData.approvedCredits || 0) - (finalData.usedCredits || 0),
        };
        let approvedUserCreditId: number | undefined = undefined;
        const customerId = finalData.customerId;
        const serviceIdNum = parseInt(serviceId);
        
        console.log('🔍 Fetching credits after booking creation:', {
          customerId,
          serviceId: serviceIdNum,
          formCredits: {
            approved: finalData.approvedCredits,
            used: finalData.usedCredits,
            remaining: finalData.remainingCredits,
          }
        });
        
        if (customerId && serviceIdNum && serviceIdNum > 0) {
          try {
            const { listApprovedUserCredits } = await import('@/lib/actions/approvedUserCredits.actions');
            const creditsResponse = await listApprovedUserCredits({ 
              UserId: customerId, 
              ServiceId: serviceIdNum,
              IsActive: true 
            });
            
            console.log('📥 Credits API response:', {
              status: creditsResponse.Status,
              hasData: !!creditsResponse.data,
              dataLength: creditsResponse.data?.length || 0,
              data: creditsResponse.data,
            });
            
            if (creditsResponse.Status === 201 && creditsResponse.data && Array.isArray(creditsResponse.data)) {
              // Find the matching credit (should be one per user+service)
              const matchingCredit = creditsResponse.data.find(
                (c: any) => c.UserId === customerId && c.ServiceId === serviceIdNum
              );
              
              if (matchingCredit) {
                creditInfo = {
                  approved: matchingCredit.ApprovedCredits || 0,
                  used: matchingCredit.UsedCredits || 0,
                  remaining: matchingCredit.RemainingCredits || 0,
                };
                approvedUserCreditId = matchingCredit.Id;
                console.log('✅ Fetched credits from backend:', {
                  ...creditInfo,
                  creditId: approvedUserCreditId,
                });
              } else {
                // No credits found - create them if user provided credit information
                const hasApprovedCredits = (finalData.approvedCredits || 0) > 0;
                if (hasApprovedCredits) {
                  try {
                    console.log('📝 Creating new ApprovedUserCredit in backend:', {
                      userId: customerId,
                      serviceId: serviceIdNum,
                      approvedCredits: finalData.approvedCredits,
                    });
                    
                    const { createApprovedUserCredit } = await import('@/lib/actions/approvedUserCredits.actions');
                    
                    // Calculate dates: StartDate = today, EndDate = 1 year from today
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setFullYear(endDate.getFullYear() + 1);
                    
                    // Parse recurringPeriod from form (format: "X days" or "X hours")
                    // Convert to hours for API (API expects RecurringPeriod in hours)
                    let recurringPeriodInHours = 1; // Default to 1 hour (daily)
                    if (finalData.recurringPeriod) {
                      const parts = finalData.recurringPeriod.trim().split(/\s+/);
                      const value = parseInt(parts[0]) || 1;
                      const unit = parts[1]?.toLowerCase() || 'days';
                      
                      if (unit === 'days' || unit === 'day') {
                        recurringPeriodInHours = value * 24;
                      } else if (unit === 'hours' || unit === 'hour') {
                        recurringPeriodInHours = value;
                      } else {
                        // Default to days if unit is unknown
                        recurringPeriodInHours = value * 24;
                      }
                    }
                    
                    const createResponse = await createApprovedUserCredit({
                      UserId: customerId,
                      ServiceId: serviceIdNum,
                      ApprovedCredits: finalData.approvedCredits || 0,
                      StartDate: startDate.toISOString(),
                      EndDate: endDate.toISOString(),
                      RecurringPeriod: recurringPeriodInHours,
                      IsActive: true,
                    });
                    
                    if (createResponse.Status === 201 && createResponse.data) {
                      const createdCredit = createResponse.data;
                      creditInfo = {
                        approved: createdCredit.ApprovedCredits || finalData.approvedCredits || 0,
                        used: createdCredit.UsedCredits || finalData.usedCredits || 0,
                        remaining: createdCredit.RemainingCredits || finalData.remainingCredits || (finalData.approvedCredits || 0) - (finalData.usedCredits || 0),
                      };
                      approvedUserCreditId = createdCredit.Id;
                      console.log('✅ Created new ApprovedUserCredit in backend:', {
                        ...creditInfo,
                        creditId: approvedUserCreditId,
                      });
                    } else {
                      console.warn('⚠️ Failed to create credits in backend, using form values:', {
                        status: createResponse.Status,
                        message: createResponse.Message,
                        formCredits: creditInfo,
                      });
                      // Keep form values as fallback (already set above)
                    }
                  } catch (createError) {
                    console.warn('⚠️ Error creating credits in backend, using form values:', createError);
                    // Keep form values as fallback (already set above)
                  }
                } else {
                  console.log('ℹ️ No credits found and no approved credits provided - skipping credit creation');
                  // Keep form values as fallback (already set above)
                }
              }
            } else {
              console.warn('⚠️ Credits API returned unexpected format, using form values:', {
                status: creditsResponse.Status,
                message: creditsResponse.Message,
                hasData: !!creditsResponse.data,
                formCredits: creditInfo,
              });
              // Keep form values as fallback (already set above)
            }
          } catch (creditsError) {
            console.warn('⚠️ Could not fetch credits from API, using form values:', creditsError);
            // Keep form values as fallback (already set above)
          }
        } else {
          console.log('ℹ️ No customerId or serviceId, using form values for credits:', creditInfo);
        }
        
        // Create the service request object to add to the list immediately
        const newServiceRequest: ServiceRequest = {
          id: `new-${Date.now()}`, // Temporary ID
          name: finalData.name || '',
          phone: `${countryCode} ${phoneNumber}`,
          service: serviceName,
          address: address,
          credits: creditInfo, // Use credits fetched from backend (or form values as fallback)
          preferredStaff: finalData.preferredStaff || [],
          preferredDays: finalData.preferredDays || [],
          status: 'Approved', // Set as Approved so it appears immediately
          userId: customerId, // Include userId for credit matching
          serviceId: serviceIdNum, // Include serviceId for credit matching
          approvedUserCreditId: approvedUserCreditId, // Include credit ID if found
        };
        
        console.log('💾 Storing new service request with credits:', {
          id: newServiceRequest.id,
          name: newServiceRequest.name,
          credits: newServiceRequest.credits,
          userId: newServiceRequest.userId,
          serviceId: newServiceRequest.serviceId,
          approvedUserCreditId: newServiceRequest.approvedUserCreditId,
        });

        // Store in sessionStorage to add to list on navigation
        const existingRequests = sessionStorage.getItem('pendingServiceRequests');
        const requests = existingRequests ? JSON.parse(existingRequests) : [];
        requests.push(newServiceRequest);
        sessionStorage.setItem('pendingServiceRequests', JSON.stringify(requests));

        // Navigate back to service requests page
        router.push('/scheduler/service-requests');
      } else {
        // Show error message from backend with more context
        const errorMessage = response.Message || 'Failed to create service request';
        
        // Check if it's a conflict error (slot already booked)
        if (errorMessage.includes('Slot already') || errorMessage.includes('already Acquired') || errorMessage.includes('already booked')) {
          // Extract time slot from error message if available
          const timeSlotMatch = errorMessage.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
          const timeSlot = timeSlotMatch ? ` (${timeSlotMatch[0]})` : '';
          
          toast.error(`This time slot is already booked${timeSlot}. Please select a different time.`, {
            duration: 5000,
          });
          console.warn('⚠️ Conflict detected - slot already booked:', {
            errorMessage,
            Date: bookingPayload.Date,
            Time: bookingPayload.Time,
            ProviderId: bookingPayload.ProviderId,
            note: 'Conflict checking is working correctly - preventing double-booking'
          });
        } 
        // Check if it's a DateTime parsing error and provide helpful context
        else if (errorMessage.includes('DateTime') || errorMessage.includes('not recognized') || errorMessage.includes('valid DateTime')) {
          const detailedError = `Date/Time format error: ${errorMessage}\nDate sent: ${bookingPayload.Date}\nTime sent: ${bookingPayload.Time}\nEndTime sent: ${bookingPayload.EndTime}`;
          toast.error(detailedError);
          console.error('❌ DateTime parsing error:', {
            errorMessage,
            Date: bookingPayload.Date,
            Time: bookingPayload.Time,
            EndTime: bookingPayload.EndTime,
            dateFormat: 'Expected: YYYY-MM-DD',
            timeFormat: 'Expected: HH:MM AM/PM (e.g., "09:00 AM")',
            fullPayload: bookingPayload,
            note: 'Backend may be trying to parse Date or Time as DateTime. Check backend API documentation.'
          });
        } else {
          toast.error(`An error occurred while processing the booking: ${errorMessage}`);
        }
        
        console.error('Failed to create service request:', {
          status: response.Status,
          message: response.Message,
          bookingData: bookingPayload
        });
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
