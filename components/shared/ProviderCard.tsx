import {Calendar, ChevronRight} from "lucide-react";
import React from "react";
import Image from "next/image";
import {Provider} from "@/lib/types/provider.types";
import { checkInsideZone, cn, metersToMiles } from "@/lib/utils";
import { useSessionStorage } from "@/lib/hooks/useSessionStorage";

interface providerCardProps{
  provider: Provider
  isOutsideZone?: boolean,
  setSelectProvider: React.Dispatch<React.SetStateAction<string>>,
  selectProvider: string
}
export default function ProviderCard({ provider, selectProvider, setSelectProvider} : providerCardProps){

  const [location] = useSessionStorage('Location', '');

  const distanceInMiles = metersToMiles(parseFloat(provider.Distance));
  const distanceLabel = distanceInMiles ? `${distanceInMiles.toFixed(1)} mi` : 'N/A';

  return (
    <div 
      className={cn(`bg-white rounded-lg px-6 py-4  shadow-[0px_2px_24px_rgba(16,24,40,0.06)] border-2 border-transparent hover:border-gray-900 hover:shadow-md transition-shadow cursor-pointer`,
        selectProvider === provider.ProviderId.toString() && "border-gray-900 shadow-md"
      )}
      onClick={() => setSelectProvider(provider.ProviderId.toString())}
    >
      <div className="flex items-start gap-3 flex-1 mb-3">
        {/* Avatar */}
        <div className="relative">
          <Image
            width={48}
            height={48}
            src={provider.ProfileImage}
            alt={provider.ProviderName}
            className="w-12 h-12 rounded-full object-cover"
            unoptimized
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>

        {/* Provider Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{provider.ProviderName}</h3>
            {!provider.isInsideZone ? (
              <span className="text-sm text-red-600 font-medium">Outside service zone</span>
            ) : (
              <span className="text-sm text-green-600 font-medium">Inside service zone</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{distanceLabel === 'N/A' ? 'N/A' : `${distanceLabel} away`}</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        {/* Bookings Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 p-1 border-4 border-gray-50 rounded-full bg-gray-100">
            <Calendar className="w-4 h-4 text-gray-900" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{provider.TotalBookings} bookings</p>
            <p className="text-sm text-gray-500">This month</p>
          </div>
        </div>
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-900 flex-shrink-0 mt-1" />
      </div>
    </div>
  );
};