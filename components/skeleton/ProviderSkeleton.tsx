import {Skeleton} from "@/components/ui/skeleton";
import React from "react";

export default function ProviderSkeleton() {
  return (
    <div className={`bg-white rounded-lg px-6 py-4  shadow-[0px_2px_24px_rgba(16,24,40,0.06)] border-2 border-transparent hover:border-gray-900 hover:shadow-md transition-shadow cursor-pointer`}>
      <div className="flex items-start gap-3 flex-1 mb-3">
        {/* Avatar */}
        <div className="relative">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>

        {/* Provider Info */}
        <div className="flex-1">
          <Skeleton className="h-4 w-[200px] mb-1" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[200px]" />
      </div>
    </div>
  );
}