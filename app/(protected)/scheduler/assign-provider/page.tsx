'use client';

import {useEffect, useState} from 'react';
import {Search, ChevronRight, ChevronLeft, ChevronDown} from 'lucide-react';
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Slider} from "@/components/ui/slider";
import GWCard from "@/components/shared/GWCard";
import ProviderCard from "@/components/shared/ProviderCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {Separator} from "@/components/ui/separator";
import Link from "next/link";
import {DashboardHeader} from "@/components/layout/DashboardHeader";
import {SchedulerSteps} from "@/components/layout/SchedulerSteps";
import {useSchedulerStore} from "@/lib/store/schedulerStore";
import {useAuthStore} from "@/lib/store/authStore";
import { useRouter } from 'next/navigation';
import { SchedulerData} from "@/lib/types/scheduler.types";
import {User} from "@/lib/types/auth.types";
import {searchCompanyProvider} from "@/lib/actions/scheduler.actions";
import ProviderSkeleton from "@/components/skeleton/ProviderSkeleton";
import { toast } from 'sonner';
import { useSessionStorage } from '@/lib/hooks/useSessionStorage';
import { Provider } from '@/lib/types/provider.types';
import { checkInsideZone, normalizeDistance } from '@/lib/utils';

export default function ProviderSelect() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const {user} = useAuthStore();
  const [data, setData] = useState<Provider[]>([]);
  const [filteredData, setFilteredData] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const {schedulerData, _hasHydrated } = useSchedulerStore();
  const updateSchedulerData = useSchedulerStore((state) => state.updateSchedulerData);
  const [selectProvider, setSelectProvider] = useState<string>(schedulerData?.ProviderId || '');
  const [location] = useSessionStorage('Location', '');
  const [service] = useSessionStorage('Service', '');
  const [provider, setProvider] = useSessionStorage('Provider', '');

  // useEffect(() => {
  //   if(_hasHydrated  && !schedulerData?.Address && !schedulerData?.Lat && !schedulerData?.Lng){
  //     router.push('/scheduler/select-service');
  //   }
  // }, [_hasHydrated, schedulerData])

  useEffect(() => {
    if (!service || !location) {
      router.replace('/scheduler/select-service');
    }
  }, [router]);

  useEffect(() => {
    async function load(user: User) {
      let serviceId = 0;
      const parsed = JSON.parse(service);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.Id) {
        serviceId = parsed[0].Id;
      }
      if(!serviceId){
        router.replace('/scheduler/select-service');
      }

      const response = await searchCompanyProvider(
        {
          ServiceId: String(serviceId),
          CompanyId: user.UserID,
          CustomerLat: location ? JSON.parse(location).Lat : '',
          CustomerLng: location ? JSON.parse(location).Lng : ''
        }
      );
      setData(response.Object);
      const dataSort = await sortProvidersDistance(response.Object);
      const dataSortZone = await sortProvidersZone(dataSort);
      setFilteredData(dataSortZone);
      if(provider){
        setSelectProvider(provider ? JSON.parse(provider).ProviderId.toString() : '');
      }
      setLoading(false);
    }
    if(user && service && location) {
      load(user);
    }
  }, [user, service, location]);

  const sortProvidersDistance = async (providers: Provider[]) => {
    return providers.sort((a, b) => normalizeDistance(b.Distance) - normalizeDistance(a.Distance));
  }

  const sortProvidersZone = async (providers: Provider[]) => {
    const newProviders = providers.map(provider => {
      const isInsideZone = checkInsideZone(provider.ZoneCoords, {lng: location ? JSON.parse(location).Lng : 0, lat: location ? JSON.parse(location).Lat : 0});
      return {...provider, isInsideZone};
    });

    return newProviders.sort((a, b) => Number(b.isInsideZone) - Number(a.isInsideZone));
  }

  useEffect(() => {
    let result = [...data];

    if (searchQuery) {
      result = result.filter(provider =>
        provider.ProviderName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSelectProvider('');
    }
    setFilteredData(result);
  }, [searchQuery]);

  const handleNext = () => {
    if (selectProvider) {
      const provider = data.find(provider => provider.ProviderId.toString() === selectProvider);
      // updateSchedulerData({ProviderId: selectProvider.toString(), ServiceZoneId: provider?.ServiceZoneId[0] || 0});
      setProvider(JSON.stringify({
        ProviderId: selectProvider.toString(),
        ServiceZoneId: provider?.ServiceZoneId[0] || 0,
        ProviderName: provider?.ProviderName,
        ProfileImage: provider?.ProfileImage
      }));
      router.push('/scheduler/datetime-selection');
    }else{
      toast.error('Please select a provider');
    }
  }

  return (
    <div className='max-w-5xl mx-auto py-8 px-6'>
      <DashboardHeader
        title="Scheduler"
      />

      <SchedulerSteps currentStep={3} />

      <GWCard title="Assign provider" >

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by provider name"
              className="pl-10 pr-4 h-11 py-3 md:text-[16px] bg-gray-50 border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className='!hidden border-1 h-10 border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium text-gray-700 flex items-center gap-2 cursor-pointer'>
                Filter
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-3xs p-0 shadow-xl" align="end">
              <DropdownMenuLabel className="font-normal text-sm pt-3 px-4">Distance</DropdownMenuLabel>
              <DropdownMenuGroup>
                <div className="py-3 px-4">
                  <Slider
                    defaultValue={[50]}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="py-3 px-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="checkbox1" 
                      onCheckedChange={(value) => {
                        if(value){
                          setFilteredData(data.filter(provider => provider.IsEmailVerified === true));
                        }else{
                          setFilteredData(data);
                        } 
                      }}
                    />
                    <Label htmlFor="checkbox1" className="font-normal">Available</Label>
                  </div>
                </div>
                <div className="py-3 px-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Checkbox id="checkbox2"
                      onCheckedChange={(value) => {
                        if(value){
                          setFilteredData(data.filter(provider => parseInt(provider.TotalBookings) > 0));
                        }else{
                          setFilteredData(data);
                        } 
                      }}
                    />
                    <Label htmlFor="checkbox2" className="font-normal">With recent bookings</Label>
                  </div>
                </div>
                {/* <Separator className="bg-gray-100" />
                <div className="py-3 px-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Checkbox id="checkbox3" />
                    <Label htmlFor="checkbox3" className="font-normal">Female</Label>
                  </div>
                </div>
                <div className="py-3 px-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Checkbox id="checkbox4" />
                    <Label htmlFor="checkbox4" className="font-normal">Male</Label>
                  </div>
                </div> */}
                <Separator className="bg-gray-100" />
                <div className="py-3 px-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Checkbox id="checkbox5" />
                    <Label htmlFor="checkbox5" className="font-normal">Outside service zone</Label>
                  </div>
                </div>
                <div className="py-3 px-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Checkbox id="checkbox6" />
                    <Label htmlFor="checkbox6" className="font-normal">Off day</Label>
                  </div>
                </div>

              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

        {/* Provider Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 max-h-96 overflow-y-auto">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <ProviderSkeleton key={i} />
            ))
          ): filteredData?.map((provider : Provider) => (
              <ProviderCard key={provider.ProviderId} provider={provider} setSelectProvider={setSelectProvider} selectProvider={selectProvider} />
          ))}
        </div>

        {/*<div className="mb-4">*/}
        {/*  <span className="text-sm text-gray-500 underline font-semibold">*/}
        {/*    Provider not listed here?*/}
        {/*  </span>*/}
        {/*</div>*/}

        <Separator className="my-4 bg-gray-200" />

        {/* Pagination */}
        <div className="flex items-center gap-2 justify-between">
          <button
            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium text-gray-700 flex items-center gap-2"
          >
            <Link href="/scheduler/enter-location" className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Link>
          </button>

          <Button
            className="cursor-pointer h-10 px-4 py-2 border border-gray-300 rounded-lg bg-gray-900 font-medium text-white flex items-center gap-2"
            onClick={() => handleNext()}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </GWCard>
    </div>
  );
}