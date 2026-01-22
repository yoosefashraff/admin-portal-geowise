'use client';

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import {
  PlusIcon,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import "react-phone-number-input/style.css";
import { Separator } from '@radix-ui/react-select';
import Link from "next/link";
import { User } from '@/lib/types/auth.types';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import CustomPagination from '@/components/shared/CustomPagination';
import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import ServiceGroupSkeleton from '@/components/skeleton/ServiceGroupSkeleton';
import ServiceGroupItem from '@/components/shared/ServiceGroupItem';
import { ServiceGroup } from '@/lib/types/serviceGroup.types';
import { deleteServiceGroup, getServiceGroupList, linkServicesToGroup } from '@/lib/actions/serviceGroup.actions';

export default function ServiceGroupsPage() {
  const [value, setValue] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');
  const {user} = useAuthStore();
  const [data, setData] = useState<ServiceGroup[]>([]);
  const [filteredData, setFilteredData] = useState<ServiceGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function load(user: User) {
    setLoading(true);
    const response = await getServiceGroupList();

    if(response.Status !== 201 || !response.List){
      toast.error(response.Message || 'Failed to load service groups');
      setData([]);
      setFilteredData([]);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setData(response.List);
    const totalPagesRes = Math.ceil((response.List.length || 0) / 10) || 1;
    setCurrentPage(currentPage > totalPagesRes ? totalPagesRes : currentPage);
    setTotalPages(totalPagesRes);
    setLoading(false);
  }

  useEffect(() => {
    if(user){
      load(user);
    }
  }, [user, currentPage]);

  // Reload data when refresh parameter is present (e.g., when navigating from add page)
  useEffect(() => {
    const refresh = searchParams.get('refresh');
    if (refresh && user) {
      // Small delay to ensure the API has processed the new group
      const timer = setTimeout(() => {
        load(user);
        // Clean up the URL by removing the refresh parameter
        router.replace('/services/groups');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, user, router]);

  useEffect(() => {
    setFilteredData(data);
  }, [data])

  useEffect(() => {
    let result = [...data];

    if (searchQuery) {
      result = result.filter(group =>
        group.Name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredData(result);
  }, [searchQuery]);

  const handleDeleteItem = async (groupId: number) => {
    let response = await deleteServiceGroup(groupId);

    // If deletion fails due to linked services, automatically unlink all services and retry
    if (response.Status !== 201 && response.Message?.toLowerCase().includes('linked') && response.Message?.toLowerCase().includes('service')) {
      console.log('[handleDeleteItem] 🔗 Detected linked services error, unlinking all services...');
      
      try {
        // Unlink all services by calling linkServicesToGroup with empty array
        const unlinkResponse = await linkServicesToGroup({
          groupId: groupId,
          serviceIds: []
        });
        
        if (unlinkResponse.Status === 201 || unlinkResponse.Status === 200) {
          console.log('[handleDeleteItem] ✅ Successfully unlinked all services, retrying deletion...');
          // Retry deletion after unlinking
          response = await deleteServiceGroup(groupId);
        } else {
          console.warn('[handleDeleteItem] ⚠️ Failed to unlink services:', unlinkResponse.Message);
        }
      } catch (unlinkError: any) {
        console.error('[handleDeleteItem] ❌ Error unlinking services:', unlinkError);
      }
    }

    if(response.Status === 201 || response.Status === 200){
      toast.success(response.Message || 'Service group deleted');
      load(user as User);
    }else{
      toast.error(response.Message || 'Failed to delete service group');
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
                ) : filteredData.map((group, index) => (
                  <ServiceGroupItem 
                    key={group.Id} 
                    group={group} 
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