'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ServiceRequestFormData } from '@/app/(protected)/scheduler/service-requests/new/page';

const step2Schema = z.object({
  credits: z.number().min(0, 'Credits must be 0 or greater').optional(),
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
      credits: initialData?.credits ?? 0,
      approvedCredits: initialData?.approvedCredits ?? 0,
      usedCredits: initialData?.usedCredits ?? 0,
      remainingCredits: initialData?.remainingCredits ?? 0,
      notes: initialData?.notes || '',
      startTime: initialData?.startTime || '09:00',
      endTime: initialData?.endTime || '17:00',
    },
  });

  const onSubmit = (data: z.infer<typeof step2Schema>) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
        {/* Credits */}
        <FormField
          control={form.control}
          name="credits"
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4">
              <div className="flex items-start">
                <FormLabel className="font-medium !text-gray-900">
                  Credits
                </FormLabel>
              </div>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
                    className="h-[40px]"
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

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
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
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
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
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
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? 0 : Number(value));
                    }}
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
