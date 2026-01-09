"use client";

import ProfilePageWrapper from "@/components/layout/ProfilePageWrapper";
import MediaUpload from "@/components/ui/media-upload";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getCompanyDetails, uploadWorkspaceImages } from "@/lib/actions/profile.action";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { set } from "zod";

export default function ProfileLogoPage() {

  const [dataLoading, setDataLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string>('');
  const { user } = useAuthStore();

  const load = async () => {
    setDataLoading(true);
    const response = await getCompanyDetails({userId: user?.UserID || 0});

    if(response.Status !== 201){
      toast.error(response.Message);
      return;
    }

    console.log(response.Object.ProfileImage);
    setLogo(response.Object.ProfileImage || '');

    setDataLoading(false);
  }

  useEffect(() => {
    if(!user) return;
    load();
  }, [user]);

  const handleUploadLogo = async (files: File[]) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('Type', 'profile');
    formData.append('ProviderId', String(user?.UserID || 0));
    files.forEach((file) => {
      formData.append('Files', file);
    })
    const response = await uploadWorkspaceImages(formData);

    if(response.Status !== 201){
      toast.error(response.Message);
      return;
    }

    // update company profile
    //
    toast.success(response.Message);
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <ProfilePageWrapper
        panelName="logo"
      >
        {(loading || dataLoading) && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/50 z-50">
            <div className="flex items-center gap-2">
              <Spinner className="size-8 text-gray-500" />
            </div>
          </div>
        )}
        {/* Content */}
        <div className="flex min-w-0 gap-8 pt-[16px]">
          <div className="flex-1 text-[#101828] text-[16px] font-medium leading-[44px]">
            Logo
          </div>
          <div className="flex-1">
            {dataLoading ? (
              <Skeleton className="h-22 w-22" />
            ) : (
              <MediaUpload
                initialImages={logo ? [logo] : []}
                multipleUpload={false}
                multiplePreview={false}
                onChange={(files) => {
                  handleUploadLogo(files);
                }}
              />
            )}
          </div>
        </div>
      </ProfilePageWrapper>
    </div>
  );
}