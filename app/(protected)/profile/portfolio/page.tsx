"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ProfilePageWrapper from "@/components/layout/ProfilePageWrapper";
import { Textarea } from "@/components/ui/textarea";
import MediaUpload from "@/components/ui/media-upload";
import { useAuthStore } from "@/lib/store/authStore";
import { getCompanyDetails, saveCompanyBiography, uploadWorkspaceImages } from "@/lib/actions/profile.action";
import { toast } from "sonner";
import { CompanyDetails } from "@/lib/types/profile.types";
import { Separator } from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortfolioPage() {

  const {user} = useAuthStore();
  const [dataLoading, setDataLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biography, setBiography] = useState("");
  const [workSpaceImages, setWorkSpaceImages] = useState<string[]>([]);

  const load = async () => {
    setDataLoading(true);
    const response = await getCompanyDetails({userId: user?.UserID || 0});

    if(response.Status !== 201){
      toast.error(response.Message);
      return;
    }

    setBiography(response.Object.Biography || "");
    setWorkSpaceImages(response.Object.WorkSpaceImages.length > 0 ? response.Object.WorkSpaceImages[0] : []);

    setDataLoading(false);
  }

  useEffect(() => {
    if(!user) return;
    load();
  }, [user]);

  const handleSubmit = async () => {
    setLoading(true);
    const response = await saveCompanyBiography({BarberId: user?.UserID || 0, Description: biography});

    if(response.Status !== 201){
      toast.error(response.Message);
      return;
    }

    toast.success(response.Message);
    setLoading(false);
  }

  const handleUploadProfileImage = async (files: File[]) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('Type', 'portfolio');
    formData.append('ProviderId', String(user?.UserID || 0));
    files.forEach((file) => {
      formData.append('Files', file);
    })
    const response = await uploadWorkspaceImages(formData);

    if(response.Status !== 201){
      toast.error(response.Message);
      return;
    }
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <ProfilePageWrapper
        panelName="portfolio"
      > 
        {(loading || dataLoading) && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/50 z-50">
            <div className="flex items-center gap-2">
              <Spinner className="size-8 text-gray-500" />
            </div>
          </div>
        )}
        {/* Content */}
        <div className="flex min-w-0 gap-8 pt-[16px] pb-[16px] border-b border-[#E4E7EC]">
          <div className="flex-1 text-[#101828] text-[16px] font-medium leading-[44px]">
            Photos
          </div>
          <div className="flex-1">
            {dataLoading ? (
              <Skeleton className="h-22 w-22" />
            ) : (
              <MediaUpload
                initialImages={workSpaceImages}
                multipleUpload={false}
                onChange={(files) => {
                  handleUploadProfileImage(files);
                }}
              />
            )}
            
          </div>
        </div>

        <div className="flex min-w-0 pt-[16px] gap-8">
            <div className="basis-1/2 text-[#101828] text-[16px] font-medium leading-[44px]">Company biography</div>
            <div className="basis-1/2">
              <div className="row">
                <Textarea
                  id="description"
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Enter a description..."
                  className="px-[14px] py-[10px] min-h-[128px] resize-none placeholder:text-muted-foreground rounded-[8px] border-[#D0D5DD] shadow-[0px_1px_2px_0px_#1018280D] text-[16px] text-gray-900 placeholder:text-[#667085]  font-normal leading-[24px] space-y-4"
                />

                {/* <p className="mt-[6px] text-[14px] text-[#667085] font-normal leading-[20px] space-y-4 space-y-[14px]">
                  This is a hint text to help user.
                </p> */}
              </div>
            </div>
        </div>

        <Separator className="bg-gray-200 h-0.25 my-4" />
        <div className="flex justify-end gap-x-3">
          <Button 
            type="submit" 
            className="cursor-pointer" 
            onClick={handleSubmit}
            >
            Save
          </Button>
        </div>

      </ProfilePageWrapper>
    </div>
  );
}