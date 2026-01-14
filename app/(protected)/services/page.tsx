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

export default function ServiceLists() {
  const [value, setValue] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');
  const {user} = useAuthStore();
  const [data, setData] = useState<CompanyService[]>([]);
  const [filteredData, setFilteredData] = useState<CompanyService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  async function load(user: User) {
    setLoading(true);
    try {
      console.log('[Services Page] 🔄 Loading services...', {
        userId: user.UserID,
        currentPage,
        recordsPerPage: 10
      });
      
      const response = await getServicesForCompany({
        CompanyAdminId: user.UserID,
        PageNo: currentPage,
        RecordsPerPage: 10
      });

      console.log('[Services Page] 📥 API Response:', {
        status: response.Status,
        message: response.Message,
        listLength: response.List?.length || 0,
        totalCount: response.TotalCount
      });

      if(response.Status !== 201){
        console.error('[Services Page] ❌ API Error:', {
          status: response.Status,
          message: response.Message
        });
        toast.error(response.Message || 'Failed to load services');
        setData([]);
        setFilteredData([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      if (!response.List || !Array.isArray(response.List)) {
        console.warn('[Services Page] ⚠️ Invalid response format:', response);
        toast.error('Invalid response format from server');
        setData([]);
        setFilteredData([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      console.log(`[Services Page] ✅ Loaded ${response.List.length} services`);
      setData(response.List);
      const totalPagesRes = Math.ceil((response.TotalCount || 0) / 10) || 1;
      setCurrentPage(currentPage > totalPagesRes ? totalPagesRes : currentPage);
      setTotalPages(totalPagesRes);
    } catch (error: any) {
      console.error('[Services Page] ❌ Error loading services:', error);
      toast.error(error?.message || 'Failed to load services. Please check your connection.');
      setData([]);
      setFilteredData([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <div className="flex items-start">
        <DashboardHeader
          title="Services"
          description="You will be able to assign service zones to each user on the next step."
          className="flex-1"
        />
        <Link href="/services/add-new" className="h-9 cursor-pointer text-sm px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 font-medium text-white flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          New Service
        </Link>
      </div>

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
        <CardContent className="px-0">
          <div className="relative flex items-center mb-4">
            <Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
            <Input
              placeholder="Search for services"
              className="pl-10 pr-4 h-11 py-3 md:text-[16px] text-[16px] bg-gray-50 border-0"
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
              <tr className="bg-[#FCFCFC]">
                <th className="text-left py-3 px-6 text-xs font-medium rounded-l-lg text-gray-500">
                  Service Name
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1">
                    Price
                    <CircleQuestionMark className="w-4 h-4 text-gray-400" />
                  </div>
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                  Duration
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                  Assigned To
                </th>
                <th className="w-12 rounded-r-lg"></th>
              </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <CompanyServiceSkeleton key={i} />
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <CircleQuestionMark className="w-8 h-8 text-gray-400" />
                        <p className="text-sm">No services found</p>
                        <p className="text-xs text-gray-400">Create your first service by clicking "New Service"</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((service, index) => (
                    <CompanyServiceItem 
                      key={service.Id} 
                      service={service} 
                      index={index} 
                      dataLength={filteredData.length} 
                      handleDeleteItem={handleDeleteItem}
                    />
                  ))
                )}
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