'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listApprovedUserCredits } from '@/lib/actions/approvedUserCredits.actions';
import type { ServiceRequestFormData } from '@/app/(protected)/scheduler/service-requests/new/page';

const step2Schema = z.object({
  approvedCredits: z.number().min(0, 'Approved credits must be 0 or greater').optional(),
  usedCredits: z.number().min(0, 'Used credits must be 0 or greater').optional(),
  remainingCredits: z.number().min(0, 'Remaining credits is required'),
  notes: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

interface Step2FormProps {
  initialData?: Partial<ServiceRequestFormData>;
  onNext: (data: Partial<ServiceRequestFormData>) => void;
  onBack: () => void;
}

export default function Step2Form({ initialData, onNext, onBack }: Step2FormProps) {
  const form = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      approvedCredits: initialData?.approvedCredits ?? undefined,
      usedCredits: initialData?.usedCredits ?? undefined,
      remainingCredits: initialData?.remainingCredits ?? undefined,
      notes: initialData?.notes || '',
      startTime: initialData?.startTime || '09:00',
      endTime: initialData?.endTime || '17:00',
    },
  });

  // Auto-populate credits from backend API when customer and service are available
  useEffect(() => {
    const loadCredits = async () => {
      const customerId = initialData?.customerId;
      const service = initialData?.service;
      
      if (!customerId || !service) return;
      
      // Parse service to get ServiceId
      let serviceId: number | undefined = undefined;
      try {
        const serviceData = JSON.parse(service || '{}');
        if (serviceData.Id) {
          serviceId = parseInt(serviceData.Id);
        }
      } catch {
        // If not JSON, check if it's a numeric ID
        if (typeof service === 'string' && service.match(/^\d+$/)) {
          serviceId = parseInt(service);
        }
      }
      
      if (!serviceId || serviceId === 0) return;
      
      // Only fetch if credits aren't already set
      if (initialData?.approvedCredits !== undefined || initialData?.remainingCredits !== undefined) {
        return; // Credits already set, don't overwrite
      }
      
      try {
        const creditsResponse = await listApprovedUserCredits({ 
          UserId: customerId, 
          ServiceId: serviceId,
          IsActive: true 
        });
        
        if (creditsResponse.Status === 201 && creditsResponse.data && Array.isArray(creditsResponse.data)) {
          const matchingCredit = creditsResponse.data.find(
            (c: any) => c.UserId === customerId && c.ServiceId === serviceId
          );
          
          if (matchingCredit) {
            // Auto-populate credits from backend
            form.setValue('approvedCredits', matchingCredit.ApprovedCredits || 0);
            form.setValue('usedCredits', matchingCredit.UsedCredits || 0);
            form.setValue('remainingCredits', matchingCredit.RemainingCredits || 0);
            console.log('✅ Auto-populated credits from backend:', {
              approved: matchingCredit.ApprovedCredits,
              used: matchingCredit.UsedCredits,
              remaining: matchingCredit.RemainingCredits
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch credits for auto-population:', error);
        // Silently fail - user can still enter credits manually
      }
    };
    
    loadCredits();
  }, [initialData?.customerId, initialData?.service, initialData?.approvedCredits, initialData?.remainingCredits, form]);

  const onSubmit = (data: z.infer<typeof step2Schema>) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
        {/* Approved Credits */}
        <FormField
          control={form.control}
          name="approvedCredits"
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Approved Credits
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    value={field.value !== undefined && field.value !== null ? field.value : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
                    placeholder=""
                    className="h-[40px]"
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Used Credits */}
        <FormField
          control={form.control}
          name="usedCredits"
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Used Credits
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    value={field.value !== undefined && field.value !== null ? field.value : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
                    placeholder=""
                    className="h-[40px]"
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Remaining Credits */}
        <FormField
          control={form.control}
          name="remainingCredits"
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Remaining Credits <span className="text-red-500">*</span>
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    value={field.value !== undefined && field.value !== null ? field.value : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // For remaining credits (required), allow empty but validate on submit
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
                    placeholder=""
                    className="h-[40px]"
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Notes
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Add any additional notes or comments..."
                    className="min-h-[100px] resize-none"
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Preferred Time Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-200">
          <div className="flex items-start">
            <FormLabel className="font-medium !text-gray-900">
              Preferred Time Range <span className="text-red-500">*</span>
            </FormLabel>
          </div>
          <div className="flex gap-4">
            {/* Start Time */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field, fieldState }) => (
                <FormItem className="flex-1">
                  <div className="flex flex-col gap-2">
                    <FormLabel className="font-medium !text-gray-900 text-sm">
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        className={cn("h-[40px]", fieldState.error && "border-destructive")}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* End Time */}
            <FormField
              control={form.control}
              name="endTime"
              render={({ field, fieldState }) => (
                <FormItem className="flex-1">
                  <div className="flex flex-col gap-2">
                    <FormLabel className="font-medium !text-gray-900 text-sm">
                      End Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        className={cn("h-[40px]", fieldState.error && "border-destructive")}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
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
            className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Next
          </Button>
        </div>
      </form>
    </Form>
  );
}
