'use client';

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import {PlusIcon,Search} from 'lucide-react';
import { Input } from '@/components/ui/input';
import "react-phone-number-input/style.css";
import { Arrow, Separator } from '@radix-ui/react-select';
import Link from "next/link";
import { useAuthStore } from '@/lib/store/authStore';
import { ServiceZone, Zone } from '@/lib/types/zone.types';
import { User } from '@/lib/types/auth.types';
import { deleteCompanyServiceZone, getServiceZoneColorList, getZonesForCompany } from '@/lib/actions/zone.actions';
import { toast } from 'sonner';
import CustomPagination from '@/components/shared/CustomPagination';
import ZoneItem from '@/components/shared/ZoneItem';
import ZoneSkeleton from '@/components/skeleton/ZoneSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import MapZoneDrawer from '@/components/shared/MapZoneDrawer';

export default function ServiceZones() {
  const [searchQuery, setSearchQuery] = useState('');
  const {user} = useAuthStore();
  const [data, setData] = useState<ServiceZone[]>([]);
  const [filteredData, setFilteredData] = useState<ServiceZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zones, setZones] = useState<Zone[]>([]);
  const [colorZones, setColorZones] = useState<{Key: string, Value: string}[]>([]);

  async function load(user: User) {
    setLoading(true);
    const response = await getZonesForCompany({
      CompanyAdminId: user.UserID,
      PageNo: currentPage,
      RecordsPerPage: 10
    });

    if(response.Status !== 201){
      toast.error(response.Message);
      return;
    }

    const responseColor = await getServiceZoneColorList();
    setColorZones(responseColor.List);

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
    setZones(data.map(zone => {
      return {
        id: zone.ID,
        name: zone.Name,
        providers: zone.Providers?.map(provider => provider.ProviderName),
        points: JSON.parse(zone.Coordinates)
      }
    }));
  }, [data])

  useEffect(() => {
    let result = [...data];

    if (searchQuery) {
      result = result.filter(zone =>
        zone.Name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredData(result);
  }, [searchQuery]);

  const handleDeleteItem = async (ServiceZoneId: number) => {
    const response = await deleteCompanyServiceZone({
      ServiceZoneId
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
          title="Service Zones"
          description="You will be able to assign service zones to each user on the next step."
          className="flex-1"
        />
        <Link href="/zones/add-new" className="h-9 cursor-pointer text-sm px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 font-medium text-white flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          New Service Zone
        </Link>
      </div>

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06) p-6">
        <CardContent className="px-0">

          <div className='mb-4'>
            {loading || zones.length === 0 ? <Skeleton className="h-[374px] w-full" /> : (
              <MapZoneDrawer 
                zones={zones} 
                height="374px" 
                enableDrawing={false} 
                colorZones={colorZones}
              />
            )}
          </div>

          <div className="relative flex items-center mb-4">
            <Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for zone name"
              className="pl-10 pr-4 h-11 py-3 md:text-[16px] text-[16px] bg-gray-50 border-0"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
              <tr className="bg-[#FCFCFC]">
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
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <ZoneSkeleton key={i} />
                ))
              ) : filteredData.map((zone, index) => (
                <ZoneItem
                  key={zone.ID}
                  zone={zone}
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