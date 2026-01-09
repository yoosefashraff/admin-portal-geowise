'use client';

import { useState, useEffect } from 'react';
import {Search, ChevronRight, ArrowDown, ArrowLeft} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {useAuthStore} from "@/lib/store/authStore";
import {Service} from "@/lib/types/scheduler.types";
import GWCard from "@/components/shared/GWCard";
import {DashboardHeader} from "@/components/layout/DashboardHeader";
import {SchedulerSteps} from "@/components/layout/SchedulerSteps";
import {useSchedulerStore} from "@/lib/store/schedulerStore";
import { useRouter } from 'next/navigation';
import {getServices} from "@/lib/actions/scheduler.actions";
import ServiceSkeleton from "@/components/skeleton/ServiceSkeleton";
import {User} from "@/lib/types/auth.types";
import { useSessionStorage } from '@/lib/hooks/useSessionStorage';
import NewService from '@/components/scheduler/NewService';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { set } from 'zod';

export default function ServiceList() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const {user} = useAuthStore();
  const [data, setData] = useState<Service[]>([]);
  const [filteredData, setFilteredData] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const [service, setService] = useSessionStorage('Service', '');
  const [isAddService, setIsAddService] = useState(false);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  useEffect(() => {
    async function load(user: User) {
      const response = await getServices({companyadminId: user.UserID});

      if(response.Status !== 201){
        toast.error(response.Message);
        return;
      }

      setData(response.Object);
      setLoading(false);
    }
    if(user){
      load(user);
    }
  }, [user]);

  // Update filtered data
  useEffect(() => {
    setFilteredData(data);
  }, [data])

  useEffect(() => {
    if(service){
      const parsed = JSON.parse(service);
      if(parsed.length > 0){
        setSelectedServices(parsed.map((item : any) => item.Id));
      }
    }
  }, [service]);

  const handleSelectService = (service : number) => {
    if(selectedServices.includes(service)){
      setSelectedServices(selectedServices.filter(item => item !== service));
    }else{
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSearch = () =>{
    let result = [...data];

    // Search filter
    if (searchQuery) {
      result = result.filter(service =>
        service.ServiceName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredData(result);
  }

  useEffect(() => {
    handleSearch();
  }, [searchQuery]);

  const handleNext = () => {
    if(selectedServices.length > 0){
      const seviceSelectedItems = data.filter(item => selectedServices.includes(item.Id));
      setService(JSON.stringify(seviceSelectedItems));
      router.push('/scheduler/enter-location')
    }else{
      toast.error('Please select a service');
    }
  }

  return (
    <div className='max-w-5xl mx-auto py-8 px-6'>
      <DashboardHeader
        title="Scheduler"
      />
      <SchedulerSteps currentStep={1} />
      {isAddService 
        ? 
        <NewService setIsAddService={setIsAddService} setData={setData} />
        :
        <GWCard title="Select Service">
          {/* Search */}
          <div className="relative flex items-center gap-x-10 max-w-[710px] mx-auto mb-7">
            <Search
              className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Search for services"
              className="pl-10 pr-4 h-11 py-3 md:text-[16px] text-[16px] bg-gray-50 border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* <Button
              variant="ghost"
              className='border-1 h-10 border-gray-300'
              onClick={()=> handleSearch()}
            >
              Filter
              <ArrowDown className="w-4 h-4" />
            </Button> */}
          </div>

          {/* Services List */}
          <div className="space-y-4 max-w-[720px] p-4 mx-auto max-h-96 overflow-y-auto">
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <ServiceSkeleton key={i} />
                ))
            ): filteredData?.map((service) => (
              <Button
                key={service.Id}
                onClick={() => handleSelectService(service.Id)}
                variant="outline"
                className={
                  cn("w-full cursor-pointer shadow-[0px_2px_24px_rgba(16,24,40,0.06)] h-auto p-3 sm:p-4 justify-between border-2 border-transparent hover:border-gray-300 group", 
                    selectedServices.includes(service.Id) && "!border-gray-900 shadow-md")
                  }
              >
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate sm:whitespace-normal">
                    {service.ServiceName}
                  </div>
                  <div className="text-sm font-normal text-gray-900 mt-0.5 flex gap-x-6">
                    <span>{service.CurrencyCode} {service.Price}</span>
                    <span>
                      ~{service.Duration} minutes
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-900 flex-shrink-0 ml-2" />
              </Button>
            ))
          }
          </div>

          <div className="text-center mt-3">
            <div
              className="text-sm text-gray-600 underline underline-offset-2 cursor-pointer"
              onClick={() => setIsAddService(true)}
            >
              Service not listed here?
            </div>
          </div>

          <Separator className="my-4 bg-gray-200" />
            <div className="flex justify-end">
              <Button
                onClick={() => handleNext()}
                className="ml-3 cursor-pointer"
              >
                  Continue
              </Button>
            </div>
        </GWCard>
      }
    </div>
  )
}