'use client';

import React, { useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import {ArrowLeft, ArrowRight, ChevronRight, MoveRight, PlusIcon, Search} from 'lucide-react';
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
import Image from "next/image";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";
import Link from "next/link";

export default function AddNewTeam() {

  return (
    <div className='max-w-5xl mx-auto py-8 px-4'>
      {/* Header */}
      <div className="flex items-start">
        <DashboardHeader
          title="Teams"
          description="You will be able to assign service zones to each user on the next step."
          className="flex-1"
        />
        <Button className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg bg-gray-900 font-medium text-white flex items-center gap-2">
          <PlusIcon />
          New Team
        </Button>
      </div>

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
        <CardContent className="px-0">
          <div className="flex items-center gap-x-3 mb-4">
            <Link href="/teams" className="font-medium text-sm text-gray-500">Teams</Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-sm text-gray-700">Add New Team</span>
          </div>
          <h3 className="text-base font-medium sm:text-lg mb-4">New Team</h3>
          <div className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <label className="font-medium">Team Name</label>
              </div>
              <div className="flex flex-col gap-2">
                <Input className="h-11 md:text-[16px] border-gray-300" placeholder="Street Mall - Square Market Team" />
              </div>
            </div>
            <Separator className="bg-gray-200 h-0.25" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex">
                <label className="font-medium">Zone assigned</label>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex-1 relative">
                  <Select>
                    <SelectTrigger className="w-full text-[16px] data-[size=default]:h-11 data-[placeholder]:text-gray-900">
                      <SelectValue placeholder="Zone assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="1">Street Mall - Square Market</SelectItem>
                        <SelectItem value="2">Street Mall - Square Market 2</SelectItem>
                        <SelectItem value="3">Street Mall - Square Market 3</SelectItem>
                        <SelectItem value="4">Street Mall - Square Market 4</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-gray-100 rounded-4xl h-[418px] w-full"></div>
              </div>
            </div>
            <Separator className="bg-gray-200 h-0.25" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-7">
              <div className="flex">
                <label className="font-medium">Assign to</label>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
                  <Input
                    placeholder="Search by provider’s name"
                    className="pl-10 pr-4 h-11 py-3 md:text-[16px] bg-gray-50 border-0"
                  />
                </div>
                <div>
                  <div className="px-6 py-3 text-sm font-medium text-gray-500 bg-[#FCFCFD]">
                    Provider Name
                  </div>
                  <div className="flex flex-col">

                    <div className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
                      <Checkbox id="checkbox1" checked className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
                      <Label htmlFor="checkbox1" className="font-medium text-sm flex gap-3 items-center">
                        <Image
                          width={40}
                          height={40}
                          src="/images/avatar.png"
                          alt="Amy Oaks-Smith"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="flex-1">Kim Geasley</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
                      <Checkbox id="checkbox2" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
                      <Label htmlFor="checkbox2" className="font-medium text-sm flex gap-3 items-center">
                        <Image
                          width={40}
                          height={40}
                          src="/images/avatar.png"
                          alt="Amy Oaks-Smith"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="flex-1">Amy Oaks-Smith</span>
                      </Label>
                    </div>

                    <div className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
                      <Checkbox id="checkbox3" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
                      <Label htmlFor="checkbox3" className="font-medium text-sm flex gap-3 items-center">
                        <Image
                          width={40}
                          height={40}
                          src="/images/avatar.png"
                          alt="Amy Oaks-Smith"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="flex-1">Kim Geasley</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
                      <Checkbox id="checkbox4" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
                      <Label htmlFor="checkbox4" className="font-medium text-sm flex gap-3 items-center">
                        <Image
                          width={40}
                          height={40}
                          src="/images/avatar.png"
                          alt="Amy Oaks-Smith"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="flex-1">Amy Oaks-Smith</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
                      <Checkbox id="checkbox5" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
                      <Label htmlFor="checkbox5" className="font-medium text-sm flex gap-3 items-center">
                        <Image
                          width={40}
                          height={40}
                          src="/images/avatar.png"
                          alt="Amy Oaks-Smith"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="flex-1">Kim Geasley</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
                      <Checkbox id="checkbox6" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
                      <Label htmlFor="checkbox6" className="font-medium text-sm flex gap-3 items-center">
                        <Image
                          width={40}
                          height={40}
                          src="/images/avatar.png"
                          alt="Amy Oaks-Smith"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="flex-1">Amy Oaks-Smith</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
                      <Checkbox id="checkbox7" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
                      <Label htmlFor="checkbox7" className="font-medium text-sm flex gap-3 items-center">
                        <Image
                          width={40}
                          height={40}
                          src="/images/avatar.png"
                          alt="Amy Oaks-Smith"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="flex-1">Kim Geasley</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-[12px] px-6 py-4 transition mb-0">
                      <Checkbox id="checkbox8" className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" />
                      <Label htmlFor="checkbox8" className="font-medium text-sm flex gap-3 items-center">
                        <Image
                          width={40}
                          height={40}
                          src="/images/avatar.png"
                          alt="Amy Oaks-Smith"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="flex-1">Amy Oaks-Smith</span>
                      </Label>
                    </div>
                  </div>
                  <Separator className="my-4 h-px bg-gray-200" />

                  {/* Pagination */}
                  <div className="flex items-center gap-2 justify-between">
                    <button
                      className="cursor-pointer px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationLink className="text-sm border-gray-50 bg-gray-50" href="#" isActive>1</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink className="text-gray-500 text-sm" href="#" >2</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationEllipsis className="text-gray-500" />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink className="text-gray-500 text-sm" href="#">6</PaginationLink>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>

                    <button
                      className="cursor-pointer px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-semibold text-gray-700 flex items-center gap-2"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
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
                  <AvailabilityCard key={2} dayOfWeek="Tuesday" isAvailable={false} />
                  <AvailabilityCard key={3} dayOfWeek="Wednesday" isAvailable={false} />
                  <AvailabilityCard key={4} dayOfWeek="Thursday" isAvailable={false} />
                  <AvailabilityCard key={5} dayOfWeek="Friday" isAvailable={false} />
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