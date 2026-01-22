'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, ChevronsUpDown, Check, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/authStore';
import { getAllProvidersForCompany } from '@/lib/actions/provider.actions';
import { Provider } from '@/lib/types/provider.types';
import CustomPagination from '@/components/shared/CustomPagination';
import type { ServiceRequestFormData } from '@/app/(protected)/scheduler/service-requests/new/page';
import { toast } from 'sonner';

const step3Schema = z.object({
  preferredStaff: z.array(z.string()).optional(),
  preferredDays: z.array(z.string()).optional(),
});

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

interface Step3FormProps {
  initialData?: Partial<ServiceRequestFormData>;
  onSubmit: (data: Partial<ServiceRequestFormData>) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export default function Step3Form({ initialData, onSubmit, onBack, isSubmitting = false }: Step3FormProps) {
  const { user } = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const form = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      preferredStaff: initialData?.preferredStaff || [],
      preferredDays: initialData?.preferredDays || [],
    },
  });

  useEffect(() => {
    const loadProviders = async () => {
      if (!user?.UserID) {
        console.warn('[Step3Form] No user ID, skipping provider load');
        setLoading(false);
        setProviders([]);
        return;
      }
      try {
        setLoading(true);
        console.log('[Step3Form] 🔄 Starting to load providers for CompanyAdminId:', user.UserID);
        
        // Use getAllProvidersForCompany (same API used successfully in dashboard and availability pages)
        // Start with smaller page size to avoid timeout, then load more if needed
        const response = await getAllProvidersForCompany({
          CompanyAdminId: user.UserID,
          PageNo: 1,
          RecordsPerPage: 100, // Reduced from 1000 to avoid timeout - can paginate if needed
        });
        
        console.log('[Step3Form] 📥 Provider response received:', {
          Status: response.Status,
          Message: response.Message,
          ListLength: response.List?.length || 0,
          TotalCount: response.TotalCount,
          HasList: !!response.List,
          ListType: Array.isArray(response.List) ? 'array' : typeof response.List
        });
        
        if (response.Status === 201 && response.List && Array.isArray(response.List)) {
          setProviders(response.List);
          console.log(`[Step3Form] ✅ Successfully loaded ${response.List.length} providers`);
          if (response.List.length === 0) {
            console.warn('[Step3Form] ⚠️ No providers found. User may need to add providers in Linked Users.');
          }
        } else {
          console.warn('[Step3Form] ⚠️ Provider response not successful:', {
            Status: response.Status,
            Message: response.Message,
            HasList: !!response.List,
            ListType: typeof response.List
          });
          setProviders([]);
          
          // Show user-friendly error message
          if (response.Message && response.Status !== 201) {
            console.warn('[Step3Form] Error message from backend:', response.Message);
            // Only show toast for actual errors, not for empty results
            if (response.Status >= 400) {
              toast.error(`Failed to load providers: ${response.Message}`);
            }
          } else if (response.Status === 500) {
            toast.error('Failed to load providers. Please check your connection and try again.');
          }
        }
      } catch (error: any) {
        // This catch should rarely trigger since server action handles errors internally
        console.error('[Step3Form] ❌ Unexpected error loading providers:', {
          error: error.message,
          stack: error.stack,
          response: error.response,
          name: error.name
        });
        setProviders([]);
      } finally {
        setLoading(false);
        console.log('[Step3Form] 🏁 Provider loading finished, loading set to false');
      }
    };

    loadProviders();
  }, [user]);

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const query = searchQuery.toLowerCase().trim();
    return providers.filter((provider) =>
      provider.ProviderName.toLowerCase().includes(query)
    );
  }, [providers, searchQuery]);

  const paginatedProviders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredProviders.slice(start, end);
  }, [filteredProviders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSubmit = (data: z.infer<typeof step3Schema>) => {
    onSubmit(data);
  };

  const preferredStaff = form.watch('preferredStaff') || [];
  const preferredDays = form.watch('preferredDays') || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0">
        {/* Preferred Staff */}
        <FormField
          control={form.control}
          name="preferredStaff"
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Preferred staff
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Search by provider's name"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        const value = e.target.value.trim();
                        if (value) {
                          setOpen(true);
                        } else {
                          setOpen(false);
                        }
                      }}
                      onFocus={() => {
                        // Always open dropdown on focus to show loading/empty state
                        setOpen(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setOpen(false), 200);
                      }}
                      className="pl-10 pr-10 h-[40px]"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(!open);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      <ChevronsUpDown className="w-4 h-4" />
                    </button>
                    {open && (loading ? (
                      <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] p-4">
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading providers...
                        </div>
                      </div>
                    ) : providers.length === 0 ? (
                      <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] p-4">
                        <div className="text-sm text-gray-500">No providers available. Please add providers in Linked Users.</div>
                      </div>
                    ) : filteredProviders.length === 0 ? (
                      <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] p-4">
                        <div className="text-sm text-gray-500">No providers found matching "{searchQuery}"</div>
                      </div>
                    ) : (
                      <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                        <div>
                          {paginatedProviders.map((provider) => {
                            const isChecked = preferredStaff.includes(String(provider.ProviderId));
                            return (
                              <div
                                key={provider.ProviderId}
                                onClick={() => {
                                  const current = preferredStaff;
                                  if (isChecked) {
                                    form.setValue(
                                      'preferredStaff',
                                      current.filter((id) => id !== String(provider.ProviderId))
                                    );
                                  } else {
                                    form.setValue('preferredStaff', [...current, String(provider.ProviderId)]);
                                  }
                                }}
                                className={cn(
                                  "px-3 py-2.5 cursor-pointer text-sm text-gray-900 flex items-center gap-2.5 transition-colors",
                                  "hover:bg-gray-50 active:bg-gray-100",
                                  "first:rounded-t-lg",
                                  isChecked && "bg-gray-50"
                                )}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 flex-shrink-0 transition-opacity",
                                    isChecked ? "opacity-100 text-gray-700" : "opacity-0"
                                  )}
                                />
                                <Image
                                  src={provider.ProfileImage || '/images/avatar.png'}
                                  alt={provider.ProviderName}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                  unoptimized
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/images/avatar.png';
                                  }}
                                />
                                <span className="flex-1 truncate">{provider.ProviderName}</span>
                              </div>
                            );
                          })}
                        </div>
                        {totalPages > 0 && (
                          <div className="border-t border-gray-200 p-2">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={cn(
                                  "px-2 py-1 rounded-md text-sm font-medium transition-colors",
                                  currentPage === 1
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-gray-700 hover:bg-gray-100"
                                )}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                  let pageNum;
                                  if (totalPages <= 5) {
                                    pageNum = i + 1;
                                  } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                  } else {
                                    pageNum = currentPage - 2 + i;
                                  }
                                  return (
                                    <button
                                      key={pageNum}
                                      type="button"
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={cn(
                                        "px-2 py-1 rounded-md text-sm font-medium transition-colors min-w-[28px]",
                                        currentPage === pageNum
                                          ? "bg-gray-900 text-white"
                                          : "text-gray-700 hover:bg-gray-100"
                                      )}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className={cn(
                                  "px-2 py-1 rounded-md text-sm font-medium transition-colors",
                                  currentPage === totalPages
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-gray-700 hover:bg-gray-100"
                                )}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </FormControl>
                {/* Selected staff chips */}
                {preferredStaff.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {preferredStaff.map((staffId) => {
                      const provider = providers.find((p) => String(p.ProviderId) === staffId);
                      if (!provider) return null;
                      return (
                        <div
                          key={staffId}
                          className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md text-sm"
                        >
                          <Image
                            src={provider.ProfileImage || '/images/avatar.png'}
                            alt={provider.ProviderName}
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-full object-cover"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/avatar.png';
                            }}
                          />
                          <span className="text-gray-700">{provider.ProviderName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              form.setValue(
                                'preferredStaff',
                                preferredStaff.filter((id) => id !== staffId)
                              );
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {form.formState.errors.preferredStaff ? <FormMessage /> : null}
              </div>
            </FormItem>
          )}
        />

        {/* Preferred Days */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
          <div className="flex items-start">
            <FormLabel className="font-medium !text-gray-900">
              Preferred days
            </FormLabel>
          </div>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DAYS_OF_WEEK.map((day) => {
                const isChecked = preferredDays.includes(day);
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex items-center gap-2 p-3 border rounded-lg transition-colors",
                      isChecked 
                        ? "border-gray-900 bg-gray-50" 
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const current = form.getValues('preferredDays') || [];
                        if (checked) {
                          const newValue = [...current, day];
                          form.setValue('preferredDays', newValue, { shouldValidate: true, shouldDirty: true });
                        } else {
                          const newValue = current.filter((d) => d !== day);
                          form.setValue('preferredDays', newValue, { shouldValidate: true, shouldDirty: true });
                        }
                      }}
                      id={`day-${day}`}
                      className="size-5"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                    <Label 
                      htmlFor={`day-${day}`} 
                      className="cursor-pointer text-sm font-medium !text-gray-900 flex-1"
                    >
                      {day}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end gap-2 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="px-6 py-2"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Submit'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
