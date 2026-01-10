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
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/authStore';
import {
  createApprovedUserCredit,
  updateApprovedUserCredit,
  type ApprovedUserCredit,
} from '@/lib/actions/approvedUserCredits.actions';
import { fetchProviderByCompanyId } from '@/lib/actions/provider.actions';
import { getServicesForCompany } from '@/lib/actions/service.actions';
import type { Provider } from '@/lib/types/provider.types';
import type { CompanyService } from '@/lib/types/service.types';
import { Spinner } from '@/components/ui/spinner';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn, parseDotNetDate } from '@/lib/utils';

const formSchema = z.object({
  UserId: z.number().min(0, 'User ID must be valid'),
  UserName: z.string().optional(), // For manual entry
  ServiceId: z.number().min(1, 'Service is required'),
  ApprovedCredits: z.number().min(0, 'Approved credits cannot be negative').optional(),
  UsedCredits: z.number().min(0, 'Used credits cannot be negative').optional(),
  RemainingCredits: z.number().min(0, 'Remaining credits is required'),
  StartDate: z.string().min(1, 'Start date is required'),
  EndDate: z.string().min(1, 'End date is required'),
  RecurringPeriod: z.number().min(1, 'Recurring period must be at least 1'),
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
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<CompanyService[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const form = useForm<CreditFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      UserId: 0,
      UserName: '',
      ServiceId: 0,
      ApprovedCredits: 0,
      UsedCredits: 0,
      RemainingCredits: 0,
      StartDate: new Date().toISOString().split('T')[0],
      EndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      RecurringPeriod: 1,
      IsActive: true,
    },
  });

  // Load providers and services
  useEffect(() => {
    const loadData = async () => {
      if (!user?.UserID || !open) return;

      setLoadingData(true);
      try {
        // Load providers
        const providersResponse = await fetchProviderByCompanyId(user.UserID);
        if (providersResponse.Status === 201 && providersResponse.Object) {
          setProviders(providersResponse.Object);
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
        toast.error('Failed to load providers and services');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user, open]);

  // Filter providers based on search query
  const filteredProviders = useMemo(() => {
    const query = userSearchQuery.toLowerCase().trim();
    if (!query) {
      return providers.slice(0, 20); // Show first 20 when no search
    }
    return providers.filter((provider) =>
      provider.ProviderName?.toLowerCase().includes(query) ||
      (provider as any).ProviderEmail?.toLowerCase().includes(query) ||
      (provider as any).Email?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [providers, userSearchQuery]);

  // Get current user value (either selected provider name or manual entry)
  const userId = form.watch('UserId');
  const userName = form.watch('UserName');
  
  const currentUserValue = useMemo(() => {
    if (userName && userName.trim().length > 0) return userName;
    
    if (userId > 0) {
      const provider = providers.find(p => p.ProviderId === userId);
      return provider?.ProviderName || '';
    }
    return '';
  }, [userId, userName, providers]);

  // Populate form when editing
  useEffect(() => {
    if (credit && open) {
      form.reset({
        UserId: credit.UserId,
        UserName: '',
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
        RecurringPeriod: credit.RecurringPeriod || 1,
        IsActive: credit.IsActive ?? true,
      });
    } else if (!credit && open) {
      form.reset({
        UserId: 0,
        UserName: '',
        ServiceId: 0,
        ApprovedCredits: 0,
        UsedCredits: 0,
        RemainingCredits: 0,
        StartDate: new Date().toISOString().split('T')[0],
        EndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        RecurringPeriod: 1,
        IsActive: true,
      });
    }
  }, [credit, open, form]);

  const onSubmit = async (data: CreditFormData) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    // VALIDATION: Ensure only test data is being used
    const selectedProvider = data.UserId > 0 ? providers.find(p => p.ProviderId === data.UserId) : null;
    const selectedService = services.find(s => s.Id === data.ServiceId);
    
    // Handle manually entered username - try to find provider by name
    let finalUserId = data.UserId;
    if (data.UserName && data.UserName.trim().length > 0 && data.UserId === 0) {
      // Try to find provider by name (case-insensitive)
      const foundProvider = providers.find(p => 
        p.ProviderName?.toLowerCase().trim() === data.UserName?.toLowerCase().trim()
      );
      if (foundProvider) {
        finalUserId = foundProvider.ProviderId;
        toast.info(`Found provider: ${foundProvider.ProviderName}`);
      } else {
        toast.error('User not found. Please select from the dropdown or ensure the user exists in the system.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Convert dates to ISO format
      const startDate = new Date(data.StartDate);
      const endDate = new Date(data.EndDate);
      
      const creditData: ApprovedUserCredit = {
        ...(credit?.Id && { Id: credit.Id }),
        UserId: finalUserId,
        ServiceId: data.ServiceId,
        ApprovedCredits: data.ApprovedCredits || 0,
        UsedCredits: data.UsedCredits || 0,
        RemainingCredits: data.RemainingCredits,
        StartDate: startDate.toISOString(),
        EndDate: endDate.toISOString(),
        RecurringPeriod: data.RecurringPeriod,
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
                    <FormLabel>User (Provider) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Select a user or enter manually"
                          value={currentUserValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            form.setValue('UserName', value);
                            form.setValue('UserId', 0); // Clear UserId when typing manually
                            setUserSearchQuery(value);
                            if (value && filteredProviders.length > 0) {
                              setUserDropdownOpen(true);
                            } else {
                              setUserDropdownOpen(false);
                            }
                          }}
                          onFocus={() => {
                            if (filteredProviders.length > 0) {
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
                            setUserDropdownOpen(!userDropdownOpen);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          <ChevronsUpDown className="w-4 h-4" />
                        </button>
                        {userDropdownOpen && filteredProviders.length > 0 && (
                          <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] max-h-[240px] overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 [scrollbar-width:thin] [scrollbar-color:rgb(209,213,219)_transparent]">
                            {filteredProviders.map((provider) => (
                              <div
                                key={provider.ProviderId}
                                onClick={() => {
                                  form.setValue('UserId', provider.ProviderId);
                                  form.setValue('UserName', ''); // Clear manual entry
                                  setUserDropdownOpen(false);
                                  setUserSearchQuery('');
                                }}
                                className={cn(
                                  "px-3 py-2.5 cursor-pointer text-sm text-gray-900 flex items-center gap-2.5 transition-colors",
                                  "hover:bg-gray-50 active:bg-gray-100",
                                  "first:rounded-t-lg last:rounded-b-lg",
                                  userIdField.value === provider.ProviderId && "bg-gray-50"
                                )}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 flex-shrink-0 transition-opacity",
                                    userIdField.value === provider.ProviderId ? "opacity-100 text-gray-700" : "opacity-0"
                                  )}
                                />
                                <span className="flex-1 truncate">
                                  {provider.ProviderName} {(provider as any).ProviderEmail ? `(${(provider as any).ProviderEmail})` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {providers.length === 0 && (
                          <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-amber-600">
                            No test providers available. You can enter a username manually.
                          </div>
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
              <FormField
                control={form.control}
                name="RecurringPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurring Period (days) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


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
