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

const formSchema = z.object({
  ServiceName: z.string().min(1, 'Service name is required'),
  Price: z.number().positive(),
  Duration: z.number().positive(),
  Type: z.number(),
  PriceType: z.string().min(1, 'Price type is required'),
  CurrencyId: z.number()
})

export default function AddNewService() {

  const {user} = useAuthStore();
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ServiceName: "",
      Price: 0,
      Duration: 0,
      Type: 2,
      PriceType: "USD",
      CurrencyId: 1,
    },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const response = await addServices({...values, CompanyAdminId: user?.UserID || 0});

    if(response.Status !== 201){
      toast.error(response.Message);
      setLoading(false);
      return;
    }

    toast.success('Service added successfully');

    setLoading(false);
    router.push('/services');
  }

  const currencies = useMemo(() => getCurrencies(), []);
  
  const currencyById = useMemo(() => {
    return new Map<number, CurrencyItem>(
      currencies.map(c => [c.id, c])
    );
  }, [currencies]);

  return (
    <div className='max-w-5xl mx-auto py-8 px-4'>
      {/* Header */}
      <div className="flex items-start">
        <DashboardHeader
          title="Services"
          description="You will be able to assign service zones to each user on the next step."
          className="flex-1"
        />
      </div>

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
        <CardContent className="px-0">
          <div className="flex items-center gap-x-3 mb-4">
            <Link href="/services" className="font-medium text-sm text-gray-500">Services</Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-sm text-gray-700">Add New Service</span>
          </div>
          <h3 className="text-base font-medium sm:text-lg mb-4">New Service</h3>
          
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
                  name="ServiceName"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b-1 border-gray-200">
                      <div className="flex flex-col gap-2">
                        <label className="font-medium">Service Name</label>
                      </div>
                      <div className="flex flex-col gap-2">
                        <FormControl>
                          <Input className="h-11" placeholder="Service name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="Duration"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b-1 border-gray-200">
                      <div className="flex flex-col gap-2">
                        <label className="font-medium">Service Duration</label>
                      </div>
                      <div className="flex flex-col gap-2">
                        <FormLabel className="text-sm font-medium text-gray-700">Service Duration</FormLabel>
                        <FormControl>
                          <Input type="number" 
                            className="w-full h-11 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                          />
                          {/* <Select defaultValue="min">
                          <SelectTrigger className="w-18 absolute right-0 top-0.5 border-0 shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="min">min</SelectItem>
                            <SelectItem value="hr">hr</SelectItem>
                          </SelectContent>
                        </Select> */}
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Cost */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Cost</label>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                  <FormField
                    control={form.control}
                    name="CurrencyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Currency</FormLabel>
                        <FormControl>
                          <Select 
                            {...field}
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(val) => {
                                field.onChange(Number(val));
                                const currency = currencyById.get(Number(val));
                                if (currency) {
                                  form.setValue("PriceType", currency.symbol);
                                }
                            }}
                          >
                            <SelectTrigger className="w-full data-[size=default]:h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getCurrencies().map((item) => (
                                <SelectItem key={item.id} value={String(item.id)}>
                                  {item.name} ({item.symbol})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="Price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Price</FormLabel>
                          <FormControl>
                            <Input 
                              type='number' 
                              className="h-11" 
                              placeholder="90" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-x-3 pt-8">
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