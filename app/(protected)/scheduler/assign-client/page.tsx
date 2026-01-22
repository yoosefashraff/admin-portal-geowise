'use client';

import GWCard from "@/components/shared/GWCard";
import {ArrowLeft, ChevronRight, Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import React, {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import Image from "next/image";
import {Separator} from "@/components/ui/separator";
import {Card, CardContent} from "@/components/ui/card";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SchedulerSteps } from "@/components/layout/SchedulerSteps";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSchedulerStore } from "@/lib/store/schedulerStore";
import { Customer, SchedulerData, SchedulerSubmitData } from "@/lib/types/scheduler.types";
import { listcustomerforscheduler, addCustomerBookings } from "@/lib/actions/scheduler.actions";
import ClientSkeleton from "@/components/skeleton/ClientSkeleton";
import { useSessionStorage } from "@/lib/hooks/useSessionStorage";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import NewClient from "@/components/scheduler/NewClient";


export default function AssignClientPage(){
  const router = useRouter();
  const [isAddNewClient, setIsAddNewClient] = useState<boolean>(false);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<Customer[]>([]);
  const [filteredData, setFilteredData] = useState<Customer[]>([]);
  const [selectCustomer, setSelectCustomer] = useState<number|null>(null);
	const [provider, setProvider, removeProvider] = useSessionStorage('Provider', '');
	const [location, setLocation, removeLocation] = useSessionStorage('Location', '');
	const [searchQuery, setSearchQuery] = useState<string>("");
	const { user } = useAuthStore();
	const [barberDate, setBarberDate, removeBarberDate] = useSessionStorage('BarberDate', '');
  const [timingSlot, setTimingSlot, removeTimingSlot] = useSessionStorage('TimingSlot', '');
	const [service, setService, removeService] = useSessionStorage('Service', '');
	const [bookingConfirmed, setBookingConfirmed] = useSessionStorage('BookingConfirmed', '');

	useEffect(() => {
    if (!service || !location || !provider || !timingSlot || !barberDate) {
      router.replace('/scheduler/select-service');
    }
  }, [router]);

	useEffect(() => {
		async function load() {
			try {
				const providerId = provider ? JSON.parse(provider).ProviderId : 0;
				const response = await listcustomerforscheduler({ providerId });
				setData(response.Response);
				setFilteredData(response.Response);
				setLoading(false);
			} catch (error: any) {
				console.error('Error loading customers:', error);
				toast.error(error.message || 'Failed to load customers');
				setLoading(false);
			}
		}
		if(provider){
			load();
		}
	}, [provider]);

	 useEffect(() => {
    let result = [...data];

    if (searchQuery) {
      result = result.filter(customer =>
        customer.Name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSelectCustomer(0);
    }
    setFilteredData(result);
  }, [searchQuery]);

	const handleBooking = async (newCustomer: Customer | null) => {
		setBookingLoading(true);
		let customerSelected;

		if(!newCustomer){
			customerSelected = data.find(customer => customer.Id === selectCustomer);
		}else{
			customerSelected = newCustomer
		}

		if(!customerSelected){
			toast.error('Please select a customer or create a new one.');
			setBookingLoading(false);
			return;
		}

		let serviceIds : string = '';
		const parsed = JSON.parse(service);
		if (Array.isArray(parsed) && parsed.length > 0) {
			if(parsed.length == 1 && parsed[0]?.Id){
				serviceIds = parsed[0].Id.toString();
			}else{
				serviceIds = parsed.map(item => item.Id.toString()).join(',');
			}
		}

		const scheduleSubmitData : SchedulerSubmitData = {
			ServiceId: serviceIds,
			CustomerId: customerSelected?.Id?.toString() || null,
			Date: barberDate,
			TimingSlot: timingSlot,
			Name: customerSelected?.Name || '',
			PhoneNumber: customerSelected?.Contact || '',
			Email: customerSelected?.Email || 'test@gmail.com',
			CountryCode: customerSelected?.CountryCode || '',
			Address: location ? JSON.parse(location).Address : '',
			Lat: location ? JSON.parse(location).Lat : 0,
			Lng: location ? JSON.parse(location).Lng : 0,
			ProviderId: provider ? JSON.parse(provider).ProviderId : 0,
			CompanyUserId: user?.UserID ?? 0,
			AssociationType: 2,
			IsBarberBooking: true
		}
		
		try {
			//Booking
			const response = await addCustomerBookings(scheduleSubmitData);

			console.log(response);

			if(response.Status === 201){
				setBookingConfirmed(JSON.stringify({
					...scheduleSubmitData,
					...JSON.parse(provider),
					Services: JSON.parse(service)
				}));
				removeService();
				removeProvider();
				removeLocation();
				removeBarberDate();
				removeTimingSlot();

				router.replace('/scheduler/booking-confirmed');
			}else{
				toast.error(response.Message || 'Failed to create booking');
			}
		} catch (error: any) {
			console.error('Error creating booking:', error);
			toast.error(error.message || 'Failed to create booking');
		} finally {
			setBookingLoading(false);
		}
	}

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
    	<DashboardHeader
        title="Scheduler"
      />

      <SchedulerSteps currentStep={5} />

			<div className="relative">
				{bookingLoading && 
					<div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/50 z-50">
						<div className="flex items-center gap-2">
							<Spinner className="size-8 text-gray-500" />
						</div>
					</div>
				}
				{isAddNewClient ? (
					<NewClient 
						setIsAddNewClient={setIsAddNewClient} 
						handleBooking={handleBooking}
					/>
					) : (
					<GWCard title="Assign client" titleAlign="text-center" >
						<div className="max-w-3xl mx-auto">
							<div className="space-y-3">
								<div className="flex-1 relative">
									<Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
									<Input
										placeholder="Search for clients"
										className="pl-10 pr-4 h-11 py-3 md:text-[16px] bg-gray-50 border-0"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>

								<div className="max-h-96 overflow-y-auto">
									{loading ? (
										Array.from({ length: 4 }).map((_, i) => (
											<ClientSkeleton key={i} />
										))
									) : (
										<div className="space-y-3">
											{filteredData.map((client: Customer) => (
												<Button
													key={client.Id}
													variant="outline"
													onClick={() => setSelectCustomer(client.Id || null)}
													className={cn("w-full rounded-xl cursor-pointer shadow-[0px_2px_24px_rgba(16,24,40,0.06)] h-auto has-[>svg]:px-6 py-4 justify-between border-2 border-transparent hover:border-gray-900 group",
														selectCustomer === client.Id && "border-gray-900"
													)}
												>
													<div className="flex items-center gap-3">
														<Image
															width={48}
															height={48}
															src={client.ImageThumb || "/images/avatar.png"}
															alt={client.Name}
															className="w-12 h-12 rounded-full object-cover"
															unoptimized
														/>
														<span className="font-medium">{client.Name}</span>
													</div>
													<ChevronRight className="!w-6 !h-6 text-gray-800 flex-shrink-0 ml-2" />
												</Button>
											))}

										</div>
									)}
								</div>
								
								<Button
									variant="link"
									className="!p-0 font-semibold !h-auto text-gray-500 underline cursor-pointer"
									onClick={() => setIsAddNewClient(true)}
								>
									Add new client
								</Button>
							</div>
							<Separator className="my-4 bg-gray-200" />
							<div className="flex justify-end">
								<Button variant="outline" className="cursor-pointer">
									<Link href="/scheduler/datetime-selection" className="flex items-center gap-2">
										<ArrowLeft className="h-6 w-6"></ArrowLeft>
										Previous
									</Link>
								</Button>
								<Button className="ml-3 cursor-pointer" onClick={() => handleBooking(null)} >Submit</Button>
							</div>
						</div>
					</GWCard>
				)
				}
			</div>
    </div>
  )
}