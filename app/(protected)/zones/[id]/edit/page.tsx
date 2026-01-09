'use client';

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import {ArrowLeft, ArrowRight, ChevronRight, MoveRight, PlusIcon, Search} from 'lucide-react';
import { Input } from '@/components/ui/input';
import "react-phone-number-input/style.css";
import { Arrow, Separator } from '@radix-ui/react-select';
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { Point, ServiceZone } from '@/lib/types/zone.types';
import z from 'zod';
import { useAuthStore } from '@/lib/store/authStore';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '@/components/ui/spinner';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import MapZoneDrawer from '@/components/shared/MapZoneDrawer';
import SelectProviderField from '@/components/shared/SelectProviderField';
import AvailabilitySelector from '@/components/shared/AvailabilityDaySelector';
import { addServiceZoneAssociatBarber, getServiceZoneByZoneId } from '@/lib/actions/zone.actions';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  ZoneName: z.string().min(1, 'Zone name is required'),
  ProviderIds: z.array(z.number()),
  Days: z.string(),
  Coords: z.string().min(1, 'Coordinates are required').refine((value) => {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) && parsed.length > 0
    } catch {
      return false
    }
  }, {
    message: 'Coordinates are required',
  })
})

export default function EditZone() {
  const params = useParams();
  const [serviceZone, setServiceZone] = useState<ServiceZone>();
  const {user} = useAuthStore();
  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ZoneName: "",
      Days: "",
      ProviderIds: [],
      Coords: ""
    },
  })

  async function load() {
    if(!user) return;
    setLoading(true);
    const response = await getServiceZoneByZoneId({
      zoneId: Number(params.id)
    });

    if(response.Status !== 201){
      toast.error(response.Message);
      return;
    }

    const data = response.Response;

    setServiceZone(response.Response);
    form.reset({
      ZoneName: data.Name ?? "",
      Days: data.AssignedDays ? data.AssignedDays.join(',') : "",
      ProviderIds: data.Providers ? data.Providers.map(provider => provider.ProviderId) : [],
      Coords: data.Coordinates
    });
    setLoading(false);
  }
  
  useEffect(() => {
    if(params.id){
      load();
    }
  }, [params.id, user]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const response = await addServiceZoneAssociatBarber({...values, CompanyAdminId: user?.UserID || 0, ZoneId: Number(params.id)});

    if(response.Status !== 201){
      toast.error(response.Message);
      setLoading(false);
      return;
    }

    toast.success('Service zone updated successfully');

    setLoading(false);
  }

  return (
    <div className='max-w-5xl mx-auto py-8 px-6'>
      {/* Header */}
      <div className="flex items-start">
        <DashboardHeader
          title="Service Zones"
          description="You will be able to assign service zones to each user on the next step."
          className="flex-1"
        />
      </div>

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
        <CardContent className="px-0">
          <div className="flex items-center gap-x-3 mb-4">
            <Link href="/zones" className="font-medium text-sm text-gray-500">Service Zones</Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-sm text-gray-500">{serviceZone?.Name || "Zone name"}</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-sm text-gray-700">Edit</span>
          </div>
          <h3 className="text-base font-medium sm:text-lg mb-4">{serviceZone?.Name || "Zone name"}</h3>
          
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
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ZoneName"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4">
                        <div className="flex flex-col gap-2">
                          <label className="font-medium">Service Zone Name</label>
                        </div>
                        <div className="flex flex-col gap-2">
                          <FormControl>
                            <Input className="h-11" placeholder="Service Zone Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <Separator className="bg-gray-200 h-0.25" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex">
                      <label className="font-medium">Zone area</label>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="text-gray-500 font-medium">
                        Draw your service zone area
                      </div>
                        <FormField
                          control={form.control}
                          name="Coords"
                          render={({ field }) => (
                            <FormItem className="rounded-xl space-y-4">
                              <FormControl>
                                <MapZoneDrawer 
                                  value = {field.value ? JSON.parse(field.value) : []} 
                                  onChange={(points : Point[]) => field.onChange(JSON.stringify(points))} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                  </div>
                  <Separator className="bg-gray-200 h-0.25" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-7">
                    <div className="flex">
                      <label className="font-medium">Assign to</label>
                    </div>
                    <SelectProviderField control={form.control} name="ProviderIds" />
                  </div>
                  <Separator className="bg-gray-200 h-0.25" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex">
                      <label className="font-medium">Availability</label>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                        <FormField
                          control={form.control}
                          name="Days"
                          render={({ field }) => (
                            <FormItem className="p-4 bg-gray-50 rounded-xl space-y-4">
                              <FormControl>
                                {(loading && !serviceZone) ? (<Skeleton className='h-10 w-full' />) : <AvailabilitySelector value={field.value} onChange={(value) => field.onChange(value)} />}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-x-3 pt-8">
                    <Link href="/zones">
                      <Button type='button' variant="outline" className="cursor-pointer">
                        <ArrowLeft className="h-6 w-6"></ArrowLeft>
                        Back
                      </Button>
                    </Link>
                    <Button type="submit" className="cursor-pointer" >Save</Button>
                  </div>

                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}