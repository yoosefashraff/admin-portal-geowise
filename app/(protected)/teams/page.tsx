'use client';

import React, { useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  CircleQuestionMark,
  MoreVertical, PlusIcon,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import "react-phone-number-input/style.css";
import { Arrow, Separator } from '@radix-ui/react-select';
import Image from "next/image";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";
import Link from "next/link";

export default function TeamsLists() {
  const [searchQuery, setSearchQuery] = useState('');

  const teams = [
    {
      id: 1,
      name: 'Street Mall - Square Market Team',
      zone: 'Street Mall - Square Market',
      availability: ['Monday', 'Tuesday', 'Wednesday'],
      assignedTo: [
        { name: 'Kim Geasley', avatar: 'KG', color: 'bg-purple-400' }
      ]
    },
    {
      id: 2,
      name: 'Rescue Team',
      zone: 'Not assigned',
      availability: ['Monday', 'Tuesday'],
      assignedTo: [
        { name: 'Person 1', avatar: 'P1', color: 'bg-pink-400' },
        { name: 'Person 2', avatar: 'P2', color: 'bg-green-400' },
        { name: 'Person 3', avatar: 'P3', color: 'bg-gray-400' },
        { name: 'Person 4', avatar: 'P4', color: 'bg-blue-400' }
      ],
      extraCount: 5
    },
    {
      id: 3,
      name: 'Zone Central',
      zone: 'Zone Central',
      availability: ['Monday', 'Tuesday'],
      assignedTo: [
        { name: 'Kim Geasley', avatar: 'KG', color: 'bg-blue-500' },
        { name: 'Rachel Agnoli', avatar: 'RA', color: 'bg-purple-500' }
      ],
      extraCount: 4
    },
    {
      id: 4,
      name: 'Suburban zone',
      zone: 'Suburban zone',
      availability: ['Monday', 'Tuesday'],
      assignedTo: [
        { name: 'Person 1', avatar: 'P1', color: 'bg-pink-400' },
        { name: 'Person 2', avatar: 'P2', color: 'bg-green-400' },
        { name: 'Person 3', avatar: 'P3', color: 'bg-gray-400' },
        { name: 'Person 4', avatar: 'P4', color: 'bg-blue-400' }
      ],
      extraCount: 5
    },
  ];

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='max-w-5xl mx-auto py-8 px-4'>
      {/* Header */}
      <div className="flex items-start">
        <DashboardHeader
          title="Teams"
          description="You will be able to assign service zones to each user on the next step."
          className="flex-1"
        />
        <Link href="/teams/add-new" className="h-9 cursor-pointer text-sm px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 font-medium text-white flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          New Team
        </Link>
      </div>

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
        <CardContent className="px-0">
          <div className="relative flex items-center mb-4">
            <Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
            <Input
              placeholder="Search for team name"
              className="pl-10 pr-4 h-11 py-3 md:text-[16px] text-[16px] bg-gray-50 border-0"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
              <tr className="bg-[#FCFCFC]">
                <th className="text-left py-3 px-6 text-xs font-medium rounded-l-lg text-gray-500">
                  Team Name
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                  Zone assigned
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                  Assigned To
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                  Availability
                </th>
                <th className="w-12 rounded-r-lg"></th>
              </tr>
              </thead>
              <tbody>
              {filteredTeams.map((member, index) => (
                <tr
                  key={member.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index === filteredTeams.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">
                    <Link href={`/teams/${member.id}/edit`} >{member.name}</Link>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {member.zone}
                  </td>
                  <td className="py-4 px-6 h-19">
                    <div className="flex items-center gap-2">
                      {member.assignedTo.length !== 2 && (
                        <div className="flex -space-x-2">
                          {member.assignedTo.slice(0, 4).map((person, i) => (
                            member.assignedTo.length == 1 ? (
                              <Image
                                key={i}
                                width={48}
                                height={48}
                                src="/images/avatar.png"
                                alt="Amy Oaks-Smith"
                                className="w-11 h-11 rounded-full object-cover border-3 border-white"
                              />
                            ) : (
                              <Image
                                key={i}
                                width={28}
                                height={28}
                                src="/images/avatar.png"
                                alt="Amy Oaks-Smith"
                                className="w-7 h-7 rounded-full object-cover border-3 border-white"
                              />
                            )
                          ))}
                        </div>
                      )}
                      {member.assignedTo.length === 1 && (
                        <span className="text-sm text-gray-500 ml-2">
                          {member.assignedTo[0].name}z
                        </span>
                      )}
                      {member.assignedTo.length === 2 && (
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-xs font-medium text-[#42576E] bg-[#F9FAFB] px-2 py-0.5 rounded-xl">
                            {member.assignedTo[0].name}
                          </span>
                        </div>
                      )}
                      {member.extraCount && (
                        <span className="text-xs font-medium bg-[#F9FAFB] px-2 py-0.5 text-cyan-700 rounded-xl">
                          +{member.extraCount}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 space-x-1">
                    {member.availability.length && member.availability.slice(0, 2).map((item, index) => (
                      <span key={index} className="text-xs font-medium text-[#42576E] bg-[#F9FAFB] px-2 py-0.5 rounded-xl">
                        {item}
                      </span>
                    ))}
                    {member.availability.length > 2 && (
                      <span className="text-xs font-medium bg-[#F9FAFB] text-[#42576E] px-2 py-0.5 rounded-xl">
                        +{member.availability.length - 2}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <button className="text-gray-500 hover:text-gray-600 transition-colors cursor-pointer">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
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
                  <PaginationLink className="text-gray-500 text-sm" href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink className="bg-gray-50 border-gray-50" href="#" isActive>2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink className="text-gray-500 text-sm" href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis className="text-gray-500" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink className="text-gray-500 text-sm" href="#">4</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink className="text-gray-500 text-sm" href="#">5</PaginationLink>
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

        </CardContent>
      </Card>
    </div>
  );
}