'use client';

import React, { useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import {ArrowRight, ChevronRight, MoveRight, PlusIcon, Search} from 'lucide-react';
import { Input } from '@/components/ui/input';
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Arrow, Separator } from '@radix-ui/react-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@radix-ui/react-label';
import { Switch } from '@/components/ui/switch';
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import AvailabilityCard from "@/components/shared/AvailabilityCard";
import {Button} from "@/components/ui/button";

export default function AddNewUser() {

	const [value, setValue] = useState<string>();
  
  return (
    <div className='max-w-5xl mx-auto py-8 px-4'>
      {/* Header */}
			<div className="flex items-start">
				<DashboardHeader
					title="Services"
					description="You will be able to assign service zones to each user on the next step."
					className="flex-1"
				/>
				<Button className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg bg-gray-900 font-medium text-white flex items-center gap-2">
					<PlusIcon />
					New User
				</Button>
			</div>
      
      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
        <CardContent className="px-0">
					<div className="flex items-center gap-x-3 mb-4">
            <span className="font-medium text-sm text-gray-500">Users</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-sm text-gray-700">Add New User</span>
          </div>
          <h3 className="text-base font-medium sm:text-lg mb-4">New User</h3>
					<div className="space-y-4">

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-center">
								<label className="font-medium">Full Name</label>
							</div>
							<div className="flex flex-col gap-2">
								<Input className="h-11 md:text-[16px] border-gray-300" placeholder="Full Name" />
							</div>
						</div>
						<Separator className="bg-gray-200 h-0.25" />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-center">
								<label className="font-medium">User Name</label>
							</div>
							<div className="flex flex-col gap-2">
								<Input className="h-11 md:text-[16px] border-gray-300" placeholder="User Name" />
							</div>
						</div>
						<Separator className="bg-gray-200 h-0.25" />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-center">
								<label className="font-medium">Role/Function</label>
							</div>
							<div className="flex flex-col gap-2">
								<Input className="h-11 md:text-[16px] border-gray-300" placeholder="Nurse" />
							</div>
						</div>
						<Separator className="bg-gray-200 h-0.25" />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-center">
								<label className="font-medium">Phone number</label>
							</div>
							<div className="flex flex-col gap-2">
								<div className="
										flex items-center w-full
										border border-gray-300
										rounded-md px-4 py-2
										bg-white
										text-gray-700
										focus-within:ring-2 focus-within:ring-blue-500
									">
									<PhoneInput
										international
										defaultCountry="US"
										value={value}
										onChange={setValue}
										className="w-full flex items-center gap-2"
										countrySelectComponent={({ value, onChange, options }) => (
											<select
												value={value}
												onChange={(e) => onChange(e.target.value)}
												className="bg-transparent outline-none cursor-pointer pr-1 font-medium"
											>
												{options.map((opt: {value: string}, index: number) => (
													<option key={index} value={opt.value}>
														{opt.value}
													</option>
												))}
											</select>
										)}
									/>
								</div>
							</div>
						</div>
						<Separator className="bg-gray-200 h-0.25" />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-center">
								<label className="font-medium">Email</label>
							</div>
							<div className="flex flex-col gap-2">
								<Input className="h-11 md:text-[16px] border-gray-300" placeholder="user@contact.com" />
							</div>
						</div>
						<Separator className="bg-gray-200 h-0.25" />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex">
								<label className="font-medium">Team assigned</label>
							</div>
							<div className="flex flex-col gap-4">
								<div className="flex-1 relative">
									<Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
									<Input
										placeholder="Search by team’s name"
										className="pl-10 pr-4 h-11 py-3 md:text-[16px] bg-gray-50 border-0"
									/>
								</div>
								<div>
									<div className="px-6 py-3 text-sm font-medium text-gray-500 bg-[#FCFCFD]">
										Team Name
									</div>
									<div className="flex flex-col">
										<div className="flex items-center gap-[12px] p-6 transition mb-0 border-b-1 border-[#E4E7EC]">
											<Checkbox id="checkbox1" checked className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
											<Label htmlFor="checkbox1" className="font-medium">Street Mall - Square Market Team</Label>
										</div>
										<div className="flex items-center gap-[12px] p-6 transition mb-0 border-b-1 border-[#E4E7EC]">
											<Checkbox id="checkbox2" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
											<Label htmlFor="checkbox2" className="font-medium">Rescue Team</Label>
										</div>
										<div className="flex items-center gap-[12px] p-6 transition mb-0 border-b-1 border-[#E4E7EC]">
											<Checkbox id="checkbox3" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
											<Label htmlFor="checkbox3" className="font-medium">Zone Central</Label>
										</div>
										<div className="flex items-center gap-[12px] p-6 transition mb-0">
											<Checkbox id="checkbox4" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
											<Label htmlFor="checkbox4" className="font-medium">Suburban zone</Label>
										</div>
									</div>
								</div>
								
							</div>
						</div>
						<Separator className="bg-gray-200 h-0.25" />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex">
								<label className="font-medium">Zone assigned</label>
							</div>
							<div className="flex flex-col gap-4">
								<div className="flex-1 relative">
									<Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
									<Input
										placeholder="Search by zone’s namez"
										className="pl-10 pr-4 h-11 py-3 md:text-[16px] bg-gray-50 border-0"
									/>
								</div>
								<div className="bg-gray-100 rounded-4xl h-[418px] w-full"></div>
								<div>
									<div className="px-6 py-3 text-sm font-medium text-gray-500 bg-[#FCFCFD]">
										Zone Name
									</div>
									<div className="flex flex-col">
										<div className="flex items-center gap-[12px] p-6 transition mb-0 border-b-1 border-[#E4E7EC]">
											<Checkbox id="checkbox1" checked className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
											<Label htmlFor="checkbox1" className="font-medium">Street Mall - Square Market</Label>
										</div>
										<div className="flex items-center gap-[12px] p-6 transition mb-0 border-b-1 border-[#E4E7EC]">
											<Checkbox id="checkbox2" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
											<Label htmlFor="checkbox2" className="font-medium">Zone Central</Label>
										</div>
									</div>
								</div>

							</div>
						</div>
						<Separator className="bg-gray-200 h-0.25" />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex">
								<label className="font-medium">Availability</label>
							</div>
							<div className="flex flex-col gap-4">
								<div className="p-4 bg-gray-50 rounded-xl space-y-4">

									<AvailabilityCard key={1} dayOfWeek="Monday" />
									<AvailabilityCard key={2} dayOfWeek="Tuesday" />
									<AvailabilityCard key={3} dayOfWeek="Wednesday" />
									<AvailabilityCard key={4} dayOfWeek="Thursday" />
									<AvailabilityCard key={5} dayOfWeek="Friday" />
									<AvailabilityCard key={6} dayOfWeek="Saturday" isAvailable={false} />
									<AvailabilityCard key={7} dayOfWeek="Sunday" isAvailable={false} />

								</div>
							</div>
						</div>

					</div>
        </CardContent>
      </Card>

    </div>
  );
}