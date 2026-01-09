"use client";

import { useState } from "react";
import Image from "next/image";
import ProfilePageWrapper from "@/components/layout/ProfilePageWrapper";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import z from "zod";
import { useAuthStore } from "@/lib/store/authStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addServiceZoneAssociatBarber } from "@/lib/actions/zone.actions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import MapZoneDrawer from "@/components/shared/MapZoneDrawer";
import SelectProviderField from "@/components/shared/SelectProviderField";
import AvailabilitySelector from "@/components/shared/AvailabilityDaySelector";
import { Button } from "@/components/ui/button";
import { Point } from "@/lib/types/zone.types";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  ZoneName: z.string().min(1, 'Zone name is required'),
  ProviderIds: z.array(z.number()).min(1, 'At least one provider is required'),
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

export default function ProfileAssignedPage() {
  
  const {user} = useAuthStore();
  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ZoneName: "",
      Days: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
      ProviderIds: [],
      Coords: ""
    },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const response = await addServiceZoneAssociatBarber({...values, CompanyAdminId: user?.UserID || 0, ZoneId: 0});

    if(response.Status !== 201){
      toast.error(response.Message);
      setLoading(false);
      return;
    }

    toast.success('Service zone added successfully');

    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <ProfilePageWrapper
        panelName="assigned"
      >
        {/* Content */}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleSubmit(data))}>
            <div className="space-y-4 mt-4">

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
                            <MapZoneDrawer value = {field.value ? JSON.parse(field.value) : []} onChange={(points : Point[]) => field.onChange(JSON.stringify(points))} />
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
                            <AvailabilitySelector value={field.value} onChange={(value) => field.onChange(value)} />
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
                <Button type="submit" className="cursor-pointer" >Save</Button>
              </div>

            </div>
          </form>
        </Form>

      </ProfilePageWrapper>
    </div>
  );
}