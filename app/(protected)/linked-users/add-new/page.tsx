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
import AvailabilityCard from "@/components/shared/AvailabilityCard";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  FullName: z.string().min(1, 'Full name is required'),
  UserName: z.string().min(1, 'User name is required'),
  Email: z.email().min(1, 'Email is required'),
  PhoneNumber: z.string().min(1, 'Phone number is required'),
  CountryCode: z.string().min(1, 'Country code is required'),
})

export default function AddNewProviderPage() {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      FullName: "",
      UserName: '',
      Email: '',
      PhoneNumber: '',
      CountryCode: "+1",
    },
  })

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  }

  const currentStep = 1;

  const steps = [
    { num: 1, label: 'Personal Info'},
    { num: 2, label: 'Service'},
    { num: 3, label: 'Availability' },
    { num: 4, label: 'Zone assigned'},
  ];
  
  return (
    <div className='max-w-5xl mx-auto py-8 px-6'>
      {/* Header */}
			<div className="flex items-start">
				<DashboardHeader
					title="Users"
					description="You will be able to assign service zones to each user on the next step."
					className="flex-1"
				/>
			</div>
      
      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
        <CardContent className="px-0">
					<div className="flex items-center gap-x-3 mb-4">
            <Link href="/linked-users" className="font-medium text-sm text-gray-500">Users</Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-sm text-gray-700">Add New User</span>
          </div>
          <h3 className="text-base font-medium sm:text-lg mb-4">New User</h3>

          <div className='rounded-xl bg-[#F9FAFB]'>
            <div className="mb-6 sm:mb-7">
              <div className="flex items-center justify-between overflow-x-auto py-4 scrollbar-hide px-21">
                {steps.map((step, idx) => (
                  <React.Fragment key={step.num}>
                    <div className="flex flex-col items-center min-w-[60px] sm:min-w-0 flex-shrink-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm sm:text-lg font-semibold mb-2 sm:mb-3",
                          step.num <= currentStep
                            ? "bg-teal-500 text-white shadow-md shadow-teal-500/50"
                            : "border-1 border-gray-300 font-normal bg-transparent text-gray-300"
                        )}
                      >
                        {step.num}
                      </div>
                      <span className={
                        cn("text-[10px] sm:text-sm font-medium text-center leading-tight px-1",
                        step.num <= currentStep
                        ? "text-gray-900"
                        : "text-gray-300"
                        )
                        }>
                        {step.label}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => handleSubmit(data))}>
              <FormField
                control={form.control}
                name="FullName"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b-1 border-gray-200">
                    <div className="flex flex-col gap-2">
                      <label className="font-medium">Full Name</label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <FormControl>
                        <Input className="h-11" placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="UserName"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b-1 border-gray-200">
                    <div className="flex flex-col gap-2">
                      <label className="font-medium">User Name</label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <FormControl>
                        <Input className="h-11" placeholder="Enter user name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="Email"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b-1 border-gray-200">
                    <div className="flex flex-col gap-2">
                      <label className="font-medium">Email</label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <FormControl>
                        <Input className="h-11" placeholder="Enter email address" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="PhoneNumber"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b-1 border-gray-200">
                    <div className="flex flex-col gap-2">
                      <label className="font-medium">Phone number</label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <FormControl>
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
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val || '');
                              // Extract country code
                              if (val) {
                                const countryCode = val.substring(0, val.indexOf(' ') || 0);
                                form.setValue('CountryCode', countryCode || '+1');
                              }
                            }}
                            className="w-full flex items-center gap-2"
                            countrySelectComponent={({ value, onChange, options }) => (
                              <select
                                value={value}
                                onChange={(e) => {
                                  onChange(e.target.value);
                                  form.setValue('CountryCode', e.target.value);
                                }}
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
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

            </form>
          </Form>
					<div className="space-y-4">



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
										placeholder="Search by zone's name"
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