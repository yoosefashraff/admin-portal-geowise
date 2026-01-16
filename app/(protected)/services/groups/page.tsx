'use client';

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import {
  CircleQuestionMark,
  PlusIcon,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import "react-phone-number-input/style.css";
import { Separator } from '@radix-ui/react-select';
import Link from "next/link";
import { CompanyService } from '@/lib/types/service.types';
import { User } from '@/lib/types/auth.types';
import { useAuthStore } from '@/lib/store/authStore';
import { deleteCompanyService, getServicesForCompany } from '@/lib/actions/service.actions';
import { toast } from 'sonner';
import CompanyServiceSkeleton from '@/components/skeleton/CompanyServiceSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import CustomPagination from '@/components/shared/CustomPagination';
import CompanyServiceItem from '@/components/shared/CompanyServiceItem';
import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ServiceGroupSkeleton from '@/components/skeleton/ServiceGroupSkeleton';
import ServiceGroupItem from '@/components/shared/ServiceGroupItem';

export default function ServiceGroupsPage() {
  const [value, setValue] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');
  const {user} = useAuthStore();
  const [data, setData] = useState<CompanyService[]>([]);
  const [filteredData, setFilteredData] = useState<CompanyService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const router = useRouter();

  async function load(user: User) {
    setLoading(true);
    const response = await getServicesForCompany({
      CompanyAdminId: user.UserID,
      PageNo: currentPage,
      RecordsPerPage: 10
    });

    if(response.Status !== 201){
      toast.error(response.Message);
      return;
    }

    setData(response.List);
    const totalPagesRes = Math.ceil(response.TotalCount / 10);
    setCurrentPage(currentPage > totalPagesRes ? totalPagesRes : currentPage);
    setTotalPages(totalPagesRes);
    setLoading(false);
  }

  useEffect(() => {
    if(user){
      load(user);
    }
  }, [user, currentPage]);

  useEffect(() => {
    setFilteredData(data);
  }, [data])

  useEffect(() => {
    let result = [...data];

    if (searchQuery) {
      result = result.filter(service =>
        service.ServiceName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredData(result);
  }, [searchQuery]);

  const handleDeleteItem = async (serviceId: number) => {
    const response = await deleteCompanyService({
      serviceId
    });

    if(response.Status === 201){
      toast.success(response.Message);
      load(user as User);
    }else{
      toast.error(response.Message);
    }
  };

  return (
    <div className='max-w-5xl mx-auto py-8 px-6'>

      <ButtonGroup className='mb-6'>
        <Button variant="outline" className="cursor-pointer" onClick={() => router.push('/services') } size="lg">
          Services
        </Button>
        <Button variant="outline" className="bg-gray-50" size="lg">
          Service Groups
        </Button>
      </ButtonGroup>

      {/* Header */}
      <div className="flex items-start">
        <DashboardHeader
          title="Services Groups"
          description="You will be able to assign service zones to each user on the next step."
          className="flex-1"
        />
        <Link href="/services/groups/add-new" className="h-9 cursor-pointer text-sm px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 font-medium text-white flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          New Service Group
        </Link>
      </div>

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
        <CardContent className="px-0">
          <div className="relative flex items-center mb-4">
            <Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
            <Input
              placeholder="Search for service group name"
              className="pl-10 pr-4 h-11 py-3 md:text-[16px] text-[16px] bg-gray-50 border-0"
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
              <tr className="bg-[#FCFCFC]">
                <th className="text-left py-3 px-6 text-xs font-medium rounded-l-lg text-gray-500">
                  Sevice Group
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                  Services included
                </th>
                <th className="w-12 rounded-r-lg"></th>
              </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <ServiceGroupSkeleton key={i} />
                  ))
                ) : filteredData.map((service, index) => (
                  <ServiceGroupItem 
                    key={service.Id} 
                    service={service} 
                    index={index} 
                    dataLength={filteredData.length} 
                    handleDeleteItem={handleDeleteItem}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <Separator className="my-4 h-px bg-gray-200" />

          {/* Pagination */}
          {loading ? (
             <div className="flex items-center gap-2 justify-between">
                <Skeleton className="h-6 w-[100px]" />
                <Skeleton className="h-6 w-[300px]" />
                <Skeleton className="h-6 w-[100px]" />
             </div>
          ) : (
            <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}

        </CardContent>
      </Card>
    </div>
  );
}