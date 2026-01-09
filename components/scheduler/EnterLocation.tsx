import GWCard from "@/components/shared/GWCard";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Separator} from "@/components/ui/separator";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {ArrowLeft} from "lucide-react";
import {json, z} from 'zod';
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import React from "react";
import {useSchedulerStore} from "@/lib/store/schedulerStore";
import { useRouter } from "next/navigation";
import { LocationInfo } from "@/lib/types/scheduler.types";
import { useSessionStorage } from "@/lib/hooks/useSessionStorage";

interface EnterLocationProps {
  setLocationStep: React.Dispatch<React.SetStateAction<number>>;
  locationInfo?: LocationInfo | null;
}

const formSchema = z.object({
  StreetAddress: z.string(),
  City: z.string(),
  State: z.string(),
  Zipcode: z.string(),
})
export default function EnterLocation({locationInfo, setLocationStep} : EnterLocationProps){

  const updateSchedulerData = useSchedulerStore((state) => state.updateSchedulerData);
  const router = useRouter();
  const [location, setLocation] = useSessionStorage('Location', '');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      StreetAddress: locationInfo?.street_address || "",
      City: locationInfo?.city ||"",
      State: locationInfo?.state || "",
      Zipcode: locationInfo?.zipCode || ""
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const address = [
      values.StreetAddress,
      values.City,
      values.State,
      values.Zipcode
    ]
    .filter(Boolean)
    .join(", ");

    // updateSchedulerData({
    //   Address: address,
    //   Lat: locationInfo?.lat || 0,
    //   Lng: locationInfo?.lng || 0,
    //   ...values
    // });

    setLocation(JSON.stringify({
      Address: address,
      Lat: locationInfo?.lat || 0,
      Lng: locationInfo?.lng || 0
    }));
    router.push('/scheduler/assign-provider');
  }

  return (
    <GWCard title="Enter location" className="max-w-3xl mx-auto" >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="StreetAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Street Address</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="City"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">City</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="State"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">State</FormLabel>
                    <FormControl>
                      <Input className="h-11" placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="Zipcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Zipcode</FormLabel>
                    <FormControl>
                      <Input className="h-11" placeholder="Zipcode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </div>
          <Separator className="my-4 bg-gray-200" />
          <div className="flex justify-between">
            <Button variant="outline" className="cursor-pointer" onClick={() => setLocationStep(1)}>
              <ArrowLeft className="h-6 w-6"></ArrowLeft>
              Previous
            </Button>
            <Button className="cursor-pointer" type="submit">
              Continue
            </Button>
          </div>
        </form>
      </Form>
    </GWCard>
  )
}