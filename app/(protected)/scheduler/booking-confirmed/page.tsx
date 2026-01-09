'use client';

import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import React, { useEffect, useState } from "react";
import {Calendar, CheckCircle, MapPin, Tag, User, UserCircle} from "lucide-react";
import Image from "next/image";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useSessionStorage } from "@/lib/hooks/useSessionStorage";
import { useRouter } from "next/navigation";
import { BookingConfirmed } from "@/lib/types/scheduler.types";
import Link from "next/link";

export default function BookingConfirmedPage(){

	const router = useRouter();
	const [bookingConfirmed, setBookingConfirmed, removeBookingConfirmed] = useSessionStorage('BookingConfirmed', '');
	const [dataBooking, setDataBooking] = useState<BookingConfirmed>();

	useEffect(() => {
    if (!bookingConfirmed) {
      router.replace("/scheduler/select-service");
      return;
    }

		setDataBooking(JSON.parse(bookingConfirmed));

    removeBookingConfirmed();
  }, [router]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
			<DashboardHeader
				title="Scheduler"
			/>

    	<div className="w-full max-w-3xl mx-auto">
        {/* Confirmation Card */}
        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_24px_rgba(16,24,40,0.06)] overflow-hidden">
          {/* Success Icon */}
          <div className="flex justify-center pb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-100 rounded-full blur-2xl opacity-60 animate-pulse"></div>
              <div className="relative bg-green-100 rounded-full p-3 border-[15px] border-green-50">
                <CheckCircle className="w-10 h-10 text-emerald-600" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-medium text-center text-slate-900 mb-8">
            Booking confirmed
          </h1>

          {/* Details Section */}
          <div className="space-y-5">
            {/* Client */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-600" />
                <h2 className="font-medium text-slate-700">Client</h2>
              </div>
              <div className="font-medium text-slate-900 p-4 shadow-[0px_2px_24px_rgba(16,24,40,0.06)] rounded-xl">{dataBooking?.Name}</div>
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <UserCircle className="w-5 h-5 text-slate-600" />
                <h2 className="font-medium text-slate-700">Provider</h2>
              </div>

              <div className="flex items-center gap-3 p-4 shadow-[0px_2px_24px_rgba(16,24,40,0.06)] rounded-xl">
                <Image
                  width={40}
                  height={40}
                  src={dataBooking?.ProfileImage || "/images/avatar.png"}
                  alt={dataBooking?.ProviderName || ""}
                  className="w-12 h-12 rounded-full object-cover"
									unoptimized
                />
                <div>
                  <p className="font-medium text-gray-900">{dataBooking?.ProviderName}</p>
                </div>
              </div>

            </div>

            {/* Appointment */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-600" />
                <h2 className="font-medium text-slate-700">Appointment</h2>
              </div>
              <div className="flex justify-between items-center p-4 shadow-[0px_2px_24px_rgba(16,24,40,0.06)] rounded-xl">
                <p className="font-medium">{dataBooking?.TimingSlot}</p>
                <p className="">{dataBooking?.Date}</p>
              </div>
            </div>

            {/* Service */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-slate-600" />
                <h2 className="font-medium text-slate-700">Service</h2>
              </div>
              <div className="font-medium text-slate-900 p-4 shadow-[0px_2px_24px_rgba(16,24,40,0.06)] rounded-xl">
                {dataBooking?.Services?.map((service: any) => (
                  <p key={service.ServiceId}>{service.ServiceName}</p>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-600" />
                <h2 className="font-medium text-slate-700">Location</h2>
              </div>
              <div className="font-medium text-slate-900 p-4 shadow-[0px_2px_24px_rgba(16,24,40,0.06)] rounded-xl">
                {dataBooking?.Address}
              </div>
            </div>
          </div>

          <Separator className="my-4 bg-gray-200" />
          <div className="flex justify-end">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">
              <Link href="/scheduler/select-service">Schedule another booking</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}