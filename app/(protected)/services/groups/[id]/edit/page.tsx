'use client';

import React, { useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import {ArrowLeft, ChevronRight} from 'lucide-react';
import { Input } from '@/components/ui/input';
import "react-phone-number-input/style.css";
import {Separator } from '@radix-ui/react-select';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/lib/store/authStore';
import { addServices } from '@/lib/actions/scheduler.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CurrencyItem, getAllCurrencyCodes, getCurrencies } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import SelectServicesField from '@/components/shared/SelectServicesField';

const formSchema = z.object({
  ServiceGroupName: z.string().min(1, 'Service name is required'),
  ServiceIds: z.number().array().min(1, 'At least one service is required'),
})

export default function EditServiceGroup() {

  const {user} = useAuthStore();
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ServiceGroupName: "",
      ServiceIds: []
    },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    console.log(values);
    toast.success('Service group updated successfully');

    setLoading(false);
    // router.push('/services/groups');
  }
  
  return (
    <div className='max-w-5xl mx-auto py-8 px-6'>
      {/* Header */}
      <div className="flex items-start">
        <DashboardHeader
          title="Service Groups"
          description="You will be able to assign service zones to each user on the next step."
          className="flex-1"
        />
      </div>

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
        <CardContent className="px-0">
          <div className="flex items-center gap-x-3 mb-4">
            <Link href="/services/groups" className="font-medium text-sm text-gray-500">Service Groups</Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-sm text-gray-700">Edit Service Group</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-sm text-gray-700">Service Group Name</span>
          </div>
          <h3 className="text-base font-medium sm:text-lg mb-4">Edit Service Group</h3>
          
          <div className="relative">
            {loading && (
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/50 z-50">
                <div className="flex items-center gap-2">
                  <Spinner className="size-8 text-gray-500" />
                </div>
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => handleSubmit(data))}>
                {/* Service Name */}
                <FormField
                  control={form.control}
                  name="ServiceGroupName"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b-1 border-gray-200">
                      <div className="flex flex-col gap-2">
                        <label className="font-medium">Service Group Name</label>
                      </div>
                      <div className="flex flex-col gap-2">
                        <FormControl>
                          <Input className="h-11" placeholder="Service Group Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ServiceIds"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4">
                      <div className="flex flex-col gap-2">
                        <label className="font-medium">Services included</label>
                      </div>
                      <div className="flex flex-col gap-2">
                        <SelectServicesField field={field} />
                      </div>
                    </FormItem>
                  )}
                />

                <Separator className="my-4 h-px bg-gray-200" />
                
                {/* Buttons */}
                <div className="flex justify-end gap-x-3">
                  <Link href="/services">
                    <Button type='button' variant="outline" className="cursor-pointer">
                      <ArrowLeft className="h-6 w-6"></ArrowLeft>
                      Back
                    </Button>
                  </Link>
                  <Button type="submit" className="cursor-pointer" >Save</Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}