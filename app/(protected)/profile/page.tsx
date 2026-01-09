"use client";

import ProfilePageWrapper from "@/components/layout/ProfilePageWrapper";
import MapField from "@/components/shared/MapField";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { addAdminUserLocation } from "@/lib/actions/profile.action";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";

export default function ProfilePage() {

  const {user} = useAuthStore();
  const [mapValue, setMapValue] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const handleMapChange = (value: { lat: number; lng: number }) => {
    setMapValue(value);
  };

  const handleSave = async () => {
    setLoading(true);
    const response = await addAdminUserLocation({
      CompanyUserId: user?.UserID || 0, 
      Latitude: mapValue?.lat || 0, 
      Longitude: mapValue?.lng || 0
    });

    if(response.Status !== 201){
      toast.error(response.Message);
      return;
    }

    toast.success(response.Message);
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <ProfilePageWrapper
        panelName=""
      >
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/50 z-50">
            <div className="flex items-center gap-2">
              <Spinner className="size-8 text-gray-500" />
            </div>
          </div>
        )}
        {/* Content */}
        <div className="flex min-w-0 pt-[16px] pb-[12px] gap-8">
            <div className="flex-1 text-[#101828] text-[16px] font-medium leading-[24px]">Location</div>
            
            <div className="flex-1">
              <MapField value={mapValue} onChange={handleMapChange} />
            </div>
        </div>

        <Separator className="bg-gray-200 h-0.25 my-4" />
        <div className="flex justify-end gap-x-3">
          <Button 
            type="submit" 
            className="cursor-pointer" 
            onClick={handleSave}
            >
            Save
          </Button>
        </div>

      </ProfilePageWrapper>
    </div>
  );
}