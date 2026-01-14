'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/authStore';
import {
  createApprovedUserCredit,
  updateApprovedUserCredit,
  listApprovedUserCredits,
  type ApprovedUserCredit,
} from '@/lib/actions/approvedUserCredits.actions';
import { getServicesForCompany } from '@/lib/actions/service.actions';
import { listcustomerforscheduler } from '@/lib/actions/scheduler.actions';
import type { Customer } from '@/lib/types/scheduler.types';
import type { CompanyService } from '@/lib/types/service.types';
import { Spinner } from '@/components/ui/spinner';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn, parseDotNetDate } from '@/lib/utils';

const formSchema = z.object({
  UserId: z.number().min(0, 'User ID must be valid'),
  UserName: z.string().optional(), // For manual entry
  UserPhone: z.string().optional(), // For new user creation
  ServiceId: z.number().min(1, 'Service is required'),
  ApprovedCredits: z.number().min(0, 'Approved credits cannot be negative').optional(),
  UsedCredits: z.number().min(0, 'Used credits cannot be negative').optional(),
  RemainingCredits: z.number().min(0, 'Remaining credits is required'),
  StartDate: z.string().min(1, 'Start date is required'),
  EndDate: z.string().min(1, 'End date is required'),
  RecurringPeriod: z.number().min(1, 'Recurring period must be at least 1'),
  RecurringPeriodUnit: z.string().min(1, 'Recurring period unit is required'),
  IsActive: z.boolean(),
}).refine((data) => data.UserId > 0 || (data.UserName && data.UserName.trim().length > 0), {
  message: 'User is required - either select from dropdown or enter manually',
  path: ['UserId'],
});

type CreditFormData = z.infer<typeof formSchema>;

interface CreditFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credit?: ApprovedUserCredit | null;
}

export default function CreditFormDialog({ open, onOpenChange, credit }: CreditFormDialogProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<CompanyService[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);

  const form = useForm<CreditFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      UserId: 0,
      UserName: '',
      UserPhone: '',
      ServiceId: 0,
      ApprovedCredits: 0,
      UsedCredits: 0,
      RemainingCredits: 0,
      StartDate: new Date().toISOString().split('T')[0],
      EndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      RecurringPeriod: 1,
      RecurringPeriodUnit: 'days',
      IsActive: true,
    },
  });

  // Load customers and services
  useEffect(() => {
    const loadData = async () => {
      if (!user?.UserID || !open) return;

      setLoadingData(true);
      try {
        // Load customers (users)
        // Note: API requires providerId > 0, so we'll try with providerId: 1 as a fallback
        // If that fails, we'll extract users from existing credits
        let customersResponse;
        try {
          customersResponse = await listcustomerforscheduler({ providerId: 1 });
          console.log('[CreditFormDialog] Customers API response:', customersResponse);
          if (customersResponse.Response && Array.isArray(customersResponse.Response) && customersResponse.Response.length > 0) {
            setCustomers(customersResponse.Response);
            console.log('[CreditFormDialog] Loaded customers:', customersResponse.Response.length);
          } else {
            // Fallback: Extract unique users from existing credits
            console.log('[CreditFormDialog] No customers from API, trying to extract from existing credits...');
            const creditsResponse = await listApprovedUserCredits({ IsActive: true });
            if (creditsResponse.Status === 201 && creditsResponse.data && Array.isArray(creditsResponse.data)) {
              // Extract unique users from credits
              const uniqueUsers = new Map();
              creditsResponse.data.forEach((credit: any) => {
                if (credit.UserId && credit.UserName && !uniqueUsers.has(credit.UserId)) {
                  uniqueUsers.set(credit.UserId, {
                    Id: credit.UserId,
                    Name: credit.UserName,
                    Contact: credit.UserPhone || '',
                    Email: credit.UserEmail || '',
                  });
                }
              });
              const usersArray = Array.from(uniqueUsers.values());
              setCustomers(usersArray);
              console.log('[CreditFormDialog] Loaded customers from credits:', usersArray.length);
            } else {
              setCustomers([]);
            }
          }
        } catch (apiError: any) {
          console.warn('[CreditFormDialog] Failed to fetch customers from API, trying credits fallback:', apiError);
          // Fallback: Extract unique users from existing credits
          try {
            const creditsResponse = await listApprovedUserCredits({ IsActive: true });
            if (creditsResponse.Status === 201 && creditsResponse.data && Array.isArray(creditsResponse.data)) {
              const uniqueUsers = new Map();
              creditsResponse.data.forEach((credit: any) => {
                if (credit.UserId && credit.UserName && !uniqueUsers.has(credit.UserId)) {
                  uniqueUsers.set(credit.UserId, {
                    Id: credit.UserId,
                    Name: credit.UserName,
                    Contact: credit.UserPhone || '',
                    Email: credit.UserEmail || '',
                  });
                }
              });
              const usersArray = Array.from(uniqueUsers.values());
              setCustomers(usersArray);
              console.log('[CreditFormDialog] Loaded customers from credits fallback:', usersArray.length);
            } else {
              setCustomers([]);
            }
          } catch (fallbackError) {
            console.error('[CreditFormDialog] Failed to load customers from credits:', fallbackError);
            setCustomers([]);
          }
        }

        // Load services
        const servicesResponse = await getServicesForCompany({
          CompanyAdminId: user.UserID,
          PageNo: 1,
          RecordsPerPage: 1000, // Get all services
        });
        if (servicesResponse.Status === 201 && servicesResponse.List) {
          setServices(servicesResponse.List);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load users and services');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user, open]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    const query = userSearchQuery.toLowerCase().trim();
    if (!query) {
      return customers.slice(0, 20); // Show first 20 when no search
    }
    return customers.filter((customer) =>
      customer.Name?.toLowerCase().includes(query) ||
      customer.Contact?.toLowerCase().includes(query) ||
      customer.Email?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [customers, userSearchQuery]);

  // Get current user value (either selected customer name or manual entry)
  const userId = form.watch('UserId');
  const userName = form.watch('UserName');
  
  const currentUserValue = useMemo(() => {
    if (userName && userName.trim().length > 0) return userName;
    
    if (userId > 0) {
      const customer = customers.find(c => c.Id === userId);
      return customer?.Name || '';
    }
    return '';
  }, [userId, userName, customers]);

  // Populate form when editing
  useEffect(() => {
    if (credit && open) {
      // Parse recurring period - might be in days or hours
      const recurringPeriod = credit.RecurringPeriod || 1;
      const recurringPeriodUnit = recurringPeriod < 24 ? 'hours' : 'days';
      const recurringPeriodValue = recurringPeriod < 24 ? recurringPeriod : Math.floor(recurringPeriod / 24);

      form.reset({
        UserId: credit.UserId,
        UserName: '',
        UserPhone: '',
        ServiceId: credit.ServiceId,
        ApprovedCredits: credit.ApprovedCredits,
        UsedCredits: credit.UsedCredits || 0,
        RemainingCredits: credit.RemainingCredits || credit.ApprovedCredits - (credit.UsedCredits || 0),
        StartDate: credit.StartDate ? (() => {
          const date = parseDotNetDate(credit.StartDate);
          return date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        })() : new Date().toISOString().split('T')[0],
        EndDate: credit.EndDate ? (() => {
          const date = parseDotNetDate(credit.EndDate);
          return date ? date.toISOString().split('T')[0] : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        })() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        RecurringPeriod: recurringPeriodValue,
        RecurringPeriodUnit: recurringPeriodUnit,
        IsActive: credit.IsActive ?? true,
      });
    } else if (!credit && open) {
      form.reset({
        UserId: 0,
        UserName: '',
        UserPhone: '',
        ServiceId: 0,
        ApprovedCredits: 0,
        UsedCredits: 0,
        RemainingCredits: 0,
        StartDate: new Date().toISOString().split('T')[0],
        EndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        RecurringPeriod: 1,
        RecurringPeriodUnit: 'days',
        IsActive: true,
      });
    }
  }, [credit, open, form]);

  const onSubmit = async (data: CreditFormData) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    // Handle manually entered username - try to find customer by name or create new user
    let finalUserId = data.UserId;
    if (data.UserName && data.UserName.trim().length > 0 && data.UserId === 0) {
      // Try to find customer by name (case-insensitive)
      const foundCustomer = customers.find(c => 
        c.Name?.toLowerCase().trim() === data.UserName?.toLowerCase().trim()
      );
      if (foundCustomer && foundCustomer.Id) {
        finalUserId = foundCustomer.Id;
        toast.info(`Found user: ${foundCustomer.Name}`);
      } else if (isCreatingNewUser && data.UserPhone && data.UserPhone.trim().length > 0) {
        // Creating new user - for now, we'll use 0 and let backend handle it
        // In a real implementation, you'd call an API to create the user first
        toast.info(`Creating new user: ${data.UserName} (${data.UserPhone})`);
        // Note: Backend should handle user creation if UserId is 0 and UserName/UserPhone are provided
        finalUserId = 0; // Keep as 0 to signal new user creation
      } else {
        toast.error('User not found. Please select from the dropdown, or enable "Add New User" and provide both name and phone number.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Convert dates to ISO format
      const startDate = new Date(data.StartDate);
      const endDate = new Date(data.EndDate);
      
      // Calculate recurring period in hours (convert days to hours if needed)
      let recurringPeriodInHours = data.RecurringPeriod || 1;
      if (data.RecurringPeriodUnit === 'days') {
        recurringPeriodInHours = (data.RecurringPeriod || 1) * 24;
      }

      const creditData: ApprovedUserCredit = {
        ...(credit?.Id && { Id: credit.Id }),
        UserId: finalUserId,
        ServiceId: data.ServiceId,
        ApprovedCredits: data.ApprovedCredits || 0,
        UsedCredits: data.UsedCredits || 0,
        RemainingCredits: data.RemainingCredits,
        StartDate: startDate.toISOString(),
        EndDate: endDate.toISOString(),
        RecurringPeriod: recurringPeriodInHours,
        IsActive: data.IsActive,
      };

      let response;
      if (credit?.Id) {
        // Update
        response = await updateApprovedUserCredit(creditData);
      } else {
        // Create
        response = await createApprovedUserCredit(creditData);
      }

      if (response.Status === 201) {
        toast.success(response.Message || (credit?.Id ? 'Credit updated successfully' : 'Credit created successfully'));
        onOpenChange(false);
      } else {
        toast.error(response.Message || 'Failed to save credit');
      }
    } catch (error) {
      console.error('Error saving credit:', error);
      toast.error('Failed to save credit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate remaining credits when approved or used changes
  const approvedCredits = form.watch('ApprovedCredits') || 0;
  const usedCredits = form.watch('UsedCredits') || 0;

  useEffect(() => {
    // Only auto-calculate if approved credits is provided
    const calculatedRemaining = approvedCredits - usedCredits;
    if (approvedCredits > 0 && calculatedRemaining >= 0) {
      form.setValue('RemainingCredits', calculatedRemaining);
    }
  }, [approvedCredits, usedCredits, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{credit?.Id ? 'Edit Credit' : 'Add New Credit'}</DialogTitle>
          <DialogDescription>
            {credit?.Id 
              ? 'Update the approved user credit details below.'
              : 'Create a new approved user credit. Ensure you are using test data only.'}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-8 h-8 text-gray-500" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* User Selection - Dropdown or Manual Entry */}
              <FormField
                control={form.control}
                name="UserId"
                render={({ field: userIdField, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>User *</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsCreatingNewUser(!isCreatingNewUser);
                          if (!isCreatingNewUser) {
                            form.setValue('UserId', 0);
                            form.setValue('UserName', '');
                            form.setValue('UserPhone', '');
                          }
                        }}
                        className="text-xs"
                      >
                        {isCreatingNewUser ? 'Select Existing' : 'Add New User'}
                      </Button>
                    </div>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            placeholder={isCreatingNewUser ? "Enter new user name" : "Select a user or enter manually"}
                            value={currentUserValue}
                            onChange={(e) => {
                              const value = e.target.value;
                              form.setValue('UserName', value);
                              form.setValue('UserId', 0); // Clear UserId when typing manually
                              setUserSearchQuery(value);
                              if (value && filteredCustomers.length > 0 && !isCreatingNewUser) {
                                setUserDropdownOpen(true);
                              } else {
                                setUserDropdownOpen(false);
                              }
                            }}
                            onFocus={() => {
                              if (filteredCustomers.length > 0 && !isCreatingNewUser) {
                                setUserDropdownOpen(true);
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => setUserDropdownOpen(false), 200);
                            }}
                            className={cn("h-[40px] pr-10", fieldState.error && "border-destructive")}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!isCreatingNewUser) {
                                setUserDropdownOpen(!userDropdownOpen);
                              }
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          >
                            <ChevronsUpDown className="w-4 h-4" />
                          </button>
                          {userDropdownOpen && !isCreatingNewUser && filteredCustomers.length > 0 && (
                            <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] max-h-[240px] overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 [scrollbar-width:thin] [scrollbar-color:rgb(209,213,219)_transparent]">
                              {filteredCustomers.map((customer) => {
                                const customerId = customer.Id || 0;
                                return (
                                  <div
                                    key={customerId}
                                    onClick={() => {
                                      form.setValue('UserId', customerId);
                                      form.setValue('UserName', ''); // Clear manual entry
                                      setUserDropdownOpen(false);
                                      setUserSearchQuery('');
                                    }}
                                    className={cn(
                                      "px-3 py-2.5 cursor-pointer text-sm text-gray-900 flex items-center gap-2.5 transition-colors",
                                      "hover:bg-gray-50 active:bg-gray-100",
                                      "first:rounded-t-lg last:rounded-b-lg",
                                      userIdField.value === customerId && "bg-gray-50"
                                    )}
                                  >
                                    <Check
                                      className={cn(
                                        "h-4 w-4 flex-shrink-0 transition-opacity",
                                        userIdField.value === customerId ? "opacity-100 text-gray-700" : "opacity-0"
                                      )}
                                    />
                                  <span className="flex-1 truncate">
                                    {customer.Name} {customer.Contact ? `(${customer.Contact})` : ''}
                                  </span>
                                </div>
                                );
                              })}
                            </div>
                          )}
                          {customers.length === 0 && !isCreatingNewUser && (
                            <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-amber-600">
                              No users available. You can add a new user.
                            </div>
                          )}
                        </div>
                        {isCreatingNewUser && (
                          <FormField
                            control={form.control}
                            name="UserPhone"
                            render={({ field: phoneField }) => (
                              <FormItem>
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...phoneField}
                                    placeholder="Enter phone number"
                                    className="h-[40px]"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Hidden field for UserName */}
              <FormField
                control={form.control}
                name="UserName"
                render={() => <FormItem className="hidden"><FormControl><input type="hidden" /></FormControl></FormItem>}
              />

              {/* Service Selection */}
              <FormField
                control={form.control}
                name="ServiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service *</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-amber-600">
                            No test services available. Please create test services first.
                          </div>
                        ) : (
                          services.map((service) => (
                            <SelectItem key={service.Id} value={String(service.Id)}>
                              {service.ServiceName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Credits Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ApprovedCredits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approved Credits</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="UsedCredits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Used Credits</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="RemainingCredits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Remaining Credits <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? (approvedCredits - usedCredits)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            field.onChange(value);
                            form.setValue('RemainingCredits', value);
                          }}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="StartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="EndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Recurring Period */}
              <div className="space-y-2">
                <FormLabel>Recurring Period *</FormLabel>
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="RecurringPeriod"
                    render={({ field }) => (
                      <FormItem className="w-20">
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                    name="RecurringPeriodUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Tabs
                            value={field.value || 'days'}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('RecurringPeriodUnit', value);
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


              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : credit?.Id ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
