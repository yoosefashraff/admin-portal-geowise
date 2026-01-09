'use client';

import { use, useEffect } from "react";
import GWCard from "@/components/shared/GWCard";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, ChevronDownIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { cn, groupDatesByMonthArray } from "@/lib/utils";
import 'swiper/css';
import 'swiper/css/scrollbar';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Swiper as SwiperType } from "swiper/types";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SchedulerSteps } from "@/components/layout/SchedulerSteps";
import { useSchedulerStore } from "@/lib/store/schedulerStore";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types/auth.types";
import { MonthGroup, SchedulerData } from "@/lib/types/scheduler.types";
import { getbarberavilabelbookingdate, getbarbertimeslotslist } from "@/lib/actions/scheduler.actions";
import Link from "next/link";
import dayjs from "dayjs";
import { Skeleton } from "@/components/ui/skeleton";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { toast } from "sonner";
import { useSessionStorage } from "@/lib/hooks/useSessionStorage";
import { Scrollbar } from 'swiper/modules';

export default function DateTimeSelectPage() {
  
  dayjs.extend(customParseFormat);

  const router = useRouter();
  const { schedulerData, _hasHydrated } = useSchedulerStore();
  const updateSchedulerData = useSchedulerStore((state) => state.updateSchedulerData)
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLoading, setTimeLoading] = useState(true);
  const [monthGroup, setMonthGroup] = useState<MonthGroup[]>([]);
  const [currentMonth, setCurrentMonth] = useState<MonthGroup | null>();
  const [dateAvaliable, setDateAvailable] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const daysSwiper = useRef<SwiperType | null>(null);
  const timeSwiper = useRef<SwiperType | null>(null);
  const [month, setMonth] = useState<Date>(new Date());
  const [service] = useSessionStorage('Service', '');
  const [location] = useSessionStorage('Location', '');
  const [provider, setProvider] = useSessionStorage('Provider', '');
  const [barberDate, setBarberDate] = useSessionStorage('BarberDate', '');
  const [timingSlot, setTimingSlot] = useSessionStorage('TimingSlot', '');

  // useEffect(() => {
  //   if(_hasHydrated  && !schedulerData?.ProviderId){
  //     router.push('/scheduler/select-service');
  //   }
  // }, [_hasHydrated, schedulerData])

  useEffect(() => {
    if (!service || !location || !provider) {
      router.replace('/scheduler/select-service');
    }
  }, [router]);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeZone(tz);
  }, []);

  useEffect(() => {
    async function load(user : User) {
      const today = dayjs().format("YYYY-MM-DD");
      const sixMonthsLater = dayjs().add(6, "month").format("YYYY-MM-DD");
      const response : {List : string[]} = await getbarberavilabelbookingdate(
        {
          BarberId: provider ? JSON.parse(provider).ProviderId : 0,
          FromDate: today,
          ToDate: sixMonthsLater,
          ServiceZoneId: provider ? JSON.parse(provider).ServiceZoneId : 0,
          AssociationType: 1,
          CompanyAdminId: user.UserID,
          TimeZone: timeZone || 'Europe/London'
        }
      );

      if(!response?.List || response.List.length === 0){
        setMonthGroup([]);
        setCurrentMonth(null);
        setLoading(false);
        setTimeLoading(false);
        return;
      }

      // Set the available dates
      setDateAvailable(response.List);
      // Group the dates by month
      const monthG = groupDatesByMonthArray(response.List);
      // Set the month group
      setMonthGroup(monthG);
      // Set the first month as the current month
      const monthFromDate = dayjs(barberDate || monthG[0].dates[0]).format("YYYY-MM");
      const cm = monthG.find((m) => m.month === monthFromDate) || monthG[0];
      setCurrentMonth(cm);
      // Set the first date as the selected date
      setSelectedDate( barberDate || monthG[0].dates[0]);

      setMonth(new Date(barberDate || monthG[0].dates[0]));

      setTimeout(() => {
        daysSwiper.current?.slideTo(cm.dates.indexOf(barberDate || monthG[0].dates[0]), 0);
      }, 100);

      setLoading(false);
    }
    if(user){
      load(user);
    }
  }, [user, provider]);

  useEffect(() => {
    if(selectedDate){
      async function loadTimeAvailability() {
        setTimeLoading(true);

        let serviceId = 0;
        const parsed = JSON.parse(service);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.Id) {
          serviceId = parsed[0].Id;
        }
        if(!serviceId){
          router.replace('/scheduler/select-service');
        }

        const response : {List : string[]} = await getbarbertimeslotslist(
          {
            BarberId: provider ? JSON.parse(provider).ProviderId : 0,
            Date: selectedDate || dayjs().format("YYYY-MM-DD"),
            BookingType: 2,
            ServiceId: serviceId,
            Lat: location ? JSON.parse(location).Lat : 0,
            Lng: location ? JSON.parse(location).Lng : 0,
            AssociationType: 1,
            CompanyAdminId: user?.UserID ?? 0,
            TimeZone: timeZone || 'Europe/London'
          }
        );
        if(!response?.List || response.List.length === 0){
          setTimeSlots([]);
          setTimeLoading(false);
          return;
        }
        setTimeSlots(response.List);
        setSelectedTime(timingSlot || response.List[0]);
        
        setTimeLoading(false);

        setTimeout(() => {
          timeSwiper.current?.slideTo(response.List.indexOf(timingSlot || response.List[0]), 0);
        }, 100);
      }
      loadTimeAvailability();
    }
  }, [selectedDate])

  const handleNext = () : void => {
    if(selectedDate && selectedTime){
      // updateSchedulerData({Date: selectedDate, TimingSlot: selectedTime});
      setBarberDate(selectedDate);
      setTimingSlot(selectedTime);
      router.push('/scheduler/assign-client');
    }else{
      toast.error('Please select a date and time');
    }
  }

  function isDateEnabled(date: Date, enabledDates: string[]): boolean {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    return enabledDates.includes(dateStr);
  }

  const disabledMatcher = (date: Date) => {
    return !isDateEnabled(date, dateAvaliable);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <DashboardHeader
        title="Scheduler"
      />

      <SchedulerSteps currentStep={4} />

      <GWCard title="Choose date/time" titleAlign="text-center" className="max-w-3xl mx-auto">
        <div className="">
          <div className="text-sm mb-3">Quick select</div>
          <div className="flex gap-3">
            {loading ? (
              <Skeleton className="w-30 h-11" />
            ) : monthGroup.length > 0 && (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="h-11 px-4 justify-between font-normal"
                  >
                    {selectedDate || "Date"}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  {dateAvaliable.length > 0 && (() => {
                    const fromDate = new Date(dateAvaliable[0]);
                    const toDate = new Date(dateAvaliable[dateAvaliable.length - 1]);
                    const defaultMonth = fromDate;
                    return (
                      <Calendar
                        mode="single"
                        selected={new Date(selectedDate || "")}
                        captionLayout="dropdown"
                        disabled={disabledMatcher}
                        startMonth={fromDate}
                        endMonth={toDate}
                        month={month}
                        onMonthChange={setMonth}
                        onSelect={(d) => {
                          const dString = dayjs(d).format("YYYY-MM-DD");
                          setSelectedDate(dString);
                          const month = dayjs(d).format("YYYY-MM");
                          const cm = monthGroup.find((m) => m.month === month);
                          setCurrentMonth(cm);
                          if (d) setMonth(d);
                          setOpen(false);
                          daysSwiper.current?.slideTo(cm ? cm.dates.indexOf(dString) : 0, 0);
                        }}
                      />
                    );
                  })()}
                  
                </PopoverContent>
              </Popover>
            )}
            
            {timeLoading ? (
              <Skeleton className="w-25 h-11" />
            ) : timeSlots.length > 0 && (
              <Select value={selectedTime || timeSlots[0]} 
                onValueChange={
                  (t) => {
                    setSelectedTime(t);
                    timeSwiper.current?.slideTo(timeSlots.indexOf(t), 0);
                  }
                }
              >
                <SelectTrigger className="min-w-[93px] data-[size=default]:h-11 data-[placeholder]:text-gray-900">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {timeSlots.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
            
          </div>
        </div>
        <Separator className="my-5 bg-gray-200" ></Separator>
        <div className="gap-y-5">
          <div className="gap-y-5">

            {loading ? (
              <>
              <Skeleton className="h-4 w-40 rounded-md" />
              <div className="flex items-center justify-center gap-x-4 py-5">
                <Skeleton className="h-8 w-8 rounded-md" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-20 rounded-xl" />
                ))}
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              </>
            ) : (
              currentMonth ? (
              <>
                <Select 
                  defaultValue={currentMonth && currentMonth.month || ""} 
                  onValueChange={(value : string) => {
                    const cm = monthGroup.find(m => m.month === value);
                    setCurrentMonth(cm);
                    setSelectedDate(cm ? cm.dates[0] : null);
                  }}
                  >
                  <SelectTrigger className="min-w-[93px] data-[size=default]:h-11 data-[placeholder]:text-gray-900 !border-0 cursor-pointer !shadow-none !p-0 !h-auto font-medium">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {monthGroup.map((m, i) => (
                        <SelectItem
                          key={i}
                          value={m.month}
                        >
                          {dayjs(m.month).format("MMMM YYYY")}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" className="rounded-full h-10 w-10" onClick={() => daysSwiper.current?.slidePrev()}>◀</Button>
                  <Swiper
                    modules={[Scrollbar]}
                    slidesPerView={'auto'}
                    spaceBetween={16}
                    onSwiper={(s) => (daysSwiper.current = s)}
                    className="w-full !py-5 datetime-swipper-1"
                    scrollbar={{
                      draggable: true,
                      hide: false,
                    }}
                  >
                    {currentMonth.dates.map((d, i) => (
                      <SwiperSlide 
                        key={i} 
                        className="!w-auto"
                        >
                        <div //bg-[#0F172A] text-white
                          onClick={() => {
                            setSelectedDate(d)
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center w-20 h-19 rounded-2xl text-center border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06)] cursor-pointer bg-white",
                            selectedDate === d && "bg-[#0F172A] text-white"
                          )}
                        >
                          <div className="text-sm">{dayjs(d).format("ddd")}</div>
                          <div className="font-semibold">{dayjs(d).format("DD")}</div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  <Button variant="ghost" className="rounded-full h-10 w-10" onClick={() => daysSwiper.current?.slideNext()}>▶</Button>
                </div>
              </>
              ) : (
                <div className="flex items-center justify-center py-5">No available dates</div>
              )
            )}
            
          </div>
          <div className="gap-y-5">
            {timeLoading ? (
              <div className="pt-1">
                <Skeleton className="h-4 w-40 rounded-md" />
                <div className="flex items-center justify-center gap-x-4 py-5">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-20 rounded-xl" />
                  ))}
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ) : timeSlots.length > 0 ? (
              <div>
                <Button variant="ghost" className="h-auto has-[>svg]:px-0 p-0 hover:bg-transparent" >
                  <span className="font-medium">Available time slots</span>
                </Button>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" className="rounded-full h-10 w-10" onClick={() => timeSwiper.current?.slidePrev()}>◀</Button>
                  <Swiper
                    modules={[Scrollbar]}
                    slidesPerView={'auto'}
                    spaceBetween={16}
                    onSwiper={(s) => (timeSwiper.current = s)}
                    className="w-full !py-5 datetime-swipper-2"
                    scrollbar={{
                      draggable: true,
                      hide: false,
                    }}
                  >
                    {timeSlots.map((t, i) => {
                      const parsed = dayjs(t, "hh:mm A");
                      return <SwiperSlide key={i} className="!w-auto">
                        <div
                          onClick={() => setSelectedTime(t)}
                          className={cn(
                            "flex flex-col items-center justify-center w-20 h-19 rounded-2xl text-center border-0 cursor-pointer shadow-[0px_2px_24px_rgba(16,24,40,0.06)]",
                            selectedTime === t && "bg-[#0F172A] text-white"
                          )}
                        >
                          <div className="font-medium">{parsed.format("HH:mm")}</div>
                          <div className="text-sm">{parsed.format("A")}</div>
                        </div>
                      </SwiperSlide>
                    })}
                  </Swiper>

                  <Button variant="ghost" className="rounded-full h-10 w-10" onClick={() => timeSwiper.current?.slideNext()}>▶</Button>
                </div>
              </div>
            ): (
              <div className="flex items-center justify-center py-5">No available time slots</div>
            )}
          
          </div>
        </div>
        <Separator className="my-5 bg-gray-200" ></Separator>
        <div className="flex justify-end">
          <Button variant="outline" className="cursor-pointer">
            <Link href="/scheduler/assign-provider" className="flex items-center gap-2">
              <ArrowLeft className="h-6 w-6"></ArrowLeft>
              Previous
            </Link>
          </Button>
          <Button 
            className="ml-3 cursor-pointer"
            onClick={handleNext}
            >
            Continue
          </Button>
        </div>
      </GWCard>
    </div>
  )
}