'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useFormField } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCallingCode, allCallingCountries, getCountryName } from '@/lib/utils';
import { Check, ChevronsUpDown, Search, CalendarIcon, Loader2, X } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useAuthStore } from '@/lib/store/authStore';
import { getServicesForCompany } from '@/lib/actions/service.actions';
import { fetchServiceRequests } from '@/lib/actions/serviceRequests.actions';
import { getAllProvidersForCompany } from '@/lib/actions/provider.actions';
import type { Customer } from '@/lib/types/scheduler.types';
import type { CompanyService } from '@/lib/types/service.types';
import type { ServiceRequestFormData } from '@/app/(protected)/scheduler/service-requests/new/page';

const step1Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  countryCode: z.string().min(1, 'Country code is required'),
  location: z.string().min(1, 'Location is required'),
  service: z.string().min(1, 'Service is required'),
  recurringPeriodValue: z.number().min(1, 'Recurring period value is required'),
  recurringPeriodUnit: z.string().min(1, 'Recurring period unit is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

interface Step1FormProps {
  initialData?: Partial<ServiceRequestFormData>;
  onNext: (data: Partial<ServiceRequestFormData>) => Promise<void>;
}

export default function Step1Form({ initialData, onNext }: Step1FormProps) {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [services, setServices] = useState<CompanyService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [nameDropdownOpen, setNameDropdownOpen] = useState(false);
  const [nameSearchQuery, setNameSearchQuery] = useState('');
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  
  // Refs for Google Maps autocomplete
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAq2Vf7Ss-yLruim9i_vog14LwVGPBmt_g';
  
  // Ref for name dropdown to handle click outside
  const nameDropdownRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: initialData?.name || '',
      phoneNumber: initialData?.phoneNumber || '',
      countryCode: initialData?.countryCode || 'US',
      location: initialData?.location || '',
      service: initialData?.service || '',
      recurringPeriodValue: initialData?.recurringPeriod ? parseInt(initialData.recurringPeriod.split(' ')[0]) || 1 : 1,
      recurringPeriodUnit: initialData?.recurringPeriod ? initialData.recurringPeriod.split(' ')[1] || 'days' : 'days',
      expiryDate: initialData?.expiryDate || '',
    },
  });

  useEffect(() => {
    const loadCustomers = async () => {
      console.log('[Step1Form] 🔄 loadCustomers called', { user: !!user, userId: user?.UserID });
      if (!user) {
        console.log('[Step1Form] No user, skipping customer load');
        return;
      }
      setLoadingCustomers(true);
      try {
        // PRIMARY METHOD: Extract customers from SERVICE REQUESTS list
        // This is the source of truth - customers are the ones who have service requests
        // When you create a service request with a new name like "John", that becomes a customer
        // The next time you type "John", it should appear because it exists in service requests
        // NOTE: We do NOT use listcustomerforscheduler API because it returns providers from linked users, not customers
        
        // First, fetch linked users (providers) to exclude them from customers
        console.log('[Step1Form] 🔍 Fetching linked users (providers) to exclude from customers...');
        let providerIds = new Set<number>();
        let providerNames = new Set<string>();
        try {
          const providersResponse = await getAllProvidersForCompany({
            CompanyAdminId: user.UserID,
            PageNo: 1,
            RecordsPerPage: 1000 // Get all providers
          });
          if (providersResponse.Status === 201 && providersResponse.List) {
            providersResponse.List.forEach((provider: any) => {
              if (provider.ProviderId) providerIds.add(provider.ProviderId);
              if (provider.ProviderName) providerNames.add(provider.ProviderName.toLowerCase().trim());
            });
            console.log(`[Step1Form] 🔍 Found ${providerIds.size} linked users (providers) to exclude`);
          }
        } catch (error: any) {
          console.warn('[Step1Form] ⚠️ Could not fetch linked users, continuing without exclusion:', error.message);
        }
        
        console.log('[Step1Form] 📋 Fetching customers from SERVICE REQUESTS (source of truth - NOT linked users API)...');
        try {
          const today = new Date();
          const startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 365); // 1 year ago
          const endDate = new Date(today);
          endDate.setDate(endDate.getDate() + 365); // 1 year in future
          
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          console.log('[Step1Form] 📅 Fetching service requests from:', { startDateStr, endDateStr });
          const serviceRequestsResponse = await fetchServiceRequests(
            startDateStr,
            endDateStr,
            false,
            user.UserID
          );
            
            if (serviceRequestsResponse.Status === 201 && serviceRequestsResponse.Object && Array.isArray(serviceRequestsResponse.Object)) {
              const uniqueCustomers = new Map<number, Customer>();
              
              let skippedProviders = 0;
              let addedCustomers = 0;
              
              serviceRequestsResponse.Object.forEach((callout: any) => {
                // CRITICAL: Extract CUSTOMER fields only, NOT provider fields
                // Customer fields: UserId, UserName, Customer, Patient_Name
                // Provider fields (DO NOT USE): BarberId, ProviderId, BarberUserName, ProviderName
                const userId = callout.UserId || callout.userId || callout.UserID;
                const customerName = callout.Customer || callout.Patient_Name || callout.UserName || callout.userName;
                const phone = callout.PhoneNumber || callout.phoneNumber || callout.Mobile_Number || callout.Contact;
                const email = callout.Email || callout.email;
                
                // Ensure we're NOT using provider fields
                const providerId = callout.BarberId || callout.ProviderId || callout.barberId || callout.providerId;
                const providerName = callout.BarberUserName || callout.ProviderName || callout.barberUserName || callout.providerName;
                
                // CRITICAL: Exclude linked users (providers)
                // Check if userId is in the linked users list
                if (userId && providerIds.has(userId)) {
                  console.log(`[Step1Form] ⚠️ Skipping linked user (provider) by ID: ${userId} - "${customerName}"`);
                  skippedProviders++;
                  return;
                }
                
                // Check if customerName matches any provider name (case-insensitive)
                if (customerName && providerNames.has(customerName.toLowerCase().trim())) {
                  console.log(`[Step1Form] ⚠️ Skipping linked user (provider) by name: "${customerName}"`);
                  skippedProviders++;
                  return;
                }
                
                // AGGRESSIVE FILTERING: Skip if name contains "provider" (case-insensitive)
                if (customerName && /provider/i.test(customerName)) {
                  console.log(`[Step1Form] ⚠️ Skipping provider by name pattern: "${customerName}"`);
                  skippedProviders++;
                  return;
                }
                
                // Skip if this is a provider (userId matches providerId from callout)
                if (userId && providerId && userId === providerId) {
                  console.log(`[Step1Form] ⚠️ Skipping provider (userId matches providerId): ${userId}`);
                  skippedProviders++;
                  return; // Skip providers
                }
                
                // Skip if customerName matches providerName from callout
                if (customerName && providerName && customerName === providerName) {
                  console.log(`[Step1Form] ⚠️ Skipping provider (name matches providerName): "${customerName}"`);
                  skippedProviders++;
                  return; // Skip providers
                }
                
                // Skip if userId is missing (invalid customer)
                if (!userId) {
                  return; // Skip entries without userId
                }
                
                // Only add if we have a valid customer (userId) and it's NOT a provider
                if (userId && customerName && !uniqueCustomers.has(userId)) {
                  // Final check: ensure name doesn't look like a provider
                  const isProviderName = /provider|barber|staff|technician/i.test(customerName);
                  if (isProviderName) {
                    console.log(`[Step1Form] ⚠️ Skipping provider by name pattern check: "${customerName}"`);
                    skippedProviders++;
                    return;
                  }
                  
                  uniqueCustomers.set(userId, {
                    Id: userId,
                    Name: customerName,
                    Contact: phone || '',
                    Email: email || '',
                    CountryCode: callout.CountryCode || 'US',
                  });
                  addedCustomers++;
                }
              });
              
              const customersFromRequests = Array.from(uniqueCustomers.values());
              console.log(`[Step1Form] 📊 Customer extraction summary:`, {
                totalCallouts: serviceRequestsResponse.Object.length,
                addedCustomers,
                skippedProviders,
                uniqueCustomersCount: uniqueCustomers.size
              });
              console.log(`[Step1Form] ✅ Loaded ${customersFromRequests.length} CUSTOMERS from service requests (source of truth)`);
              console.log('[Step1Form] Sample CUSTOMERS:', customersFromRequests.slice(0, 5).map(c => ({
                id: c.Id,
                name: c.Name,
                contact: c.Contact
              })));
              
              if (customersFromRequests.length > 0) {
                setCustomers(customersFromRequests);
                console.log('[Step1Form] ✅ Customers loaded successfully from service requests (source of truth)');
              } else {
                console.warn('[Step1Form] ⚠️ No customers found in service requests');
                setCustomers([]);
              }
            } else {
              console.warn('[Step1Form] ⚠️ Service requests response invalid:', serviceRequestsResponse);
              setCustomers([]);
            }
          } catch (error: any) {
            console.error('[Step1Form] ❌ Failed to load customers from service requests:', {
              error,
              message: error?.message,
              stack: error?.stack,
              response: error?.response
            });
            setCustomers([]);
          }
      } catch (error: any) {
        console.error('[Step1Form] ❌ Failed to load customers:', {
          error,
          message: error?.message,
          stack: error?.stack,
          response: error?.response
        });
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
        console.log('[Step1Form] Customer loading finished, loadingCustomers set to false');
      }
    };

    loadCustomers();
  }, [user]);

  // Load services from Services page (same API endpoint)
  useEffect(() => {
    const loadServices = async () => {
      if (!user?.UserID) {
        console.warn('[Step1Form] No user ID, skipping services load');
        setLoadingServices(false);
        setServices([]);
        return;
      }
      setLoadingServices(true);
      try {
        console.log('[Step1Form] 🔄 Starting to load services...', { userId: user.UserID });
        
        // Call server action - this should not throw, it returns error status
        const response = await getServicesForCompany({
          CompanyAdminId: user.UserID,
          PageNo: 1,
          RecordsPerPage: 1000, // Get all services
        });
        
        console.log('[Step1Form] 📥 Services response received:', {
          Status: response.Status,
          Message: response.Message,
          ListLength: response.List?.length || 0,
          TotalCount: response.TotalCount,
          HasList: !!response.List,
          ListType: Array.isArray(response.List) ? 'array' : typeof response.List
        });
        
        if (response.Status === 201 && response.List && Array.isArray(response.List)) {
          console.log(`[Step1Form] ✅ Successfully loaded ${response.List.length} services:`, 
            response.List.slice(0, 5).map(s => ({ id: s.Id, name: s.ServiceName }))
          );
          setServices(response.List);
        } else {
          console.warn('[Step1Form] ⚠️ Services response not successful:', {
            Status: response.Status,
            Message: response.Message,
            HasList: !!response.List,
            ListType: typeof response.List
          });
          setServices([]);
          
          // Show user-friendly error if available
          if (response.Message && response.Status !== 201) {
            console.warn('[Step1Form] Error message from backend:', response.Message);
          }
        }
      } catch (error: any) {
        // This catch should rarely trigger since server action handles errors internally
        console.error('[Step1Form] ❌ Unexpected error loading services:', {
          error: error.message,
          stack: error.stack,
          response: error.response,
          name: error.name
        });
        setServices([]);
      } finally {
        setLoadingServices(false);
        console.log('[Step1Form] 🏁 Services loading finished, loadingServices set to false');
      }
    };

    loadServices();
  }, [user]);

  const nameValue = form.watch('name');
  const phoneNumberValue = form.watch('phoneNumber');
  const countryCodeValue = form.watch('countryCode');
  
  // Filter customers based on the name field value (for name dropdown)
  const filteredCustomersByName = useMemo(() => {
    const query = nameValue?.toLowerCase().trim() || '';
    console.log('[Step1Form] Filtering customers:', {
      query,
      totalCustomers: customers.length,
      nameValue
    });
    
    if (!query) {
      // If no query, show first 20 customers for browsing
      const result = customers.slice(0, 20);
      console.log('[Step1Form] No query - showing first 20:', result.length);
      return result;
    }
    
    const filtered = customers.filter((customer) => {
      const nameMatch = customer.Name?.toLowerCase().includes(query);
      const emailMatch = customer.Email?.toLowerCase().includes(query);
      const contactMatch = customer.Contact?.toLowerCase().includes(query);
      return nameMatch || emailMatch || contactMatch;
    }).slice(0, 20);
    
    console.log('[Step1Form] Filtered customers:', {
      query,
      filteredCount: filtered.length,
      sample: filtered.slice(0, 3).map(c => ({ id: c.Id, name: c.Name }))
    });
    
    return filtered;
  }, [customers, nameValue]);
  
  // Check if the current name value matches an existing customer
  const selectedCustomer = useMemo(() => {
    if (!nameValue) return null;
    return customers.find(c => 
      c.Name?.toLowerCase().trim() === nameValue.toLowerCase().trim()
    ) || null;
  }, [customers, nameValue]);

  // Phone-first autofill: When phone number is entered, search and autofill name
  useEffect(() => {
    if (phoneNumberValue && phoneNumberValue.trim().length > 0 && countryCodeValue && customers.length > 0) {
      // Only autofill if name field is empty or was just cleared
      const currentName = form.getValues('name');
      if (currentName && currentName.trim().length > 0) {
        // Don't overwrite if user has already entered a name
        return;
      }

      // Search for customer by phone number and country code
      const matchedCustomer = customers.find((c) => {
        const customerPhone = c.Contact?.trim() || '';
        const customerCountryCode = c.CountryCode || '';
        const inputPhone = phoneNumberValue.trim();
        
        // Match phone number (exact or partial) and country code
        return customerPhone === inputPhone && customerCountryCode === countryCodeValue;
      });

      if (matchedCustomer && matchedCustomer.Name) {
        // Auto-fill name when phone matches
        form.setValue('name', matchedCustomer.Name);
      }
    }
  }, [phoneNumberValue, countryCodeValue, customers, form]);

  // Auto-fill phone number when customer is selected (keep as fallback)
  useEffect(() => {
    if (nameValue && customers.length > 0) {
      const matchedCustomer = customers.find(
        (c) => c.Name?.toLowerCase().trim() === nameValue.toLowerCase().trim()
      );
      if (matchedCustomer) {
        // Auto-fill phone number
        if (matchedCustomer.Contact) {
          form.setValue('phoneNumber', matchedCustomer.Contact);
        }
        // Auto-fill country code
        if (matchedCustomer.CountryCode) {
          form.setValue('countryCode', matchedCustomer.CountryCode);
        }
      }
    }
  }, [nameValue, customers, form]);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    const query = countrySearchQuery.toLowerCase().trim();
    const allCountries = allCallingCountries();
    
    if (!query) {
      return allCountries;
    }
    
    return allCountries.filter((code) => {
      const countryName = getCountryName(code).toLowerCase();
      const callingCode = getCallingCode(code).toLowerCase();
      return (
        code.toLowerCase().includes(query) ||
        countryName.includes(query) ||
        callingCode.includes(query)
      );
    });
  }, [countrySearchQuery]);

  // Get customers with phone numbers for the selected country code
  const customersWithPhoneForCountry = useMemo(() => {
    if (!countryCodeValue) return [];
    return customers.filter(
      (c) => c.CountryCode === countryCodeValue && c.Contact
    );
  }, [customers, countryCodeValue]);

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    const query = serviceSearchQuery.toLowerCase().trim();
    if (!query) {
      return services; // Show all services when no search query
    }
    return services.filter((service) =>
      service.ServiceName?.toLowerCase().includes(query)
    );
  }, [services, serviceSearchQuery]);

  // Initialize Google Maps Places Autocomplete for location field
  useEffect(() => {
    const initLocationAutocomplete = () => {
      if (!locationInputRef.current || autocompleteRef.current) return;
      
      if (window.google?.maps?.places?.Autocomplete) {
        try {
          const autocompleteInstance = new window.google.maps.places.Autocomplete(
            locationInputRef.current,
            {
              fields: ['formatted_address', 'geometry', 'name', 'address_components'],
            }
          );

          autocompleteInstance.addListener('place_changed', () => {
            const place = autocompleteInstance.getPlace();

            if (!place.geometry || !place.geometry.location) {
              return;
            }

            // Update form field with formatted address
            const address = place.formatted_address || place.name || '';
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            // Store as JSON string with address, lat, lng
            const locationData = JSON.stringify({
              Address: address,
              Lat: lat,
              Lng: lng,
            });
            
            form.setValue('location', locationData);
          });

          autocompleteRef.current = autocompleteInstance;
        } catch (error) {
          console.error('Failed to initialize location autocomplete:', error);
        }
      }
    };

    // Load Google Maps API if not already loaded
    if (window.google?.maps?.places?.Autocomplete) {
      initLocationAutocomplete();
    } else if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(() => {
          initLocationAutocomplete();
        }, 200);
      };
      document.head.appendChild(script);
    } else {
      // Script exists, wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete) {
          clearInterval(checkInterval);
          initLocationAutocomplete();
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, [form, mapKey]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        nameDropdownRef.current &&
        !nameDropdownRef.current.contains(event.target as Node) &&
        nameDropdownOpen
      ) {
        // Check if click is not on the input field
        const inputElement = nameDropdownRef.current.parentElement?.querySelector('input');
        if (inputElement && !inputElement.contains(event.target as Node)) {
          setNameDropdownOpen(false);
        }
      }
    };

    if (nameDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [nameDropdownOpen]);

  const onSubmit = async (data: z.infer<typeof step1Schema>) => {
    // Combine recurringPeriodValue and recurringPeriodUnit into recurringPeriod string
    // Format: "X days" or "X hours"
    const unit = data.recurringPeriodUnit.toLowerCase();
    const recurringPeriod = `${data.recurringPeriodValue} ${unit}`;
    await onNext({
      ...data,
      recurringPeriod,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Name <span className="text-red-500">*</span>
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <div className="relative" ref={nameDropdownRef}>
                    <Input
                      {...field}
                      placeholder="Search or enter customer name..."
                      className={cn("h-[40px] pr-10", fieldState.error && "border-destructive")}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value);
                        // Show dropdown when typing (if there are customers or user is searching)
                        if (value.trim().length > 0) {
                          setNameDropdownOpen(true);
                        } else {
                          // Close dropdown when input is cleared
                          setNameDropdownOpen(false);
                        }
                      }}
                      onFocus={() => {
                        // Show dropdown when focused (if there are customers or user is typing)
                        if (field.value?.trim().length > 0 || customers.length > 0) {
                          setNameDropdownOpen(true);
                        }
                        console.log('[Step1Form] Input focused:', {
                          customersCount: customers.length,
                          loadingCustomers,
                          nameValue: field.value
                        });
                      }}
                      onBlur={() => {
                        // Delay closing to allow click on dropdown item
                        // The click-outside handler will close it if needed
                        setTimeout(() => {
                          // Only close if focus didn't move to dropdown or another input
                          const activeElement = document.activeElement;
                          if (!nameDropdownRef.current?.contains(activeElement)) {
                            setNameDropdownOpen(false);
                          }
                        }, 200);
                      }}
                    />
                    {loadingCustomers ? (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                      <ChevronsUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                    
                    {/* Dropdown */}
                    {nameDropdownOpen && (
                      <div 
                        className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-hidden"
                        onMouseDown={(e) => {
                          // Prevent input blur when clicking inside dropdown
                          e.preventDefault();
                        }}
                      >
                        {loadingCustomers ? (
                          <div className="py-6 text-center text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Loading customers...
                          </div>
                        ) : customers.length === 0 ? (
                          <div className="py-4 text-center">
                            <p className="text-sm text-gray-500 mb-1">
                              No customers loaded (0 customers)
                            </p>
                            <p className="text-xs text-gray-400">
                              Check browser console (F12) for details
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Debug: loading={loadingCustomers.toString()}, customers={customers.length}
                            </p>
                          </div>
                        ) : filteredCustomersByName.length > 0 ? (
                          <div className="overflow-y-auto max-h-[300px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                              {filteredCustomersByName.length} customer{filteredCustomersByName.length !== 1 ? 's' : ''} found
                            </div>
                            {filteredCustomersByName.map((customer) => (
                          <div
                            key={customer.Id}
                                onMouseDown={(e) => {
                                  // Prevent input blur when clicking dropdown item
                                  e.preventDefault();
                                }}
                            onClick={() => {
                                  const customerName = customer.Name || '';
                                  field.onChange(customerName);
                                  setNameDropdownOpen(false);
                                  
                                  // Auto-fill phone if available
                                  if (customer.Contact && !form.getValues('phoneNumber')) {
                                    form.setValue('phoneNumber', customer.Contact);
                                  }
                                  // Auto-fill country code if available
                                  if (customer.CountryCode && !form.getValues('countryCode')) {
                                    form.setValue('countryCode', customer.CountryCode);
                                  }
                            }}
                            className={cn(
                                  "px-3 py-2.5 cursor-pointer text-sm transition-colors",
                              "hover:bg-gray-50 active:bg-gray-100",
                                  "border-b border-gray-100 last:border-b-0",
                                  selectedCustomer?.Id === customer.Id && "bg-blue-50"
                            )}
                          >
                                <div className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "h-4 w-4 flex-shrink-0 transition-opacity",
                                      selectedCustomer?.Id === customer.Id
                                        ? "opacity-100 text-blue-600"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    <span className="font-medium text-gray-900 truncate">
                                      {customer.Name || 'Unnamed Customer'}
                                    </span>
                                    {(customer.Email || customer.Contact) && (
                                      <span className="text-xs text-gray-500 truncate">
                                        {customer.Email && customer.Contact
                                          ? `${customer.Email} • ${customer.Contact}`
                                          : customer.Email || customer.Contact}
                                      </span>
                                    )}
                                  </div>
                                </div>
                          </div>
                        ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center">
                            {nameValue ? (
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  No customer found matching "{nameValue}"
                                </p>
                                <p className="text-xs text-gray-400">
                                  This will create a new customer
                                </p>
                              </div>
                            ) : customers.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                No customers found. Start typing to create a new customer.
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Start typing to search customers...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {selectedCustomer && (
                  <p className="text-xs text-gray-500">
                    ✓ Existing customer selected
                  </p>
                )}
                {nameValue && !selectedCustomer && (
                  <p className="text-xs text-blue-600">
                    ℹ New customer will be created
                  </p>
                )}
              </div>
            </FormItem>
          )}
        />

        {/* Phone Number */}
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field, fieldState }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Number <span className="text-red-500">*</span>
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <div className={cn(
                    "flex items-center w-full border rounded-md px-4 h-[40px] bg-white text-gray-700 focus-within:ring-2 focus-within:ring-blue-500",
                    fieldState.error ? "border-destructive focus-within:ring-destructive/20" : "border-gray-300"
                  )}>
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field: countryField }) => (
                        <Popover open={countryCodeOpen} onOpenChange={setCountryCodeOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="h-auto w-auto min-w-[60px] border-0 bg-transparent p-0 pr-2 mr-2 focus:ring-0 focus-visible:ring-0 shadow-none hover:bg-transparent flex items-center gap-1.5 text-sm font-medium text-gray-700"
                            >
                              <span className="font-semibold">{countryField.value || 'US'}</span>
                              <span className="text-gray-500">+{getCallingCode(countryField.value || 'US').replace('+', '')}</span>
                              <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search country or code..."
                                value={countrySearchQuery}
                                onValueChange={setCountrySearchQuery}
                              />
                              <CommandList>
                                <CommandEmpty>No country found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredCountries.map((countryCode) => {
                              const callingCode = getCallingCode(countryCode);
                                    const countryName = getCountryName(countryCode);
                                    const countryCustomers = customers.filter(
                                      (c) => c.CountryCode === countryCode && c.Contact
                                    );
                                    
                              return (
                                      <CommandItem
                                        key={countryCode}
                                        value={`${countryCode} ${countryName} ${callingCode}`}
                                        onSelect={() => {
                                          countryField.onChange(countryCode);
                                          form.setValue('countryCode', countryCode);
                                          setCountryCodeOpen(false);
                                          setCountrySearchQuery('');
                                          
                                          // Auto-fill phone if there's only one customer for this country
                                          if (countryCustomers.length === 1 && !form.getValues('phoneNumber')) {
                                            form.setValue('phoneNumber', countryCustomers[0].Contact || '');
                                          }
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex items-center justify-between w-full gap-2">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="font-semibold text-gray-900 min-w-[35px]">
                                              {countryCode}
                                            </span>
                                            <span className="text-gray-600 text-sm truncate">
                                              {countryName}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-gray-500 text-sm">
                                  +{callingCode.replace('+', '')}
                                            </span>
                                            {countryCustomers.length > 0 && (
                                              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {countryCustomers.length}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </CommandItem>
                              );
                            })}
                                </CommandGroup>
                                {countryCodeValue && customersWithPhoneForCountry.length > 0 && (
                                  <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Phone numbers for this country">
                                      {customersWithPhoneForCountry.slice(0, 5).map((customer) => (
                                        <CommandItem
                                          key={customer.Id}
                                          onSelect={() => {
                                            if (customer.Contact) {
                                              form.setValue('phoneNumber', customer.Contact);
                                            }
                                            setCountryCodeOpen(false);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2 w-full">
                                            <span className="text-sm text-gray-600 truncate">
                                              {customer.Name}
                                            </span>
                                            <span className="text-sm text-gray-500 ml-auto">
                                              {customer.Contact}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    <input
                      type="tel"
                      {...field}
                      placeholder="(555) 000-0000"
                      className="flex-1 bg-transparent outline-none text-gray-700 text-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field, fieldState }) => {
            // Parse location value to display address if it's JSON
            let displayValue = field.value || '';
            try {
              const locationData = JSON.parse(field.value || '{}');
              if (locationData.Address) {
                displayValue = locationData.Address;
              }
            } catch {
              // Not JSON, use as-is
            }

            return (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Location <span className="text-red-500">*</span>
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                        ref={locationInputRef}
                        value={displayValue}
                        onChange={(e) => {
                          // Allow manual typing, but autocomplete will override on selection
                          field.onChange(e.target.value);
                        }}
                        placeholder="Search for address..."
                        className={cn("pl-10 h-[40px]", fieldState.error && "border-destructive")}
                      />
                    </div>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
            );
          }}
        />

        {/* Service */}
        <FormField
          control={form.control}
          name="service"
          render={({ field, fieldState }) => {
            // Parse service value - it might be JSON string with Id and ServiceName, or just service name
            let selectedService: CompanyService | null = null;
            let displayValue = '';
            
            try {
              const serviceData = JSON.parse(field.value || '{}');
              if (serviceData.Id) {
                selectedService = services.find(s => s.Id === serviceData.Id) || null;
                displayValue = serviceData.ServiceName || selectedService?.ServiceName || '';
              }
            } catch {
              // Not JSON, might be service name or ID
              const serviceName = field.value || '';
              selectedService = services.find(s => s.ServiceName === serviceName) || null;
              displayValue = serviceName;
            }

            return (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Service <span className="text-red-500">*</span>
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                      <Input
                        placeholder={services.length === 0 ? "No services available. Create services first." : "Search and select a service"}
                        value={serviceSearchQuery || displayValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          setServiceSearchQuery(value);
                          // If user is deleting characters, clear the selected service
                          if (value === '' && displayValue) {
                            field.onChange('');
                            setServiceSearchQuery('');
                          }
                          // Always show dropdown when typing
                          if (services.length > 0 && value.length > 0) {
                            setServiceDropdownOpen(true);
                          }
                        }}
                        onFocus={() => {
                          // Show dropdown when focused if services are available
                          if (services.length > 0) {
                            setServiceDropdownOpen(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay closing to allow click on dropdown item
                          setTimeout(() => {
                            setServiceDropdownOpen(false);
                            // Clear search query if service is selected (to show selected service name)
                            if (displayValue && !serviceSearchQuery) {
                              // Keep displayValue, clear search query
                            } else if (!displayValue) {
                              setServiceSearchQuery('');
                            }
                          }, 200);
                        }}
                        className={cn("h-[40px] pl-10", displayValue && !serviceSearchQuery ? "pr-20" : "pr-10", fieldState.error && "border-destructive")}
                      />
                      {/* Close icon - shows when service is selected */}
                      {displayValue && !serviceSearchQuery && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            field.onChange('');
                            setServiceSearchQuery('');
                            setServiceDropdownOpen(false);
                          }}
                          className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer z-10"
                          title="Clear service"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (services.length > 0) {
                            setServiceDropdownOpen(!serviceDropdownOpen);
                            // Clear search when opening dropdown to show all services
                            if (!serviceDropdownOpen) {
                              setServiceSearchQuery('');
                            }
                          }
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <ChevronsUpDown className="w-4 h-4" />
                      </button>
                      {serviceDropdownOpen && (loadingServices ? (
                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading services...
                          </div>
                        </div>
                      ) : services.length === 0 ? (
                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                          <div className="text-sm text-amber-600">
                            No services found. Please create services on the Services page first.
                          </div>
                        </div>
                      ) : filteredServices.length === 0 ? (
                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                          <div className="text-sm text-gray-500">
                            No services match "{serviceSearchQuery}". Try a different search term.
                          </div>
                        </div>
                      ) : (
                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] max-h-[240px] overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 [scrollbar-width:thin] [scrollbar-color:rgb(209,213,219)_transparent]">
                          {serviceSearchQuery && (
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
                            </div>
                          )}
                          {filteredServices.map((service) => {
                            const isSelected = selectedService?.Id === service.Id;
                            return (
                              <div
                                key={service.Id}
                                onMouseDown={(e) => {
                                  // Prevent input blur when clicking dropdown item
                                  e.preventDefault();
                                }}
                                onClick={() => {
                                  // Store as JSON string with Id and ServiceName
                                  const serviceData = JSON.stringify({
                                    Id: service.Id,
                                    ServiceName: service.ServiceName,
                                  });
                                  field.onChange(serviceData);
                                  setServiceSearchQuery(''); // Clear search to show selected service name
                                  setServiceDropdownOpen(false);
                                }}
                                className={cn(
                                  "px-3 py-2.5 cursor-pointer text-sm text-gray-900 flex items-center gap-2.5 transition-colors",
                                  "hover:bg-gray-50 active:bg-gray-100",
                                  "first:rounded-t-lg last:rounded-b-lg",
                                  isSelected && "bg-blue-50"
                                )}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 flex-shrink-0 transition-opacity",
                                    isSelected ? "opacity-100 text-blue-600" : "opacity-0"
                                  )}
                                />
                                <span className="flex-1 truncate">{service.ServiceName}</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                  </div>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
            );
          }}
        />

        {/* Recurring Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
          <div className="flex items-start">
            <Label className="font-medium">
              Recurring Period <span className="text-red-500">*</span>
            </Label>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="recurringPeriodValue"
                render={({ field }) => (
                  <FormItem className="w-20">
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ''}
                        className="h-[40px] w-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recurringPeriodUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Tabs
                        value={field.value || 'days'}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('recurringPeriodUnit', value);
                        }}
                        className="w-full"
                      >
                        <TabsList className="h-[40px] w-full grid grid-cols-2">
                          <TabsTrigger value="days" className="text-sm">
                            days
                          </TabsTrigger>
                          <TabsTrigger value="hours" className="text-sm">
                            hours
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Expiry Date */}
        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field, fieldState }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Expiry Date <span className="text-red-500">*</span>
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "h-[40px] w-full flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm",
                          "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:border-transparent",
                          "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                          !field.value && "text-gray-400",
                          fieldState.error 
                            ? "border-destructive focus:ring-destructive/20" 
                            : "border-gray-300 focus:ring-blue-500"
                        )}
                      >
                        <span className={cn("flex-1 text-left", field.value ? "text-gray-900" : "text-gray-400")}>
                          {field.value 
                            ? format(new Date(field.value + 'T00:00:00'), "MM/dd/yyyy")
                            : "MM/DD/YYYY"
                          }
                        </span>
                        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(format(date, "yyyy-MM-dd"));
                          } else {
                            field.onChange('');
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="rounded-md border-0"
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Next Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Next
          </Button>
        </div>
      </form>
    </Form>
  );
}
