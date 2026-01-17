import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingRequestPayload, CalendarEvent } from "@/lib/types/calendar";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useAuthStore } from "@/lib/store/authStore";
import { use, useCallback, useEffect, useState, useRef } from "react";
import { fetchProviderByCompanyId, getCompanyProviderServices } from "@/lib/actions/provider.actions";
import { Provider } from "@/lib/types/provider.types";
import { Service } from "@/lib/types/scheduler.types";
import { convertTo12Hour } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

dayjs.extend(customParseFormat);

interface EditBookingDialogProps {
  showDialog: boolean;
  setShowDialog: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  event?: CalendarEvent; // Optional for new bookings
  handleSubmit: (bookingPayload: BookingRequestPayload) => void,
  editLoading: boolean
}

const bookingSchema = z.object({
  ProviderId: z.string().min(1, 'Provider is required'),
  ServiceId: z.string().optional(),
  Date: z.string().min(1, 'Date is required'),
  Time: z.string().min(1, 'From time is required'),
  EndTime: z.string().min(1, 'End time is required'),
  CountryCode: z.string().min(1, 'Country code is required'),
  PhoneNumber: z.string().min(8, 'Phone number must be at least 8 digits'),
  CustomerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  Address: z.string().optional(),
  Note: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function EditBookingDialog({showDialog, setShowDialog, handleSubmit, title, event, editLoading}: EditBookingDialogProps) {
  const {user} = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Refs for Google Maps autocomplete
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  // Strip quotes if present (common Vercel/Netlify env var issue)
  const rawKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAq2Vf7Ss-yLruim9i_vog14LwVGPBmt_g';
  const mapKey = rawKey.replace(/^["']|["']$/g, '').trim();

  // Handle new booking (no event) vs editing existing booking
  const isNewBooking = !event;
  const timeRanger = event?.extendedProps?.time ? event.extendedProps.time.split('-') : null;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      ProviderId: '',
      ServiceId: '',
      Date: event?.extendedProps?.date || today,
      Time: timeRanger ? timeRanger[0].trim() : '09:00',
      EndTime: timeRanger ? timeRanger[1].trim() : '17:00',
      CountryCode: '+966',
      PhoneNumber: '',
      CustomerName: event?.extendedProps?.customer || '',
      Address: event?.extendedProps?.location || '',
      Note: event?.extendedProps?.note || ''
    },
  });

  const load = async () => {
    if (!user) return;
    const response = await fetchProviderByCompanyId(user.UserID);
    if (response.Status === 201) {
      setProviders(response.Object);
    }
    // Only load services if editing an existing booking with a provider
    if (event?.resourceId) {
      const response2 = await getCompanyProviderServices({CompanyAdminId: user.UserID, ProviderId: Number(event.resourceId || 0)});
      if (response2.Status === 201) {
        setServices(response2.Object);
      }
    }
  }

  useEffect( () => {
    load();
  }, [user]);

  useEffect(() => {
    if (providers.length > 0 && event?.resourceId) {
      form.setValue('ProviderId', String(event.resourceId));
    }
  }, [providers, event?.resourceId, form]);

  useEffect(() => {
    if(services.length > 0 && event?.extendedProps?.services) {
      const selectedService = services.find((service) => service.ServiceName === event.extendedProps.services);
      form.setValue('ServiceId', String(selectedService?.Id || ''));
    }
  }, [services, event?.extendedProps?.services, form]);

  // Load services when provider is selected (for new bookings)
  const selectedProviderId = form.watch('ProviderId');
  useEffect(() => {
    if (selectedProviderId && !event && user) {
      // Load services for selected provider when creating new booking
      getCompanyProviderServices({CompanyAdminId: user.UserID, ProviderId: Number(selectedProviderId)})
        .then((response) => {
          if (response.Status === 201) {
            setServices(response.Object || []);
          }
        })
        .catch((error) => {
          console.error('Error loading services:', error);
        });
    }
  }, [selectedProviderId, event, user]);

  // Initialize Google Maps Places Autocomplete for address field
  useEffect(() => {
    if (!showDialog) {
      // Clean up when dialog closes
      if (autocompleteRef.current) {
        autocompleteRef.current = null;
      }
      return;
    }

    const initAddressAutocomplete = () => {
      if (!addressInputRef.current || autocompleteRef.current) return;
      
      if (window.google?.maps?.places?.Autocomplete) {
        try {
          const autocompleteInstance = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
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
            
            // Update the form field
            form.setValue('Address', address);
          });

          autocompleteRef.current = autocompleteInstance;
          
          console.log('[EditBookingDialog] ✅ Autocomplete initialized:', {
            inputElement: !!addressInputRef.current,
            autocompleteInstance: !!autocompleteInstance
          });

          // Fix z-index and pointer-events after autocomplete is created
          const fixDropdownStyles = () => {
            const pacContainer = document.querySelector('.pac-container') as HTMLElement;
            if (pacContainer) {
              console.log('[EditBookingDialog] 🔧 Fixing pac-container styles:', {
                currentZIndex: pacContainer.style.zIndex || window.getComputedStyle(pacContainer).zIndex || 'not set',
                currentPointerEvents: pacContainer.style.pointerEvents || window.getComputedStyle(pacContainer).pointerEvents || 'not set',
                parentElement: pacContainer.parentElement?.tagName || 'none'
              });
              
              pacContainer.style.zIndex = '10000';
              pacContainer.style.pointerEvents = 'auto';
              pacContainer.style.position = 'absolute';
              
              // Also fix all pac-items to be clickable
              const pacItems = pacContainer.querySelectorAll('.pac-item');
              console.log('[EditBookingDialog] 🔧 Found pac-items:', pacItems.length);
              
              pacItems.forEach((item, index) => {
                const itemEl = item as HTMLElement;
                itemEl.style.pointerEvents = 'auto';
                itemEl.style.cursor = 'pointer';
                itemEl.style.userSelect = 'none';
                
                // Add click handler that stops propagation but doesn't prevent default
                // (Google Maps needs the default behavior)
                const clickHandler = (e: MouseEvent) => {
                  console.log('[EditBookingDialog] 🖱️ pac-item clicked:', index, e.target);
                  e.stopPropagation(); // Stop event from reaching dialog overlay
                  // Don't preventDefault - let Google Maps handle it
                };
                
                // Remove existing listener if any, then add new one
                itemEl.removeEventListener('mousedown', clickHandler);
                itemEl.addEventListener('mousedown', clickHandler, true); // Use capture phase
              });
              
              console.log('[EditBookingDialog] ✅ Styles applied to pac-container');
            } else {
              console.warn('[EditBookingDialog] ⚠️ pac-container not found');
            }
          };

          // Fix styles immediately and on input focus/input
          const applyStyles = () => {
            setTimeout(fixDropdownStyles, 50);
          };
          
          applyStyles();
          
          if (addressInputRef.current) {
            addressInputRef.current.addEventListener('focus', applyStyles);
            addressInputRef.current.addEventListener('input', applyStyles);
            addressInputRef.current.addEventListener('keydown', applyStyles);
          }

          // Use MutationObserver to fix styles when dropdown appears
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === 1) {
                    const element = node as HTMLElement;
                    if (element.classList?.contains('pac-container') || element.querySelector?.('.pac-container')) {
                      applyStyles();
                    }
                  }
                });
              }
            });
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });

          // Cleanup function
          const cleanup = () => {
            observer.disconnect();
            if (addressInputRef.current) {
              addressInputRef.current.removeEventListener('focus', applyStyles);
              addressInputRef.current.removeEventListener('input', applyStyles);
              addressInputRef.current.removeEventListener('keydown', applyStyles);
            }
          };

          return cleanup;
        } catch (error) {
          console.error('Failed to initialize address autocomplete:', error);
        }
      }
    };

    // Wait for dialog to fully render before initializing
    const timeoutId = setTimeout(() => {
      // Load Google Maps API if not already loaded
      if (window.google?.maps?.places?.Autocomplete) {
        initAddressAutocomplete();
      } else if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setTimeout(() => {
            initAddressAutocomplete();
          }, 200);
        };
        document.head.appendChild(script);
      } else {
        // Script exists, wait for it to load
        const checkInterval = setInterval(() => {
          if (window.google?.maps?.places?.Autocomplete) {
            clearInterval(checkInterval);
            initAddressAutocomplete();
          }
        }, 100);

        return () => clearInterval(checkInterval);
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (autocompleteRef.current) {
        autocompleteRef.current = null;
      }
    };
  }, [showDialog, form, mapKey]);

  const onSubmit = (data: BookingFormData) => {
    let entTime = convertTo12Hour(data.EndTime);
    if(data.ServiceId){
      entTime = '';
    }
    data = {...data, EndTime: entTime};
    const bookingPayload : BookingRequestPayload = {
      ...data, 
      CompanyUserId : String(user?.UserID || ''),
      ServiceId: data.ServiceId ?? '0', // Use '0' if empty (for block hours)
      Address: data.Address ?? '',
      Note: data.Note ?? '',
      Time: convertTo12Hour(data.Time),
      EndTime: entTime || '' // Ensure EndTime is always a string
    };
    
    // Only include calloutId and blockHourId when editing existing booking
    if(event?.extendedProps?.calloutId) {
      bookingPayload.CalloutId = event.extendedProps.calloutId;
    }
    if(event?.extendedProps?.blockHourId) {
      bookingPayload.BlockHourId = event.extendedProps.blockHourId;
    }
    
    console.log('[EditBookingDialog] 📤 Submitting booking payload:', {
      fullPayload: bookingPayload,
      hasProviderId: !!bookingPayload.ProviderId,
      hasDate: !!bookingPayload.Date,
      hasTime: !!bookingPayload.Time,
      hasCustomerName: !!bookingPayload.CustomerName,
      hasPhoneNumber: !!bookingPayload.PhoneNumber,
      hasCountryCode: !!bookingPayload.CountryCode,
      hasCompanyUserId: !!bookingPayload.CompanyUserId,
      serviceId: bookingPayload.ServiceId,
      endTime: bookingPayload.EndTime
    });
    
    handleSubmit(bookingPayload);
  };

  // Inject CSS to fix Google Maps autocomplete z-index issue
  useEffect(() => {
    if (!showDialog) return;
    
    const styleId = 'google-maps-autocomplete-fix';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .pac-container {
        z-index: 9999 !important;
      }
      [data-slot="dialog-content"] {
        overflow: visible !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [showDialog]);

  return (
    <Dialog open={showDialog} onOpenChange={() => setShowDialog(false)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          {editLoading && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/50 z-50">
            <div className="flex items-center gap-2">
              <Spinner className="size-8 text-gray-500" />
            </div>
          </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Row 1: Provider and Service */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ProviderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Provider <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providers.map((provider) => (
                            <SelectItem key={provider.ProviderId} value={String(provider.ProviderId)} >
                              {provider.ProviderName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ServiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.Id} value={String(service.Id)}>
                              {service.ServiceName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Date and Times */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="Date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="Time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        From Time <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="EndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        End Time <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="CountryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Country Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="+966" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="PhoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Phone Number <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="501234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="CustomerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Customer Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 4: Address */}
              <FormField
                control={form.control}
                name="Address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="Search address with Google Maps" 
                        {...field}
                        ref={(e) => {
                          field.ref(e);
                          addressInputRef.current = e;
                        }}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 5: Note */}
              <FormField
                control={form.control}
                name="Note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Blocked Time"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                <Button type="button" 
                  onClick={() => setShowDialog(false)} 
                  className="flex-1 cursor-pointer">
                  Close
                </Button>
                <Button type="submit"  variant="default" className="flex-1 cursor-pointer">Save</Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}