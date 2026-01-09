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
import { use, useCallback, useEffect, useState } from "react";
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
  event: CalendarEvent;
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

  const timeRanger = event.extendedProps.time && event.extendedProps.time.split('-');
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      ProviderId: '',
      ServiceId: '',
      Date: event.extendedProps.date || '',
      Time: timeRanger ? timeRanger[0].trim() : '',
      EndTime: timeRanger ? timeRanger[1].trim() : '',
      CountryCode: '+966',
      PhoneNumber: '',
      CustomerName: event.extendedProps.customer || '',
      Address: event.extendedProps.location || '',
      Note: event.extendedProps.note || ''
    },
  });

  const load = async () => {
    if (!user) return;
    const response = await fetchProviderByCompanyId(user.UserID);
    if (response.Status === 201) {
      setProviders(response.Object);
    }
    const response2 = await getCompanyProviderServices({CompanyAdminId: user.UserID, ProviderId: Number(event.resourceId || 0)});
    if (response2.Status === 201) {
      setServices(response2.Object);
    }
  }

  useEffect( () => {
    load();
  }, [user]);

  useEffect(() => {
    if (providers.length > 0 && event.resourceId) {
      form.setValue('ProviderId', String(event.resourceId));
    }
  }, [providers]);

  useEffect(() => {
    if(services.length > 0) {
      const selectedService = services.find((service) => service.ServiceName === event.extendedProps.services);
      form.setValue('ServiceId', String(selectedService?.Id || ''));
    }
  }, [services]);


  const onSubmit = (data: BookingFormData) => {
    let entTime = convertTo12Hour(data.EndTime);
    if(data.ServiceId){
      entTime = '';
    }
    data = {...data, EndTime: entTime};
    const bookingPayload : BookingRequestPayload = {
      ...data, 
      CompanyUserId : String(user?.UserID || ''),
      ServiceId: data.ServiceId ?? '',
      Address: data.Address ?? '',
      Note: data.Note ?? '',
      Time: convertTo12Hour(data.Time)
    };
    if(event.extendedProps.calloutId) {
      bookingPayload.CalloutId = event.extendedProps.calloutId;
    }
    if(event.extendedProps.blockHourId) {
      bookingPayload.BlockHourId = event.extendedProps.blockHourId;
    }
    handleSubmit(bookingPayload);
  };

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
                      <Input type="text" placeholder="Enter customer address" {...field} />
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