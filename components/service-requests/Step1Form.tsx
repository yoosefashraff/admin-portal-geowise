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
import { Check, ChevronsUpDown, Search, CalendarIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useAuthStore } from '@/lib/store/authStore';
import { listcustomerforscheduler } from '@/lib/actions/scheduler.actions';
import type { Customer } from '@/lib/types/scheduler.types';
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
  onNext: (data: Partial<ServiceRequestFormData>) => void;
}

export default function Step1Form({ initialData, onNext }: Step1FormProps) {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [open, setOpen] = useState(false);
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

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
      if (!user) return;
      setLoadingCustomers(true);
      try {
        // Fetch customers - using providerId 0 to get all customers
        const response = await listcustomerforscheduler({ providerId: 0 });
        if (response.Response) {
          setCustomers(response.Response);
        } else {
          setCustomers([]);
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, [user]);

  const nameValue = form.watch('name');
  const countryCodeValue = form.watch('countryCode');
  
  const filteredCustomers = useMemo(() => {
    const query = nameValue?.toLowerCase().trim() || '';
    if (!query) {
      // If no query, show first 20 customers for browsing
      return customers.slice(0, 20);
    }
    return customers.filter((customer) =>
      customer.Name?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [customers, nameValue]);

  // Auto-fill phone number when customer is selected
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

  // Auto-open dropdown when user types and there are matches
  useEffect(() => {
    if (nameValue && filteredCustomers.length > 0) {
      setOpen(true);
    }
    // Don't auto-close when nameValue is empty - let user click icon to browse
  }, [nameValue, filteredCustomers.length]);

  const onSubmit = (data: z.infer<typeof step1Schema>) => {
    // Combine recurringPeriodValue and recurringPeriodUnit into recurringPeriod string
    // Format: "X days" or "X hours"
    const unit = data.recurringPeriodUnit.toLowerCase();
    const recurringPeriod = `${data.recurringPeriodValue} ${unit}`;
    onNext({
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
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="Enter name or choose existing"
                      className={cn("h-[40px] pr-10", fieldState.error && "border-destructive")}
                      onChange={(e) => {
                        field.onChange(e);
                        const value = e.target.value.trim();
                        if (value && filteredCustomers.length > 0) {
                          setOpen(true);
                        } else {
                          setOpen(false);
                        }
                      }}
                      onFocus={() => {
                        if (nameValue && filteredCustomers.length > 0) {
                          setOpen(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay closing to allow click on dropdown item
                        setTimeout(() => setOpen(false), 200);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(!open);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      <ChevronsUpDown className="w-4 h-4" />
                    </button>
                    {open && filteredCustomers.length > 0 && (
                      <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] max-h-[240px] overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 [scrollbar-width:thin] [scrollbar-color:rgb(209,213,219)_transparent]">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.Id}
                            onClick={() => {
                              form.setValue('name', customer.Name || '');
                              setOpen(false);
                            }}
                            className={cn(
                              "px-3 py-2.5 cursor-pointer text-sm text-gray-900 flex items-center gap-2.5 transition-colors",
                              "hover:bg-gray-50 active:bg-gray-100",
                              "first:rounded-t-lg last:rounded-b-lg",
                              field.value === customer.Name && "bg-gray-50"
                            )}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 flex-shrink-0 transition-opacity",
                                field.value === customer.Name ? "opacity-100 text-gray-700" : "opacity-0"
                              )}
                            />
                            <span className="flex-1 truncate">{customer.Name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
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
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Location <span className="text-red-500">*</span>
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter lat/long, shortcode, or full address"
                    className="h-[40px]"
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Service */}
        <FormField
          control={form.control}
          name="service"
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Service <span className="text-red-500">*</span>
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      {...field}
                      placeholder="Service"
                      className="pl-10 h-[40px]"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
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
